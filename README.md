# AI Seating Plan Generator

A full-stack, offline-friendly web app for teachers to generate classroom seating plans using AI-inspired optimization and clear, editable layouts.

## Features

- Student import via manual entry, paste list, and CSV/Excel upload.
- Rich student attributes (level, behavior, SEN/EAL, front needs, notes).
- Layout designer with seat types, teacher desk, board position, and presets.
- Constraint controls with weights and mode selection.
- AI plan generation (5 ranked alternatives) with explanations.
- Drag & drop-style swap editor, lock seats, search, undo/redo.
- Export to PNG, PDF (A4/A3), Excel, and print-friendly view.
- Offline storage via localStorage and sample datasets.

## Tech Stack

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js + Express
- **Storage:** localStorage (offline)

## Getting Started

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## API

`POST /generate-plan`

Payload:

```json
{
  "students": [],
  "layout": {},
  "constraints": {},
  "mode": "lesson",
  "lockedSeats": {}
}
```

Response:

```json
{
  "plans": [
    {
      "id": "...",
      "score": 123,
      "seats": { "seat-0-0": "student-id" },
      "explanation": ["..."],
      "warnings": []
    }
  ]
}
```

## Notes

- If no valid plan is found, relax constraints or unlock seats.
- Exports work best in Chromium browsers.

