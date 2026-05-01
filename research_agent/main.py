import json
import os
import uuid
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

load_dotenv()

from graph.graph import builder

graph = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global graph
    async with AsyncSqliteSaver.from_conn_string("checkpoints.db") as checkpointer:
        graph = builder.compile(checkpointer=checkpointer)
        yield


app = FastAPI(title="Research Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://multi-agent-research-tool-1.onrender.com"  # add this once you know it
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str
    thread_id: str | None = None


def make_config(thread_id: str, query: str = "") -> dict:
    return {
        "configurable": {"thread_id": thread_id},
        "run_name": f"research:{thread_id[:8]}",
        "tags": ["research-agent"],
        "metadata": {"query": query},
    }


@app.post("/research")
async def research(req: QueryRequest):
    thread_id = req.thread_id or str(uuid.uuid4())
    config = make_config(thread_id, req.query)

    async def stream_events():
        yield f"data: {json.dumps({'thread_id': thread_id})}\n\n"

        writer_active = False  # track when writer node is running

        async for event in graph.astream_events(
            {"query": req.query, "messages": []},
            config=config,
            version="v2",
        ):
            kind = event["event"]
            name = event.get("name", "")

            # Track when writer starts
            if kind == "on_chain_start" and name == "writer":
                writer_active = True

            # Track when writer ends
            if kind == "on_chain_end" and name == "writer":
                writer_active = False

            # Node completion pings
            if kind == "on_chain_end":
                if name in ("planner", "researcher", "critic", "writer"):
                    payload: dict = {"node": name, "status": "done"}

                    if name == "critic":
                        output = event.get("data", {}).get("output", {})
                        sqs = output.get("sub_questions", [])
                        payload["scores"] = [
                            {
                                "question": sq["question"][:60],
                                "score": sq["quality_score"],
                            }
                            for sq in sqs
                        ]
                        payload["retry_count"] = output.get("retry_count", 0)
                        payload["critique"] = output.get("critique", "")

                    yield f"data: {json.dumps(payload)}\n\n"

            # Stream writer tokens — catch ALL model stream events when writer is active
            if kind == "on_chat_model_stream" and writer_active:
                chunk = event.get("data", {}).get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    yield f"data: {json.dumps({'token': chunk.content})}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(stream_events(), media_type="text/event-stream")


@app.get("/report/{thread_id}")
async def get_report(thread_id: str):
    config = make_config(thread_id)
    state = await graph.aget_state(config)

    if not state or not state.values:
        raise HTTPException(status_code=404, detail="No state found")

    report = state.values.get("final_report")
    if not report:
        raise HTTPException(status_code=404, detail="Report not ready yet")

    return {"thread_id": thread_id, "report": report}


@app.get("/resume/{thread_id}")
async def resume(thread_id: str):
    config = make_config(thread_id)
    state = await graph.aget_state(config)

    if not state or not state.values:
        raise HTTPException(status_code=404, detail="No state found for this thread_id")

    v = state.values
    return {
        "thread_id": thread_id,
        "query": v.get("query"),
        "retry_count": v.get("retry_count", 0),
        "critique": v.get("critique", ""),
        "sub_questions": v.get("sub_questions", []),
        "final_report": v.get("final_report"),
    }


@app.get("/history/{thread_id}")
async def history(thread_id: str):
    config = make_config(thread_id)
    snapshots = []
    async for snapshot in graph.aget_state_history(config):
        snapshots.append(snapshot)

    return {
        "thread_id": thread_id,
        "total_checkpoints": len(snapshots),
        "steps": [
            {
                "step": i,
                "node": s.metadata.get("source"),
                "retry_count": s.values.get("retry_count", 0),
            }
            for i, s in enumerate(snapshots)
        ],
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
##uvicorn main:app --reload --port 8000
##source .venv/Scripts/activate

'''curl -X POST http://127.0.0.1:8000/research \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d "{\"query\": \"impact of LeBron James in Basketball\", \"thread_id\": \"test-023\"}" \
  --no-buffer \
  --max-time 120'''
  
  #curl http://127.0.0.1:8000/report/test-004 | python -c "import sys,json; print(json.load(sys.stdin)['report'])"