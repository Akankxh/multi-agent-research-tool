from typing import Annotated, TypedDict
import operator


class SubQuestion(TypedDict):
    question: str
    findings: str
    sources: list[str]
    quality_score: float


def merge_sub_questions(left: list, right: list) -> list:
    """
    Merges researcher results back into the sub_questions list.
    Matches by question text and updates findings/sources in place.
    """
    if not left:
        return right
    if not right:
        return left

    # Build a lookup from the incoming right (researcher output)
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
    # Annotated with custom merger so parallel researchers can each write
    sub_questions: Annotated[list[SubQuestion], merge_sub_questions]
    retry_count: int
    critique: str
    final_report: str
    messages: Annotated[list, operator.add]