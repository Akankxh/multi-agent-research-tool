from typing import Annotated, TypedDict
import operator


class SubQuestion(TypedDict):
    question: str
    findings: str
    sources: list[str]
    quality_score: float


def merge_sub_questions(left: list, right: list) -> list:
    if not left:
        return right
    if not right:
        return left
    updates = {sq["question"]: sq for sq in right}
    merged = []
    for sq in left:
        if sq["question"] in updates:
            merged.append(updates[sq["question"]])
        else:
            merged.append(sq)
    return merged


class ResearchState(TypedDict):
    query: str
    sub_questions: Annotated[list[SubQuestion], merge_sub_questions]
    retry_count: int
    critique: str
    final_report: str
    # Remove messages entirely — it was accumulating Send objects
    # which are not JSON serializable and can't be stored in Postgres