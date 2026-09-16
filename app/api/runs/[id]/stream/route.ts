import db from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: runId } = await params;
  const url = new URL(req.url);

  const lastEventIdHeader = req.headers.get("last-event-id");
  const cursor = Number(
    lastEventIdHeader ?? url.searchParams.get("cursor") ?? 0,
  );

  const run = db.prepare("SELECT * FROM runs WHERE id = ?").get(runId) as
    | { id: string; status: string }
    | undefined;

  if (!run) {
    return new Response("run not found", { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      function send(seq: number, type: string, payload: string) {
        const chunk = `id: ${seq}\nevent: ${type}\ndata: ${payload}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      }

      function finish() {
        if (closed) return;
        closed = true;
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
        controller.close();
      }

      let lastSeq = cursor;
      const backlog = db
        .prepare(
          "SELECT * FROM events WHERE run_id = ? AND seq > ? ORDER BY seq ASC",
        )
        .all(runId, cursor) as { seq: number; type: string; payload: string }[];

      for (const ev of backlog) {
        send(ev.seq, ev.type, ev.payload);
        lastSeq = ev.seq;
      }

      const currentRun = db
        .prepare("SELECT status FROM runs WHERE id = ?")
        .get(runId) as {
        status: string;
      };
      if (currentRun.status === "finished") {
        finish();
        return;
      }

      const poll = setInterval(() => {
        const newEvents = db
          .prepare(
            "SELECT * FROM events WHERE run_id = ? AND seq > ? ORDER BY seq ASC",
          )
          .all(runId, lastSeq) as {
          seq: number;
          type: string;
          payload: string;
        }[];

        for (const ev of newEvents) {
          send(ev.seq, ev.type, ev.payload);
          lastSeq = ev.seq;
        }

        const status = db
          .prepare("SELECT status FROM runs WHERE id = ?")
          .get(runId) as {
          status: string;
        };
        if (status.status === "finished" && newEvents.length === 0) {
          clearInterval(poll);
          finish();
        }
      }, 300);

      req.signal.addEventListener("abort", () => {
        clearInterval(poll);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
