# Voice-to-Type Native Keyboard

Build a mini WisprFlow-style iOS experience: a native keyboard that lets a user speak and insert the resulting text into whatever app they are typing in.

This is a mobile engineering task first. The backend only needs to be good enough to support a low-latency voice-to-text loop.

## What to Build

Create an iOS app with three parts:

1. A React Native containing app for setup, permissions, account/status UI, and any supporting product surface you think is useful.
2. A Swift custom keyboard extension that appears as a real iOS keyboard, lets the user trigger voice input, and inserts transcribed text into the active text field.
3. A small TypeScript server that receives audio or audio chunks, calls an existing speech-to-text model/API, and returns transcript results quickly.

The goal is not to clone every WisprFlow feature. The goal is to build the smallest convincing end-to-end slice that shows you understand native iOS constraints, React Native integration, voice UX, and latency tradeoffs.

## Core Requirements

Your submission should include:

- A working React Native iOS app that can be built and run locally.
- A Swift keyboard extension that can be enabled in iOS Settings and used in another app.
- A voice-to-text flow from keyboard interaction to transcript insertion.
- A simple TypeScript backend with clear setup instructions.
- A README or notes section explaining your architecture, important tradeoffs, known limitations, and what you would improve next.

You may use any reasonable existing speech model or API. Do not spend time training models or building production infrastructure.

## iOS Constraints to Consider

iOS custom keyboards run as app extensions, which means they have a different lifecycle and permission model than a normal app. A strong solution should show awareness of these constraints rather than hiding them.

In particular:

- Custom keyboards need a way to switch to the next keyboard.
- Some input fields do not allow custom keyboards.
- Network-backed keyboard behavior requires open access and explicit user permission.
- Keyboard extensions have sandboxing and lifecycle limits that affect audio capture, shared state, and backend communication.

Useful Apple references:

- [Custom Keyboard](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/CustomKeyboard.html)
- [Configuring open access for a custom keyboard](https://developer.apple.com/documentation/uikit/configuring-open-access-for-a-custom-keyboard)

We do not expect perfection around every platform edge case. We do expect you to identify the major constraints and make practical choices.

## Product Expectations

The experience should feel like a real product slice, not just a demo screen.

At minimum, think through:

- How the user starts and stops voice input.
- How pending, partial, successful, and failed transcription states are shown.
- How quickly text appears after speech.
- What happens if permissions, network access, or the backend fail.
- How the user understands setup steps for enabling the keyboard.

Prefer a focused, reliable flow over a broad set of unfinished features.

## Backend Scope

Keep the backend simple. A good implementation might expose one or two endpoints for uploading/streaming audio and receiving transcript results.

We care about:

- Clean TypeScript code.
- A clear API contract between the keyboard/app and server.
- Reasonable handling of latency, errors, and retries.
- A short explanation of whether you chose whole-file upload, chunking, streaming, or another approach.

We do not care about:

- Auth beyond what is needed for a local demo.
- Persistent storage unless you need it for your design.
- Complex deployment setup.
- Building your own speech model.

## What We Evaluate

We will primarily evaluate:

- Native iOS judgment: keyboard extension setup, Swift implementation, permissions, lifecycle, text insertion, and platform limitations.
- React Native integration: clean app structure, native boundary choices, and setup flow.
- Voice UX: fast feedback, sensible states, interruption handling, and text insertion behavior.
- Latency and systems thinking: audio flow, backend contract, model/API choice, and bottleneck awareness.
- Code quality: readability, pragmatic architecture, local setup, and scoped implementation.
- Communication: clear tradeoff notes and good questions when you hit uncertainty.

## Optional Stretch

If the core flow is working well, you can add one small extension:

- Live Activity or another iOS status surface for active transcription.
- Partial transcript updates while speech is still being processed.
- Latency instrumentation with a short bottleneck analysis.
- Better fallback behavior for failed permissions, no network, or backend errors.

Treat this as optional. A polished core flow is better than several incomplete extras.

## Submission

Submit the repo with:

- Clear setup instructions for the iOS app and backend.
- Any required environment variables listed with example names.
- A short architecture/tradeoff writeup.
- Notes on what works, what is incomplete, and what you would do next.

We will run the project locally and review the code, product behavior, and tradeoff notes together.
