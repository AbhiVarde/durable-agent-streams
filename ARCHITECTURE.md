# Architecture Note

## Folder Structure

```
runable-interview-task/
├── app/
│   ├── api/
│   │   └── runs/
│   │       ├── route.ts                  → start a new run
│   │       └── [id]/
│   │           ├── route.ts              → check a run's current status
│   │           └── stream/
│   │               └── route.ts          → sse stream, replay + resume + live tail
│   ├── page.tsx                          → the whole ui (start, disconnect, reconnect, join, event log)
│   ├── layout.tsx                        → root layout, inter font, dark mode
│   └── globals.css                       → theme tokens
├── lib/
│   ├── db.ts                             → sqlite connection + schema (runs, events)
│   └── simulator.ts                      → fake agent that writes events on an interval
├── data.db                               → the durable log itself (created on first run)
└── ARCHITECTURE.md                       → this file
```

**What each file does:**

- `lib/db.ts`: opens SQLite, turns on WAL mode, creates `runs` and `events` tables.
- `lib/simulator.ts`: fake agent, writes one event every 800ms (token, tool call, status, error, retry, result).
- `app/api/runs/route.ts`: "start" button, creates a run and kicks off the simulator.
- `app/api/runs/[id]/route.ts`: checks if a run is running or finished.
- `app/api/runs/[id]/stream/route.ts`: browser connects here, gets backlog first, then live tail every 300ms.
- `app/page.tsx`: the UI, start/disconnect/reconnect/join buttons, event log.

---

## Event Model

Each event has:

- `run_id`: which run it belongs to.
- `seq`: number that only goes up, starts at 1, per run.
- `type`: `status`, `token`, `tool_call`, `retry`, `agent_error`, or `result`.
- `payload`: the content (JSON).
- `created_at`: timestamp.

`seq` is used instead of timestamps because timestamps can collide or arrive out of order over a network. An always increasing number cannot.

---

## Delivery and Resume

**How resume works:**

1. Client remembers the last `seq` it saw.
2. On reconnect, sends that number (`?cursor=` in URL, or the browser's built in `Last-Event-Id` header).
3. Server sends every row with `seq` greater than that, in order, then switches to live watching.

Result: no matter how many times a client drops and reconnects, it gets exactly what it missed, once each, in order.

- **Late joiner:** sends cursor `0`, gets full history then live tail, same code path as reconnect.
- **Multiple viewers:** each tab has its own connection and cursor, server does not track "how many" watchers.

---

## Why SSE (not WebSockets or long polling)

- Data only flows server to browser, no need to send back mid stream.
- Browser auto reconnect built in (`EventSource`).
- Native support for resume via `id:` and `Last-Event-Id`.
- Simpler to build and debug for a one way stream.

---

## Why SQLite (not Postgres or Redis)

- Single file, no separate server to run, fits a 6 hour prototype.
- WAL mode lets writes and reads happen at once without blocking.
- Durable, survives a server restart.

**Ordering/cursor:** same `seq` logic above, scoped per `run_id`, `max(seq) + 1` at write time.

**Retention:** currently kept forever. For real use, I would add a job to archive or delete runs older than about 30 days and move finished transcripts to cheaper storage.

**At scale, what changes:**

- **Many concurrent runs:** SQLite is fine up to a point, then Postgres is the next step (same schema, same `seq` logic).
- **Very long streams:** paginate the backlog instead of sending all 10,000 events at once.
- **Many subscribers:** replace per connection polling with real pub/sub (Redis streams or Postgres `LISTEN/NOTIFY`).

---

## Backpressure

- Simulator writes to SQLite no matter who is connected, never waits on a client.
- Each SSE connection reads independently, at its own pace.
- Simplified version of real backpressure: a stuck client just polls less effectively, is not actively throttled.
- Production version: bounded queue per subscriber, drop or slow writes if a queue fills up (intentional simplification given the 6 hour scope).

---

## Server Restart

- Killing the server mid run loses nothing, since events are written to SQLite before being sent to any client.
- Only the simulator stops (it is a `setInterval` inside the Node process, dies with the process).
- On restart, reconnecting clients pick up exactly where the log left off.
- Limitation: the run stays "running" forever after a restart, since nothing resumes the simulator itself.
- Production fix: a durable workflow engine or job queue with persisted state, so the work resumes too, not just the log.

---

## What I Skipped

- **Auth, billing, multi-tenant accounts.** Out of scope per the task.
- **Cloud deployment.** Tested locally only.
- **Real model/tool calls.** Used a simulator emitting realistic events instead.
- **Pixel-perfect UI polish.** Kept minimal, focused on correctness of start, disconnect, reconnect, join, and the event log.
- **Retention/archiving.** Runs are kept forever, no TTL or cleanup job yet.
- **Scaling past one SQLite file.** Didn't implement Postgres or Redis, but the migration path is the same schema and `seq` logic.
