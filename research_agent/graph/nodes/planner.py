import json
import re
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from graph.state import ResearchState

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

PLANNER_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a research planner. Given a user query, break it into
3-5 focused sub-questions that together fully answer the main query.

You MUST respond with ONLY a raw JSON object. No markdown, no code fences, no explanation.
Example:
{{"sub_questions": ["question 1", "question 2", "question 3"]}}""",
    ),
    ("human", "{query}"),
])


def clean_json(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def planner_node(state: ResearchState) -> dict:
    chain = PLANNER_PROMPT | llm
    result = chain.invoke({"query": state["query"]})

    cleaned = clean_json(result.content)
    data = json.loads(cleaned)

    sub_questions = [
        {
            "question": q,
            "findings": "",
            "sources": [],
            "quality_score": 0.0,
        }
        for q in data["sub_questions"]
    ]

    return {
        "sub_questions": sub_questions,
        "retry_count": 0,
        "critique": "",
    }