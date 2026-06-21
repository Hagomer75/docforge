import { NextRequest, NextResponse } from "next/server";
import { getTemplate, resolveSubjects, resolveValues } from "@/lib/templates";
import { renderPDF } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

// One request renders a *batch* of rows and returns base64 PDFs. The client
// streams batches and assembles the final ZIP in the browser, so a whole grade
// never has to render inside a single serverless invocation (60s / memory cap).
const MAX_BATCH = 40;

function safeName(s: string, fallback: string): string {
  const cleaned = s.replace(/[^a-z0-9\- ]/gi, "").trim().replace(/\s+/g, "_");
  return cleaned || fallback;
}

export async function POST(req: NextRequest) {
  try {
    const { templateSlug, mapping, subjectColumns, branding, rows, startIndex } =
      await req.json();
    const template = getTemplate(templateSlug);
    if (!template) {
      return NextResponse.json({ error: "Unknown template." }, { status: 400 });
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data rows to generate." }, { status: 400 });
    }
    if (rows.length > MAX_BATCH) {
      return NextResponse.json(
        { error: `Batch too large (max ${MAX_BATCH} rows per request).` },
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

    const files: { name: string; data: string }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const values = resolveValues(template, map, rows[i]);
      const subjects = template.subjects
        ? resolveSubjects(subjectColumns ?? [], rows[i])
        : undefined;
      const pdf = await renderPDF(template.slug, values, { subjects, branding });
      const base = safeName(values[nameKey] || "", `row-${offset + i + 1}`);
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
