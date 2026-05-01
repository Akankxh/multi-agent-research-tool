from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from graph.state import ResearchState

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.3)

WRITER_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        """You are a professional research writer. Synthesize the provided
research findings into a well-structured markdown report.

Structure:
# [Report Title]

## Executive Summary
2-3 sentence overview.

## [Section per sub-question]
Detailed content with inline citations [1], [2].

## References
Numbered list of all source URLs.

Be comprehensive, clear, and professional.""",
    ),
    (
        "human",
        """Query: {query}

Research findings:
{findings}

Critic feedback to address: {critique}""",
    ),
])


def writer_node(state: ResearchState) -> dict:
    findings_str = "\n\n".join([
    f"### {sq['question']}\n{sq['findings'][:500]}\nSources: {', '.join(sq['sources'][:2])}"
    for sq in state["sub_questions"]
    ])

    chain = WRITER_PROMPT | llm
    response = chain.invoke({
        "query": state["query"],
        "findings": findings_str,
        "critique": state.get("critique") or "None",
    })

    return {"final_report": response.content}