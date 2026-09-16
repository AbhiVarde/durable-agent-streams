# Work Trial Task: Durable Background Agent Streams

Build a system that streams the output of long-running background agents
durably, so a client can disconnect and reconnect at any time and resume the
stream with no loss and no duplicates.

The goal is to evaluate how you think about durable event streams, delivery
guarantees, reconnection, backpressure, and storage tradeoffs. Scope this as a
credible 6-hour prototype. We care more about a thoughtful, working vertical
slice than a broad unfinished system.

## The Problem

A background agent can run for a long time — seconds to hours. As it runs it
emits a stream of events: model tokens, tool calls, status changes, retries,
errors, and a final result.

A user watches that stream in a browser. But the connection is not reliable and
the run does not depend on it:

- The user closes their laptop, switches networks, or reloads the tab.
- The server restarts mid-run.
- A second tab or device attaches to the same run.
- Every viewer leaves, and the agent keeps working alone.

The agent must keep running and producing regardless, and any client that
(re)connects must be able to catch up to the exact current state and then
follow the live tail.

## What To Build

A local full-stack prototype with:

- A background agent runner that produces a realistic, long event stream. A
  simulator is fine — you do not need to call a real model.
- A durable, append-only stream store so a run survives server restarts and
  keeps recording when no client is connected.
- A server that lets a client start a run, subscribe to its stream, and resume
  from a cursor after a disconnect.
- A minimal web UI to start a run and watch it live, with an obvious way to
  drop and restore the connection to show seamless resume.

## Requirements

The hard part is the delivery model. Your system should:

- Assign every event a stable, monotonic cursor within a run.
- Let a client resume from its last cursor and receive every event after it,
  in order, exactly once — no gaps, no duplicates.
- Serve a late joiner the full history from the start, then switch to the live
  tail without missing events in between.
- Support multiple concurrent subscribers on one run, each with an independent
  position.
- Keep the producer from stalling when a consumer is slow or gone
  (backpressure / buffering).
- Persist the whole run so a client that connects after it finishes still gets
  the complete stream, including its final status.
- Survive a server restart mid-run without corrupting or losing the stream.

Pick a transport that fits (SSE, WebSocket, long-poll) and say why.

## Storage Decision

Choose where the durable log lives — SQLite, Postgres, Redis Streams, a log
file, or another justified option — and include a short note covering:

- Why you chose it.
- How ordering and the resume cursor are implemented.
- Retention: how long streams are kept and how they are truncated.
- What you would change for many concurrent runs, very long streams, and
  fan-out to many subscribers.

We do not expect production infrastructure, but we do expect production
judgment.

## Non-Goals

Do not spend time on:

- Authentication, billing, or multi-tenant account management.
- Cloud deployment.
- Calling real models or real tools.
- Pixel-perfect UI polish.

Hardcoding local development credentials and IDs is fine if you note the
tradeoff.

## Deliverables

Submit a GitHub repository containing:

- A working local app with setup and run instructions.
- The agent runner / simulator that produces the stream.
- A short architecture note covering the stream and event model, the delivery
  and resume guarantees, the transport choice, the storage choice, and how you
  handle backpressure and server restarts.
- Notes on what you intentionally skipped.

## Success Criteria

A strong submission demonstrates end-to-end thinking about durable streams:

- Reconnect mid-run and resume with no gaps or duplicates.
- A late joiner and a live viewer both see a correct, ordered stream.
- The run completes even with no client connected, and replays fully
  afterward.
- Clear reasoning about ordering, retention, backpressure, and what changes at
  scale.
