"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Streamdown } from "streamdown";
import { Spinner } from "@/components/ui/spinner";

type Event = {
  seq: number;
  type: string;
  payload: string;
};

const TYPE_LABEL: Record<string, string> = {
  status: "status",
  token: "token",
  tool_call: "tool call",
  retry: "retry",
  agent_error: "error",
  result: "result",
};

export default function Home() {
  const [runId, setRunId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState("idle");
  const [joinId, setJoinId] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastSeqRef = useRef(0);

  async function joinRun(id: string) {
    if (connecting || connected) return;
    setConnecting(true);
    const res = await fetch(`/api/runs/${id}`);
    if (!res.ok) {
      alert("run not found");
      setConnecting(false);
      return;
    }
    const run = await res.json();
    setRunId(id);
    setEvents([]);
    lastSeqRef.current = 0;
    setStatus(run.status);
    connect(id, 0);
  }

  async function startRun() {
    if (connecting || connected) return;
    setConnecting(true);
    const res = await fetch("/api/runs", { method: "POST" });
    const data = await res.json();
    setRunId(data.runId);
    setEvents([]);
    lastSeqRef.current = 0;
    setStatus("running");
    connect(data.runId, 0);
  }

  function connect(id: string, cursor: number) {
    if (eventSourceRef.current) {
      eventSourceRef.current.onerror = null;
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const es = new EventSource(`/api/runs/${id}/stream?cursor=${cursor}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setConnecting(false);
    };

    ["status", "token", "tool_call", "retry", "agent_error", "result"].forEach(
      (type) => {
        es.addEventListener(type, (e: MessageEvent) => {
          const seq = Number(e.lastEventId);
          lastSeqRef.current = seq;
          setEvents((prev) => [...prev, { seq, type, payload: e.data }]);
          if (type === "result") setStatus("finished");
        });
      },
    );

    es.addEventListener("done", () => {
      es.close();
      if (eventSourceRef.current === es) {
        eventSourceRef.current = null;
      }
      setConnected(false);
      setConnecting(false);
    });

    es.onerror = () => {
      if (eventSourceRef.current !== es) return;
      setConnected(false);
      setConnecting(false);
    };
  }

  function disconnect() {
    if (eventSourceRef.current) {
      eventSourceRef.current.onerror = null;
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnected(false);
    setConnecting(false);
  }

  function reconnect() {
    if (connecting || connected || !runId) return;
    setConnecting(true);
    connect(runId, lastSeqRef.current);
  }

  function renderPayload(ev: Event) {
    try {
      const parsed = JSON.parse(ev.payload);
      const text =
        parsed.text ?? parsed.message ?? parsed.query ?? JSON.stringify(parsed);
      return <Streamdown>{text}</Streamdown>;
    } catch {
      return ev.payload;
    }
  }

  const phase = connecting
    ? "connecting"
    : status === "finished"
      ? "finished"
      : connected
        ? "live"
        : runId
          ? "disconnected"
          : "idle";

  return (
    <div className="max-w-xl mx-auto w-full px-6 py-10 space-y-5">
      <div className="space-y-0.5">
        <h1 className="text-lg font-semibold tracking-tight">
          durable agent stream
        </h1>
        <p className="text-xs text-muted-foreground">
          resumable sse stream backed by a durable append-only log
        </p>
      </div>

      <div className="flex items-center gap-2">
        {(phase === "idle" || phase === "finished") && (
          <Button size="sm" onClick={startRun}>
            start run
          </Button>
        )}

        {phase === "live" && (
          <Button size="sm" onClick={disconnect} variant="outline">
            disconnect
          </Button>
        )}

        {phase === "disconnected" && (
          <Button size="sm" onClick={reconnect} variant="outline">
            reconnect
          </Button>
        )}

        {phase === "connecting" && (
          <Button size="sm" disabled variant="outline">
            <Spinner className="size-3.5" />
            connecting...
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <Badge
            variant={status === "finished" ? "default" : "secondary"}
            className="text-xs"
          >
            {status}
          </Badge>
          <Badge
            variant={phase === "live" ? "default" : "outline"}
            className="text-xs"
          >
            {phase === "live"
              ? "live"
              : phase === "connecting"
                ? "connecting"
                : "disconnected"}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          placeholder="paste a run id to join"
          className="flex-1 h-8 px-2.5 text-xs rounded-md border bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => joinRun(joinId)}
          disabled={!joinId || phase === "connecting" || phase === "live"}
        >
          join
        </Button>
      </div>

      <Card className="py-0 gap-0">
        <CardHeader className="text-xs text-muted-foreground font-mono py-2.5 px-4">
          {runId ?? "no active run"}
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ScrollArea className="h-80">
            <div className="p-3 space-y-2">
              {events.length === 0 && !connecting && (
                <p className="text-xs text-muted-foreground">
                  no events yet, click start run
                </p>
              )}
              {connecting && events.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Spinner className="size-3.5" />
                  connecting...
                </div>
              )}
              {events.map((ev, i) => (
                <div key={i} className="flex gap-2 text-xs items-start">
                  <span className="text-muted-foreground font-mono pt-0.5 w-6 shrink-0">
                    {ev.seq}
                  </span>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px] px-1.5 py-0"
                  >
                    {TYPE_LABEL[ev.type] ?? ev.type}
                  </Badge>
                  <div className="min-w-0 leading-relaxed">
                    {renderPayload(ev)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
