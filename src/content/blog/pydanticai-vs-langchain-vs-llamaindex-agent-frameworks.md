---
title: "PydanticAI vs. LangChain vs. LlamaIndex: picking an agent framework in 2026"
description: "A pragmatic comparison of PydanticAI, LangChain/LangGraph and LlamaIndex for building production LLM agents. Type safety, tool calling, retrieval, observability, and where each one breaks at scale."
date: "2026-05-26"
category: "AI"
tags: ["python", "llm", "agents", "pydantic-ai", "langchain", "llamaindex", "mlops"]
featured: true
author: "Joel Perca"
---

Every team I talk to is sitting on the same pile of code: a `chains/` folder, a `tools/` folder, a `prompts/` folder, three different ways to call OpenAI, and a Slack thread titled "do we still need LangChain?". The frameworks that felt indispensable in 2023 have become the thing teams quietly rewrite around in 2026.

After porting two production agents and a research pipeline across the three big options — [PydanticAI](https://ai.pydantic.dev/), [LangChain](https://www.langchain.com/) (plus [LangGraph](https://langchain-ai.github.io/langgraph/)) and [LlamaIndex](https://www.llamaindex.ai/) — I have a clear ordering for *which one I reach for first*. Spoiler: it depends on what you're actually building, but the default is no longer LangChain.

## TL;DR

- **PydanticAI** is what you want when the agent is part of a real backend: typed inputs and outputs, dependency injection, model-agnostic, and the runtime contract is a Pydantic model rather than a string.
- **LangChain + LangGraph** is the broadest ecosystem — hundreds of integrations and the best story for stateful, branching multi-agent graphs. The cost is abstraction weight and a moving API.
- **LlamaIndex** still wins on retrieval. If your product is "talk to my documents / database / code", its index abstractions, query engines, and node post-processors save you weeks.
- The three are not mutually exclusive: a healthy stack today is usually **PydanticAI for the agent surface, LlamaIndex for retrieval, and LangGraph only when the control flow genuinely needs a graph**.
- For anything where you'd otherwise write a one-off LCEL chain, just call the model SDK directly. Frameworks should earn their place.

## What each one actually is

It's worth being precise, because the marketing pages blur the lines.

- **PydanticAI** is an agent framework from the Pydantic team. The unit of work is an `Agent` parameterised by an input type, an output type, and a set of tools. Outputs are validated Pydantic models. It's model-agnostic (OpenAI, Anthropic, Gemini, Bedrock, local via Ollama/vLLM) and integrates natively with [Logfire](https://pydantic.dev/logfire) for tracing.
- **LangChain** is a runtime (the Runnable / LCEL interface) plus a massive integration layer. **LangGraph** is the sibling project for stateful, multi-step agents expressed as graphs of nodes with shared state and conditional edges.
- **LlamaIndex** started as a RAG toolkit and grew agents on top. Its core primitives are `Document`, `Node`, `Index`, `Retriever`, `QueryEngine`, and now `Workflow` for event-driven agent control flow.

The framing matters: PydanticAI optimises for **typed function-like agents**, LangGraph for **graphs of state**, and LlamaIndex for **data-aware retrieval**. Mixing them up is where most of the pain comes from.

## API ergonomics, side by side

Here's the same trivial agent — "answer a customer question, optionally calling a `get_order` tool" — in each framework. I'll keep the imports honest so you can see the surface area.

### PydanticAI

```python
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

class OrderQuery(BaseModel):
    customer_id: str
    question: str

class Reply(BaseModel):
    answer: str
    referenced_order: str | None = None

agent = Agent(
    "anthropic:claude-sonnet-4-6",
    deps_type=OrderQuery,
    output_type=Reply,
    system_prompt="You are a polite support agent.",
)

@agent.tool
async def get_order(ctx: RunContext[OrderQuery], order_id: str) -> dict:
    return await db.fetch_order(ctx.deps.customer_id, order_id)

result = await agent.run("Where is order #4567?", deps=query)
reply: Reply = result.output
```

The whole thing is a function: typed input, typed output, tools are decorated coroutines, and the model is a string you can swap. There's no `Runnable`, no `AgentExecutor`, no `prompt | model | parser` pipe.

### LangChain + LangGraph

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

@tool
def get_order(order_id: str) -> dict:
    """Fetch an order by id."""
    return db.fetch_order_sync(order_id)

llm = ChatAnthropic(model="claude-sonnet-4-6")
agent = create_react_agent(llm, tools=[get_order])

result = agent.invoke({"messages": [("user", "Where is order #4567?")]})
```

This is the *short* version, using the prebuilt ReAct agent. The moment you need a custom control flow — "retrieve, then plan, then loop on tool calls until confident, then summarise" — you drop into LangGraph proper, defining a `StateGraph`, typed `State`, nodes, and conditional edges. That's where it earns its weight, and where the other two start to creak.

### LlamaIndex

```python
from llama_index.core.agent.workflow import FunctionAgent
from llama_index.llms.anthropic import Anthropic

def get_order(order_id: str) -> dict:
    """Fetch an order by id."""
    return db.fetch_order_sync(order_id)

agent = FunctionAgent(
    tools=[get_order],
    llm=Anthropic(model="claude-sonnet-4-6"),
    system_prompt="You are a polite support agent.",
)

response = await agent.run("Where is order #4567?")
```

Clean for tool use, but you can feel that agents aren't the centre of gravity here. The richness shows up when you wire in `VectorStoreIndex`, `QueryEngine`, and node post-processors — which is exactly the point.

## Type safety and structured output

This is where PydanticAI pulls ahead for backend work.

A real production agent doesn't return prose; it returns a `Reply`, a `Ticket`, a `RefundDecision`. Every framework has *some* structured-output story, but they differ in how lies are handled at the boundary:

- **PydanticAI** treats `output_type` as a Pydantic model and validates the model's response against it. If the model hallucinates a field, you get a `ValidationError`, optionally with an automatic retry that feeds the error back into the prompt. The type appears in the function signature, so your editor and `mypy` both know what you're holding.
- **LangChain** offers `with_structured_output(Model)`, which is good — but the surrounding LCEL graph is largely untyped. The `Runnable` interface gives you `Input` and `Output` generics, but most chains end up as `Runnable[Any, Any]` in practice.
- **LlamaIndex** has `output_cls` on its query engines and structured prediction utilities, but the agent layer is less consistent. Workflows pass `Event` objects whose types you have to manage by hand.

If your agent's output is going straight into a Django view, a Celery task, or a database write, the difference between "Pydantic model that mypy understands" and "dict you `json.loads`'d" is the difference between green CI and a 2 a.m. page.

## Tool calling and dependency injection

Tools are where frameworks earn their keep, because the boring infrastructure — schema generation, retries, parallel calls, error propagation — is what you'd otherwise rewrite per project.

- **PydanticAI** generates JSON schemas from type hints, supports `RunContext[Deps]` so tools can reach a typed DI container (DB sessions, HTTP clients, the current user), and handles parallel tool calls and retries with a single decorator argument.
- **LangChain** has the largest tool ecosystem by a wide margin — every vendor ships a `langchain-*` package. The `@tool` decorator is clean; passing per-request state requires `RunnableConfig` or a closure, which works but is less elegant than typed deps.
- **LlamaIndex** treats tools as `FunctionTool` objects you can compose into `ToolSpec`s. Schemas come from docstrings or explicit `FnSchema` definitions. Good for "wrap this API surface", less ergonomic for "share a request-scoped session".

In a Django/DRF-shaped backend, the dependency-injection story matters more than the tool catalogue. You usually want one `RequestContext` carrying the authenticated user, a DB session, a feature-flag client, and a tracer. PydanticAI's `deps_type` matches that shape almost exactly; in LangChain you build it yourself.

## Retrieval: still LlamaIndex's home turf

Three years of accumulated work shows. LlamaIndex's retrieval stack covers:

- Document loaders for ~everything (S3, Notion, Confluence, Postgres, GitHub, audio transcripts).
- Multiple index types (`VectorStoreIndex`, `SummaryIndex`, `KnowledgeGraphIndex`, `PropertyGraphIndex`).
- A `QueryEngine` layer that handles re-ranking, response synthesis, and citation extraction out of the box.
- Composable `NodePostprocessor`s for things like recency weighting, metadata filtering, and LLM-based reranking.

You can do all of this in LangChain — but it's a lot of glue. And PydanticAI deliberately stays out of retrieval; the docs assume you've already turned a question into a `list[Document]` somewhere upstream.

The pragmatic pattern I keep landing on:

```python
# Retrieval: LlamaIndex
retriever = index.as_retriever(similarity_top_k=8)

# Agent surface: PydanticAI
@agent.tool
async def search_docs(ctx: RunContext[Deps], query: str) -> list[str]:
    nodes = await retriever.aretrieve(query)
    return [n.get_content() for n in nodes]
```

Each framework does the thing it's best at, and the seam between them is a typed function call.

## Stateful, multi-step agents

For genuinely graph-shaped control flow — "if the model is unsure, branch into a clarification sub-agent; otherwise call the tool; if the tool errors, fall back to a different retriever" — LangGraph is still the most honest abstraction.

You write:

```python
from langgraph.graph import StateGraph, END

graph = StateGraph(MyState)
graph.add_node("plan", plan_node)
graph.add_node("act", act_node)
graph.add_node("reflect", reflect_node)
graph.add_conditional_edges("act", route_after_act, {"retry": "plan", "done": END})
graph.set_entry_point("plan")
app = graph.compile(checkpointer=checkpointer)
```

The state is typed, checkpoints persist to Redis or Postgres, and you get time-travel debugging for free.

LlamaIndex's `Workflow` API is the most direct competitor — event-driven, async-native, and lighter than LangGraph. It's a real option, especially if you're already using LlamaIndex for retrieval.

PydanticAI has a `Graph` module too, but it's intentionally minimal. If your agent looks like "linear chain of tool calls with one or two branches", PydanticAI is enough; if it looks like a flowchart, reach for LangGraph or LlamaIndex Workflows.

## Observability

You will care about this on day two, not day one, and by then it's expensive to bolt on.

- **PydanticAI** emits OpenTelemetry spans by default and ships first-class support for [Logfire](https://pydantic.dev/logfire), where you get per-call traces, token usage, tool I/O, and structured-output validation events without writing instrumentation.
- **LangChain** has [LangSmith](https://smith.langchain.com/), which is excellent if you're all-in on the LangChain runtime — every `Runnable` invocation shows up automatically.
- **LlamaIndex** has callback handlers and integrates with Arize Phoenix, Langfuse, and the rest. Less batteries-included, more flexible.

All three are credible. The one to avoid is "we'll just print to stdout for now" — agents are non-deterministic systems; debugging without traces is like debugging a distributed system with `printf`.

## Where each one breaks at scale

After running these in anger, the failure modes are pretty consistent.

**LangChain** breaks when the abstraction layers stop matching reality. You upgrade `langchain-core`, an integration package lags, the LCEL types get less precise, and you spend an afternoon untangling `Runnable` generics to figure out why your chain returns `Any`. The escape hatch is to drop into the underlying model SDK — and once you've done that twice, you start wondering what the framework was buying you.

**LlamaIndex** breaks when you push its agent layer to do things that look like LangGraph: complex branching, long-running state machines, multi-agent coordination. The retrieval primitives are world-class; the agent primitives are improving but still feel like they came second.

**PydanticAI** breaks when you need an integration it doesn't have. The ecosystem is younger and narrower. If your stack depends on a niche vector DB or a vendor-specific tool, you may be writing the adapter yourself. The upside: the adapters are small, because the abstractions are thin.

## Migration recipe: from a LangChain chain to PydanticAI

A pattern I've used three times now, when an old `langchain` service is fighting back:

1. **Pin the contract first.** Write the Pydantic input and output models you *wish* the agent had. This is usually the most valuable hour of the migration.
2. **Lift tools as plain async functions.** `@tool` decorators become `@agent.tool` decorators; signatures barely change. Any LangChain `Tool` whose body is a thin SDK call becomes a one-liner.
3. **Replace the retriever with a typed function.** Whether the retriever lives in LangChain, LlamaIndex, or your own code, expose it to the agent as `search(query: str) -> list[Doc]`. Don't leak framework objects across the boundary.
4. **Port the prompt, then delete half of it.** Half of any production system prompt is compensating for the framework's defaults. With typed outputs and dependency injection, a lot of that scaffolding disappears.
5. **Add Logfire (or your tracer of choice) on day one.** You'll want it the first time the model decides to call `get_order` with the customer's email instead of the order ID.

A migration that took two engineers a week the first time took one engineer an afternoon the second time. Most of the savings came from deleting code, not writing it.

## When I'd still pick LangChain or LlamaIndex first

I don't want this to read as a one-framework pitch. Concretely:

- **Pick LangGraph first** when the control flow is genuinely a graph: multi-agent systems, human-in-the-loop with checkpoints, branches that need to be visualised for non-engineers.
- **Pick LlamaIndex first** when retrieval *is* the product: chat-with-your-docs, code-aware assistants, knowledge-graph traversal, anything where the index design is the interesting part.
- **Pick PydanticAI first** for everything else — especially anything that has to live inside a typed backend (Django, FastAPI, Litestar) and return structured data to non-AI code.
- **Pick none of the above** when you have a single prompt with no tools. Call the SDK, validate with a Pydantic model, ship.

## Closing thought

The first wave of LLM frameworks won by hiding the model behind helpful abstractions. The second wave is winning by exposing it: typed inputs, typed outputs, real dependency injection, and observable runtime behaviour. PydanticAI is the clearest example, but you can see the same shift in LangGraph's typed state and in LlamaIndex's workflow events.

The honest answer to "which framework should I use?" in 2026 is: **the smallest one that still earns its weight**. For most backends I'm building today, that's PydanticAI with a LlamaIndex retriever bolted on, and LangGraph kept in reserve for the day the control flow stops fitting on a napkin.
