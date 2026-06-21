# DocForge

Batch document generator. Upload a class list (CSV or Excel), pick a template,
map your columns to the template fields, and download a ZIP with one PDF per row.

Built with Next.js 16 (App Router) + React 19. Stateless — no database, no
environment variables. Deploys to Vercel with zero configuration.

## Templates

- **Classic certificate** — A4 landscape award certificate.
- **Progress report** — A4 portrait, per-subject marks + teacher comment.

## How it works

1. **Choose a template.**
2. **Upload & map** — drop a `.csv` / `.xlsx` / `.xls`. The file is parsed
   server-side and the rows are held in the browser. Columns are auto-matched to
   template fields; adjust any mapping with the dropdowns. The first row renders
   as a live preview.
3. **Generate** — every row is rendered to a PDF and bundled into a single ZIP.

A sample list lives at `public/sample-class.csv` (linked from the upload step).

## Tech

| Concern        | Library                          |
| -------------- | -------------------------------- |
| Spreadsheets   | SheetJS (`xlsx`)                 |
| PDF rendering  | `pdf-lib` (pure JS, no binaries) |
| ZIP packaging  | `jszip`                          |

The PDF and HTML-preview renderers share the same field keys, so one column
mapping drives both.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On vercel.com → **Add New → Project** → import the repo.
3. Next.js auto-detects. No settings to change. **Deploy.**

No environment variables, no database.

## Project layout

```
app/
  page.tsx              wizard UI (client component)
  layout.tsx
  globals.css
  api/
    templates/route.ts  GET  template metadata
    upload/route.ts     POST parse spreadsheet → { columns, rows }
    preview/route.ts    POST first-row HTML preview
    generate/route.ts   POST all rows → ZIP of PDFs
lib/
  templates.ts          field schema + HTML rendering
  parse.ts              spreadsheet → rows
  pdf.ts                pdf-lib document rendering
public/
  sample-class.csv
```
