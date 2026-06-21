import { NextRequest, NextResponse } from "next/server";
import {
  FieldValues,
  getTemplate,
  resolveSubjects,
  resolveValues,
} from "@/lib/templates";
import { renderPDF, renderCardSheet, SheetRow } from "@/lib/pdf";
import { qrDataUrl } from "@/lib/qr";
import { fetchImageDataUrl } from "@/lib/image";

export const runtime = "nodejs";
export const maxDuration = 60;

// One request renders a *batch* of rows and returns base64 PDFs. The client
// streams batches and assembles the final ZIP in the browser, so a whole grade
// never has to render inside a single serverless invocation (60s / memory cap).
const MAX_BATCH = 40;
const SHEET_MAX = 100; // sheet mode sends every row in one request
const CARD_SLUGS = new Set(["student-id-card", "library-card", "hall-pass"]);

function safeName(s: string, fallback: string): string {
  const cleaned = s.replace(/[^a-z0-9\- ]/gi, "").trim().replace(/\s+/g, "_");
  return cleaned || fallback;
}

// Build a filename from a pattern like "{recipient_name}-{class_name}".
// Unknown / empty tokens drop out; result is always filesystem-safe.
function applyPattern(
  pattern: string | undefined,
  values: FieldValues,
  fallback: string
): string {
  if (!pattern || !pattern.trim()) return fallback;
  const filled = pattern.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
  return safeName(filled, fallback);
}

export async function POST(req: NextRequest) {
  try {
    const {
      templateSlug,
      mapping,
      subjectColumns,
      branding,
      rows,
      startIndex,
      filenamePattern,
      lang,
      cardsPerPage,
      cutGuides,
      labels,
      cardOrientation,
      cardBack,
    } = await req.json();
    const orient = cardOrientation === "portrait" ? "portrait" : "landscape";
    const template = getTemplate(templateSlug);
    if (!template) {
      return NextResponse.json({ error: "Unknown template." }, { status: 400 });
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data rows to generate." }, { status: 400 });
    }
    const sheetMode = Number(cardsPerPage) > 1 && CARD_SLUGS.has(template.slug);
    const cap = sheetMode ? SHEET_MAX : MAX_BATCH;
    if (rows.length > cap) {
      return NextResponse.json(
        { error: `Batch too large (max ${cap} rows per request).` },
        { status: 400 }
      );
    }

    const map = mapping ?? {};
    const missing = template.fields
      .filter((f) => f.required && !map[f.key])
      .map((f) => f.label);
    if (missing.length) {
      return NextResponse.json(
        { error: `Map the required field(s): ${missing.join(", ")}.` },
        { status: 400 }
      );
    }

    const nameKey = template.fields.find((f) => f.required)?.key ?? template.fields[0].key;
    const offset = Number.isInteger(startIndex) ? startIndex : 0;

    // Pre-fetch photos for the whole batch in parallel (each guarded).
    const photos: (string | undefined)[] = template.photoField
      ? await Promise.all(
          rows.map((r: Record<string, unknown>) => {
            const col = map[template.photoField!];
            const url = col ? r[col] : undefined;
            return fetchImageDataUrl(url == null ? "" : String(url));
          })
        )
      : [];

    const docLang = lang === "ar" ? "ar" : "en";

    // Sheet mode: tile every card onto shared A4 pages → one combined PDF.
    if (sheetMode) {
      const sheetRows: SheetRow[] = await Promise.all(
        rows.map(async (r: Record<string, unknown>, i: number) => {
          const values = resolveValues(template, map, r);
          const qr = template.qrField ? await qrDataUrl(values[template.qrField]) : undefined;
          return { v: values, qrDataUrl: qr, photoDataUrl: photos[i] };
        })
      );
      const pdf = await renderCardSheet(template.slug, sheetRows, {
        branding,
        lang: docLang,
        cardsPerPage,
        cutGuides,
        labels,
        cardOrientation: orient,
        // backs are for single-card duplex printing, not N-up sheets
      });
      return NextResponse.json({
        sheet: true,
        files: [{ name: `${template.slug}-sheet`, data: Buffer.from(pdf).toString("base64") }],
      });
    }

    const files: { name: string; data: string }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const values = resolveValues(template, map, rows[i]);
      const subjects = template.subjects
        ? resolveSubjects(subjectColumns ?? [], rows[i])
        : undefined;
      const qr = template.qrField ? await qrDataUrl(values[template.qrField]) : undefined;
      const pdf = await renderPDF(template.slug, values, {
        subjects,
        branding,
        qrDataUrl: qr,
        photoDataUrl: photos[i],
        lang: lang === "ar" ? "ar" : "en",
        labels,
        cardOrientation: orient,
        cardBack: !!cardBack,
      });
      const base = applyPattern(
        filenamePattern,
        values,
        safeName(values[nameKey] || "", `row-${offset + i + 1}`)
      );
      files.push({
        name: base,
        data: Buffer.from(pdf).toString("base64"),
      });
    }

    return NextResponse.json({ files });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
