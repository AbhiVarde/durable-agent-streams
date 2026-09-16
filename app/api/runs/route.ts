import { NextResponse } from "next/server";
import db from "@/lib/db";
import { startAgentRun } from "@/lib/simulator";

export async function POST() {
  const runId = crypto.randomUUID();

  db.prepare(
    "INSERT INTO runs (id, status, created_at) VALUES (?, 'running', ?)",
  ).run(runId, Date.now());

  startAgentRun(runId);

  return NextResponse.json({ runId });
}
