# Setup and Run Instructions

## Requirements

- Node.js 18 or later
- npm

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

No environment variables or manual database setup are needed. The SQLite database file (`data.db`) is created automatically on first run, in the project root, and stores all runs and events durably.

## How to Try It

1. Open the app and click **Start** to kick off a new agent run.
2. Watch the event log stream live (tokens, tool calls, status changes).
3. Click **Disconnect** to simulate a dropped connection, then **Reconnect** to confirm it resumes exactly where it left off, no gaps, no duplicates.
4. Open the same run in a second tab to see a late joiner get the full history, then switch seamlessly to the live tail.
5. Stop the dev server mid-run, restart it (`npm run dev`), then reconnect to confirm the log survived the restart with nothing lost.

See `ARCHITECTURE.md` for how the delivery, resume, and storage model works, and what was intentionally left out.

## Build for Production (optional)

```bash
npm run build
npm run start
```
