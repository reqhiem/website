---
title: "AI agent harnesses: the system around the model"
description: "What an AI agent harness actually does: the model–tool loop, context, state, permissions, and feedback that turn a capable model into a dependable agent."
date: "2026-09-24"
category: "AI"
tags: ["llm", "agents", "ai-engineering", "tooling"]
author: "Joel Perca"
---

A model can suggest a shell command. It cannot, by itself, decide whether that command is allowed to run, execute it in an isolated environment, remember the result, or prove that the task is done. That surrounding machinery is the **agent harness**.

The distinction matters because teams often attribute an agent's reliability—or its failures—to the model alone. In practice, the same model can behave very differently depending on which tools it can use, what context it sees, how its work is checked, and when the system stops it. I find it more useful to ask *what environment did we build for the model?* than *which model is smartest?*

## TL;DR

- An **agent harness** is the runtime and operating environment around a model: it supplies instructions and tools, runs the model–tool loop, manages context and state, enforces permissions, and decides when to stop or ask for help.
- The **model proposes** actions; the **harness mediates and executes** them. A tool call in the model's output is not permission to do anything.
- For long tasks, the harness must preserve progress outside the context window: files, tests, version control, and explicit handoffs beat an ever-growing transcript.
- An **evaluation harness** is different: it runs repeatable tasks and grades outcomes. You need both to improve an agent rather than merely watch it work.

## The model is not the agent

A plain LLM call takes input and produces output. An agent has a loop: it observes a task, chooses an action, sees the result, and chooses what to do next. OpenAI's [description of the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/) makes this explicit: the model either emits a final response or requests a tool call; the system executes the call, adds its result to the next input, and repeats. The output might be a message, but for a coding agent the important output may be files changed on disk.

A useful mental model is:

```text
user task
   ↓
harness: instructions + relevant context + available tools
   ↓
model: answer or request an action
   ↓
harness: check policy → execute tool → record result
   ↖──────────────────── repeat until done, blocked, or out of budget
```

That loop is the minimum, not the whole design. The harness also determines which history to retain, whether a command needs approval, how to handle a failed tool, and what counts as completion. Without those decisions, "give the model tools" is just an API integration, not a reliable operating system for work.

## Five jobs the harness must do

### 1. Build the right context

Instructions, tool descriptions, conversation history, retrieved documents, and recent tool outputs all compete for a finite context window. More text is not automatically more useful. Anthropic's [context engineering guidance](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) argues for the smallest high-signal set of tokens that helps the agent make its next decision.

For a coding task, that might mean a short repository map, the relevant files, the current failing test, and the user's acceptance criteria—not the entire repository pasted into a prompt. Context is a *working view*, not the source of truth. Logs, files, and commits can live outside it and be retrieved when needed.

### 2. Expose actions through tools

The model requests actions using tool interfaces: read a file, search the codebase, run a test, open a browser, or call an API. The harness defines the tool contract, validates arguments, executes the operation, and reports success or failure. Clear tool names and focused results matter because tool schemas and outputs consume context too; Anthropic's [tool design guide](https://www.anthropic.com/engineering/writing-tools-for-agents) treats them as part of the agent interface, not incidental plumbing.

A tool result should tell the agent what happened without burying it in irrelevant output. A failed test with its useful error lines is better than an unbounded log dump.

### 3. Enforce boundaries outside the prompt

"Don't delete production data" is an instruction, not an access-control mechanism. The harness needs actual constraints: scoped credentials, sandboxed execution, timeouts, budgets, and approval gates for consequential actions. Untrusted web pages and tool results are **data**, not new instructions for the agent to obey.

