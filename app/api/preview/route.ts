import { NextRequest, NextResponse } from "next/server";
import { getTemplate, renderHTML, resolveValues } from "@/lib/templates";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { templateSlug, mapping, row } = await req.json();
    const template = getTemplate(templateSlug);
    if (!template) {
      return NextResponse.json({ error: "Unknown template." }, { status: 400 });
    }
    const values = resolveValues(template, mapping ?? {}, row ?? {});
    return NextResponse.json({ html: renderHTML(template.slug, values) });
  } catch {
    return NextResponse.json({ error: "Could not build preview." }, { status: 400 });
  }
}
