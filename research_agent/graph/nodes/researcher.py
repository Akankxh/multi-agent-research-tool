from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langgraph.types import Send
from graph.state import ResearchState, SubQuestion
from tools.search import search_tool

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

RESEARCHER_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a thorough research assistant. Using the provided search
results, write a detailed and factual answer to the question.
Include specific facts and cite sources inline as [1], [2] etc.""",
    ),
    (
        "human",
        "Question: {question}\n\nSearch results:\n{search_results}",
    ),
])


def researcher_node(sub_question: SubQuestion) -> dict:
    # Handle both direct SubQuestion dict and nested state dict
    if "question" not in sub_question:
        # Called from retry — sub_question is actually the full state
        # re-research only the weak sub-questions
        results = []
        for sq in sub_question.get("sub_questions", []):
            if sq.get("quality_score", 1.0) < 0.6:
                results.append(_research_one(sq))
            else:
                results.append(sq)
        return {"sub_questions": results}

    # Normal fan-out path — single SubQuestion
    updated = _research_one(sub_question)
    return {"sub_questions": [updated]}


def _research_one(sq: SubQuestion) -> SubQuestion:
    """Does the actual search + LLM call for one sub-question."""
    raw_results = search_tool.invoke(sq["question"])

    results_str = "\n\n".join([
        f"[{i+1}] {r['content'][:400]} (source: {r['url']})"
        for i, r in enumerate(raw_results)
    ])
    sources = [r["url"] for r in raw_results]

    chain = RESEARCHER_PROMPT | llm
    response = chain.invoke({
        "question": sq["question"],
        "search_results": results_str,
    })

    return {
        **sq,
        "findings": response.content,
        "sources": sources,
    }


def fan_out_researchers(state: ResearchState) -> list[Send]:
    """Initial fan-out — one Send per sub-question."""
    return [
        Send("researcher", sq)
        for sq in state["sub_questions"]
    ]