This is why a model's proposed command and an authorized command are different things. OpenAI's [Codex safety write-up](https://openai.com/index/running-codex-safely/) describes sandbox restrictions and approval controls as separate layers. A useful design test is: *if the model ignored every warning in its prompt, what could it still do?*

### 4. Keep state across steps and sessions

Within a task, the harness tracks messages, tool calls, results, and artifacts. Across long tasks, it must hand off enough durable state for the next context window or session to resume coherently. Compaction can help with context pressure, but a summary can omit a crucial unfinished change.

Anthropic's [long-running agent experiment](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) used an initializer, a feature list, a progress file, Git history, and a startup script. Later sessions read those artifacts, checked that the app still worked, and picked the next incomplete feature. The general principle is not that every agent needs a `progress.txt`; it is that **the work must survive the conversation that started it**.

### 5. Make progress observable and verifiable

A plausible final message is not proof of success. For a software agent, the harness can record a trace of tool calls, run tests and lint, inspect the diff, and require human review where judgment is needed. It should distinguish "the agent says it fixed the bug" from "the regression test failed before and passes after."

This is also where the *environment* becomes part of the harness. In OpenAI's [harness engineering account](https://openai.com/index/harness-engineering/), repository structure, concise agent instructions, searchable documentation, automated checks, and feedback loops made work legible to agents. Their team's results are a case study in a heavily engineered repository, **not** a promise that attaching the same model to any repo will reproduce them.

## A small harness, before the framework

Here is deliberately simplified TypeScript-like pseudocode. `model.generate`, `tools.execute`, and `policy.authorize` stand for interfaces you would have to implement; this is the control flow, not a production-ready library.

```ts
const events: Event[] = [{ type: "user", text: task }];

for (let step = 0; step < MAX_STEPS; step++) {
  const context = selectRelevantContext(events, workspace);
  const decision = await model.generate({ context, tools: allowedToolSchemas });
  events.push({ type: "model", decision });

  if (decision.type === "final") {
    return { answer: decision.text, events };
  }

  const authorization = await policy.authorize(decision.toolCall);
  if (!authorization.allowed) {
    events.push({ type: "tool_denied", reason: authorization.reason });
    continue;
  }

  const result = await tools.execute(decision.toolCall, {
    timeoutMs: TOOL_TIMEOUT_MS,
    sandbox: workspace,
  });
  events.push({ type: "tool_result", result: summarize(result) });
}

return { status: "needs_review", reason: "step budget exceeded", events };
```

Even this sketch has choices a framework cannot make for you: who grants approval, what is safe to summarize, how much a run may cost, and whether a final answer is enough or tests must pass first. Starting with one agent, a few narrow tools, and explicit exit conditions is usually easier to debug than starting with a fleet of agents handing work to each other.

## Harness, framework, and eval harness are not synonyms

| Term | The question it answers | Example responsibility |
| --- | --- | --- |
| **Model** | What should I say or try next? | Generate an answer or request a tool call. |
| **Agent framework / SDK** | Which reusable primitives help me build this? | Tool registration, state APIs, tracing, graph execution. |
| **Agent harness** | How does this particular agent operate safely and finish work? | Context selection, execution policy, state, stopping rules, verification. |
| **Evaluation harness** | How well did it perform across repeatable tasks? | Set up cases, run the agent, grade outcomes, compare regressions. |

A framework can provide pieces of a harness, but installing a package does not supply your permission policy, repository conventions, or definition of done. Conversely, an eval harness drives an agent harness through test cases and measures what happened. Anthropic's [guide to agent evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) emphasizes checking outcomes and, when useful, the trajectory of tool use—not only the final prose.

## What I would build first

For a new coding agent, I would start with a single constrained loop and make four things explicit:

1. **A narrow task contract:** what can change, what must remain true, and when to escalate.
2. **A small tool surface:** read/search, edit, and run checks, with permissions enforced by the executor rather than prose alone.
3. **Durable evidence:** changed files, test results, and a short progress record that the next session can verify.
4. **A tiny eval set:** representative tasks with observable pass/fail conditions, including one where a tool fails or an action must be denied.

Then I would inspect the failures. If the agent misses relevant files, improve retrieval. If it repeats work, improve state and handoffs. If it claims success too early, tighten verification. Add orchestration or multiple agents only when a concrete failure mode justifies the complexity.

## Closing thought

The most useful shift in perspective is to stop treating the model as the whole product. The model supplies judgment and language; the harness supplies a controlled world in which that judgment can act, leave evidence, and be corrected. Better models help, but a better environment can make the same model substantially more dependable.

---

**Further reading**

- [OpenAI — Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/)
- [OpenAI — Harness engineering](https://openai.com/index/harness-engineering/)
- [OpenAI — Running Codex safely](https://openai.com/index/running-codex-safely/)
- [Anthropic — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic — Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Anthropic — Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
