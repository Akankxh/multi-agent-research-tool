# 🔬 Multi-Agent Research Tool

> An AI-powered research assistant that breaks down complex queries into parallel sub-questions, researches each independently, critiques the results, and synthesizes a final report — all streamed in real time.

**🚀 Live Demo: [multi-agent-research-tool-1.onrender.com](https://multi-agent-research-tool-1.onrender.com/)**

---

## How It Works

The system runs a multi-step LangGraph pipeline with four specialized agents:

```
User Query
    │
    ▼
┌─────────┐     breaks query into      ┌────────────┐
│ Planner │ ──  sub-questions ───────► │ Researcher │ (parallel)
└─────────┘                            └────────────┘
                                             │
                                             ▼
                                       ┌─────────┐
                                       │  Critic │ ── scores each answer
                                       └─────────┘
                                             │
                                    ┌────────┴────────┐
                                    │                 │
                                  retry             write
                                    │                 │
                                    ▼                 ▼
                              ┌──────────┐      ┌────────┐
                              │Researcher│      │ Writer │ ── final report
                              └──────────┘      └────────┘
```

**Planner** — decomposes the user's query into focused sub-questions for parallel research.

**Researcher** — each sub-question is researched independently using web search (Tavily), with results gathered in parallel.

**Critic** — evaluates the quality of each answer with a score. If quality is below threshold, it sends the researchers back for another pass.

**Writer** — synthesizes all research into a coherent, streamed final report.

---

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — async REST API with SSE streaming
- [LangGraph](https://langchain-ai.github.io/langgraph/) — agent orchestration and state machine
- [LangChain](https://www.langchain.com/) — LLM tooling and integrations
- [Groq](https://groq.com/) — LLM inference (fast inference via `langchain-groq`)
- [Tavily](https://tavily.com/) — web search API for the researcher agents
- [PostgreSQL](https://www.postgresql.org/) — persistent checkpointing via `langgraph-checkpoint-postgres`
- [LangSmith](https://smith.langchain.com/) — tracing and observability

**Frontend**
- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- Real-time SSE streaming UI
- Dark/light mode, research history, report viewer

---

## Project Structure

```
multi-agent-research-assistant/
├── research_agent/
│   ├── graph/
│   │   ├── nodes/
│   │   │   ├── planner.py       # query decomposition
│   │   │   ├── researcher.py    # parallel web research
│   │   │   ├── critic.py        # quality scoring + retry logic
│   │   │   └── writer.py        # final report generation
│   │   ├── graph.py             # LangGraph state machine
│   │   └── state.py             # shared ResearchState
│   ├── main.py                  # FastAPI app + SSE streaming
│   ├── requirements.txt
│   └── .python-version
└── research-ui/
    ├── src/
    │   ├── components/
    │   │   ├── QueryCard.jsx     # query input
    │   │   ├── Pipeline.jsx      # agent pipeline visualization
    │   │   ├── CriticCard.jsx    # critic scores display
    │   │   ├── ReportCard.jsx    # streamed report viewer
    │   │   ├── HistoryTab.jsx    # past research sessions
    │   │   └── Sidebar.jsx       # navigation
    │   └── App.jsx
    └── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/research` | Start a research run, streams SSE events |
| `GET` | `/report/{thread_id}` | Fetch the final report for a completed thread |
| `GET` | `/resume/{thread_id}` | Get full state of a research thread |
| `GET` | `/history/{thread_id}` | Get checkpoint history for a thread |
| `GET` | `/health` | Health check |

---

## Running Locally

**Backend**

```bash
cd research_agent
python -m venv .venv
source .venv/Scripts/activate  # Windows
# source .venv/bin/activate    # Mac/Linux

pip install -r requirements.txt
```

Create a `.env` file in `research_agent/`:

```env
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
LANGSMITH_API_KEY=your_langsmith_key  # optional
DATABASE_URL=your_postgres_url
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

**Frontend**

```bash
cd research-ui
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## Deployment

Deployed on [Render](https://render.com/):

- **Backend** — Python Web Service, root directory `research_agent`
- **Frontend** — Static Site, root directory `research-ui`, publish directory `dist`
- **Database** — Render PostgreSQL (persistent checkpointing)

Environment variables are configured via Render's dashboard — no `.env` file in production.
