from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from graph.state import ResearchState
from graph.nodes.planner import planner_node
from graph.nodes.researcher import researcher_node, fan_out_researchers
from graph.nodes.critic import critic_node, should_retry
from graph.nodes.writer import writer_node


def build_graph():
    g = StateGraph(ResearchState)

    g.add_node("planner", planner_node)
    g.add_node("researcher", researcher_node)
    g.add_node("critic", critic_node)
    g.add_node("writer", writer_node)

    g.add_edge(START, "planner")
    g.add_conditional_edges("planner", fan_out_researchers, ["researcher"])
    g.add_edge("researcher", "critic")
    g.add_conditional_edges(
        "critic",
        should_retry,
        {"retry": "researcher", "write": "writer"},
    )
    g.add_edge("writer", END)

    return g  # return uncompiled, we compile in lifespan


builder = build_graph()
graph = None  # will be set in lifespan