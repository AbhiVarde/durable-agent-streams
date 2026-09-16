import db from "./db";

type EventType =
  | "status"
  | "token"
  | "tool_call"
  | "retry"
  | "agent_error"
  | "result";

function nextSeq(runId: string): number {
  const row = db
    .prepare(
      "SELECT COALESCE(MAX(seq), 0) as maxSeq FROM events WHERE run_id = ?",
    )
    .get(runId) as { maxSeq: number };
  return row.maxSeq + 1;
}

export function writeEvent(runId: string, type: EventType, payload: unknown) {
  const seq = nextSeq(runId);
  db.prepare(
    "INSERT INTO events (seq, run_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(seq, runId, type, JSON.stringify(payload), Date.now());
  return seq;
}

const SAMPLE_TOKENS =
  "analyzing the request, breaking it into steps, calling the search tool, reading results, drafting a response, refining output, done".split(
    " ",
  );

export function startAgentRun(runId: string) {
  writeEvent(runId, "status", { message: "run started" });

  let i = 0;
  let retried = false;

  const interval = setInterval(() => {
    if (i >= SAMPLE_TOKENS.length) {
      writeEvent(runId, "result", { message: "task completed successfully" });
      db.prepare(
        "UPDATE runs SET status = 'finished', finished_at = ? WHERE id = ?",
      ).run(Date.now(), runId);
      clearInterval(interval);
      return;
    }

    if (i === 3) {
      writeEvent(runId, "tool_call", {
        tool: "search",
        query: "example query",
      });
    } else if (i === 5 && !retried) {
      writeEvent(runId, "agent_error", { message: "search tool timed out" });
      writeEvent(runId, "retry", {
        message: "retrying search tool",
        attempt: 1,
      });
      retried = true;
    } else {
      writeEvent(runId, "token", { text: SAMPLE_TOKENS[i] });
    }

    i++;
  }, 800);
}
