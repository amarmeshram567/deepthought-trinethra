# Trinethra

Trinethra is a local-only supervisor transcript review tool for psychology interns. It sends a transcript to Ollama, gets back a structured draft analysis, and lets the human reviewer inspect, edit, and finalize the result.

## What it does

- Paste a supervisor transcript into the input box.
- Load one of the provided sample transcripts.
- Run analysis through a local Ollama model.
- Review the draft score, extracted evidence, KPI mapping, gap analysis, and follow-up questions.
- Keep the final decision with the psychology intern, not the model.

## Architecture

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- LLM: Ollama running locally on `http://localhost:11434`

The frontend posts the transcript to `POST /api/analyze`. The backend sends the transcript and rubric instructions to Ollama, normalizes the model output into a canonical JSON shape, and returns it to the UI. The frontend mirrors the assignment fixtures in `frontend/src/data/` so the sample transcripts and rubric are available in the browser.

## Ollama model used

This project is wired for `llama3.2`.

Why:

- It is small enough to run on a typical laptop.
- It is a good fit for the assignment requirement of local-only inference.
- It produces usable structured output when paired with a strict prompt and a JSON repair fallback.

## Repository structure

```text
backend/
frontend/
context.md
rubric.json
sample-transcripts.json
README.md
```

## Setup

Prerequisites:

- Node.js 18+
- Ollama installed locally

### 1) Start Ollama

Install Ollama from `https://ollama.com`.

Pull the model:

```bash
ollama pull llama3.2
```

Verify it works:

```bash
ollama run llama3.2 "Hello"
```

Leave Ollama running in the background.

### 2) Start the backend

```bash
cd backend
npm install
npm run dev
```

Optional environment variables:

- `PORT` - defaults to `4000`
- `OLLAMA_URL` - defaults to `http://127.0.0.1:11434/api/chat`
- `OLLAMA_MODEL` - defaults to `llama3.2`
- `FRONTEND_ORIGIN` - defaults to `http://localhost:5173`

You can copy `backend/.env.example` to `backend/.env` and adjust values if needed.

### 3) Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

The frontend reads `VITE_API_BASE_URL` from `frontend/.env`.
You can copy `frontend/.env.example` to `frontend/.env` and change the backend URL if your backend runs somewhere else.

## Design challenges tackled

### 1) One prompt or many?

I used a single structured prompt for the first pass because the transcript is short and the reviewer needs a quick draft. The backend still normalizes the output and can do a second-pass repair if the model returns malformed JSON.

### 2) Structured output reliability

The backend asks Ollama for JSON-only output, extracts the JSON defensively, and retries once with a repair prompt if needed. The response is then normalized into a stable schema before it reaches the UI.

### 3) Showing uncertainty

The UI labels the result as a draft, not a verdict. Evidence rows have accept/reject/edit controls, and the finalization button is separate from analysis generation so the human reviewer stays in control.

### 4) Gap detection

The analysis always includes a gap section and follow-up questions. The prompt explicitly asks the model to flag missing assessment dimensions such as systems building, KPI impact, and change management.

## What I would improve with more time

- Add side-by-side transcript highlighting so the reviewer can click a quote and see it in context.
- Store review decisions locally so the intern can resume work after refreshing the page.
- Add section-level editing for KPI mappings, gap notes, and follow-up questions.
- Add a transcript comparison mode so supervisors can be calibrated against each other more easily.

## Notes for the walkthrough videos

### App demo video

- Start Ollama.
- Start the backend and frontend.
- Load one of the sample transcripts.
- Run analysis.
- Walk through the score, evidence, KPI mapping, gaps, and follow-up questions.

### Code walkthrough video

- Explain how the frontend, backend, and Ollama talk to each other.
- Walk through `backend/prompts/systemPrompt.js` and why the JSON schema matters.
- Show how the backend normalizes messy model output in `backend/services/ollamaService.js`.
- Explain the review controls in `frontend/src/App.jsx`.

## Current status

- Frontend build passes.
- ESLint passes.
- The app is ready to run locally with Ollama.

## Vercel deployment

This repository is set up to be deployed as two Vercel projects:

- Frontend project root: `frontend`
- Backend project root: `backend`

### Frontend project

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=http://localhost:5173/`

### Backend project

- Project root: `backend`
- The analyze endpoint is exposed as `/api/analyze` from `backend/api/analyze.js`
- Add the same environment variables in the Vercel dashboard that you use locally:
  - `OLLAMA_URL`
  - `OLLAMA_MODEL`
  - `FRONTEND_ORIGIN`

Important note:

- Vercel cannot run a local Ollama instance. The backend code is serverless-ready, but it still expects a reachable Ollama API. For the assignment, keep the app local as required.
