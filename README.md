# Durable Agent Streams

A prototype for streaming long-running background agent activity with durable event storage, replay, and seamless client reconnection.

Background agents shouldn't depend on an active browser connection. Whether a user closes a tab, switches networks, or reconnects from another device, the agent should keep running and its event history should remain available.

## Overview

Durable Agent Streams explores how to reliably capture and deliver events from long-running background processes.

It focuses on:
- Persistent, append-only event storage
- Ordered event delivery with stable cursors
- Reconnection and stream replay
- Multiple independent subscribers
- Handling disconnected and slow consumers
- Recovery across server restarts

## How It Works

1. **Start a run:** A background runner starts producing events independently of connected clients.
2. **Persist events:** Each event is appended to durable storage with a monotonically increasing cursor.
3. **Stream updates:** Connected clients receive events as they are produced.
4. **Resume:** Clients reconnect using their last processed cursor and retrieve subsequent events.
5. **Replay:** Late subscribers can retrieve the complete event history, including completed run status.

## Event Types

The simulated agent produces different types of events to represent a realistic background workflow:

- Model output and tokens
- Tool calls
- Status changes
- Retries
- Errors
- Final results

## Core Capabilities

- **Durable event log:** Keeps run history independently of client connections.
- **Cursor-based resume:** Tracks event positions within each run.
- **Ordered delivery:** Maintains event ordering during replay and live streaming.
- **Multiple subscribers:** Allows multiple clients to follow the same run independently.
- **Background execution:** Runs continue producing events when no viewers are connected.
- **Reconnect support:** Clients can disconnect and resume without intentionally replaying already processed events.
- **Server recovery:** Designed to preserve recorded events across server restarts.

## Architecture Decisions

The implementation explores the tradeoffs involved in building durable event streams.

Key areas include:

- Event ordering and cursor management
- Historical replay and live stream handoff
- Transport selection
- Persistent storage and retention
- Consumer buffering and backpressure
- Recovery and scalability considerations

## Running Locally

See the setup instructions below for dependencies, environment configuration, and local development commands.

## Scope

This is a focused prototype using a simulated background agent rather than a live model or external tools. It concentrates on the event delivery and persistence layer rather than authentication, billing, or production deployment.
