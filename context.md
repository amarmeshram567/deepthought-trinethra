# Trinethra Assignment Context

This repository contains a local-only supervisor transcript review tool for psychology interns.

Assumptions used in this implementation:
- The app is a draft-analysis workflow, not an automated decision-maker.
- The backend calls a local Ollama model only.
- The frontend shows reviewable findings so the intern can accept, reject, or edit the AI output.
- The assignment fixture files are mirrored in the repo as local JSON copies for demo and development.

Reference data:
- `rubric.json` contains the KPI and assessment-dimension definitions used in the prompt and UI.
- `sample-transcripts.json` contains short example transcripts that can be loaded into the input box.

Primary product requirements:
- Extract evidence quotes
- Produce a 1-10 rubric score with justification
- Map transcript content to 8 KPIs
- Identify gaps in the conversation
- Suggest 3-5 follow-up questions
- Keep the human reviewer in control
