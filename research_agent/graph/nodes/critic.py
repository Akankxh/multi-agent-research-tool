import json
import re
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from graph.state import ResearchState

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

CRITIC_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a research quality critic. Evaluate the findings for each
sub-question on depth, accuracy, and source quality.

Score each sub-question from 0.0 to 1.0. A score below 0.6 means the
research needs more work.

You MUST respond with ONLY a raw JSON object. No markdown, no code fences, no explanation.
Example:
{{"scores": [0.8, 0.5, 0.9], "critique": "brief explanation", "pass": true}}

Set "pass" to false if ANY score is below 0.6.""",
    ),
    (
        "human",
        "Original query: {query}\n\nFindings:\n{findings}",
    ),
])


def clean_json(text: str) -> str:
    """Strip markdown code fences if the model wraps its response in them."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def critic_node(state: ResearchState) -> dict:
    findings_str = "\n\n".join([
    f"Q: {sq['question']}\nA: {sq['findings'][:300]}"
    for sq in state["sub_questions"]
    ])

    chain = CRITIC_PROMPT | llm
    result = chain.invoke({
        "query": state["query"],
        "findings": findings_str,
    })

    cleaned = clean_json(result.content)
    data = json.loads(cleaned)

    updated_sqs = []
    for sq, score in zip(state["sub_questions"], data["scores"]):
        updated_sqs.append({**sq, "quality_score": score})

    return {
        "sub_questions": updated_sqs,
        "critique": data["critique"],
        "retry_count": state["retry_count"] + 1,
    }


def should_retry(state: ResearchState) -> str:
    has_weak = any(
        sq["quality_score"] < 0.6
        for sq in state["sub_questions"]
    )
    if has_weak and state["retry_count"] < 2:
        return "retry"
    return "write"