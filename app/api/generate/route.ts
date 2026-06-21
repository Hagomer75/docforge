import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { getTemplate, resolveValues } from "@/lib/templates";
import { renderPDF } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

function safeName(s: string, fallback: string): string {
  const cleaned = s.replace(/[^a-z0-9\- ]/gi, "").trim().replace(/\s+/g, "_");
  return cleaned || fallback;
}

export async function POST(req: NextRequest) {
  try {
    const { templateSlug, mapping, rows } = await req.json();
    const template = getTemplate(templateSlug);
    if (!template) {
      return NextResponse.json({ error: "Unknown template." }, { status: 400 });
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data rows to generate." }, { status: 400 });
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

    const zip = new JSZip();
    const used = new Map<string, number>();

    for (let i = 0; i < rows.length; i++) {
      const values = resolveValues(template, map, rows[i]);
      const pdf = await renderPDF(template.slug, values);

      let base = safeName(values[nameKey] || "", `row-${i + 1}`);
      const count = used.get(base) ?? 0;
      used.set(base, count + 1);
      if (count > 0) base = `${base}-${count + 1}`;

      zip.file(`${template.slug}/${base}.pdf`, pdf);
    }

    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="docforge-${template.slug}.zip"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
