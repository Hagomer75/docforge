import { NextRequest, NextResponse } from "next/server";
import {
  getTemplate,
  renderHTML,
  resolveSubjects,
  resolveValues,
} from "@/lib/templates";
import { qrDataUrl } from "@/lib/qr";
import { fetchImageDataUrl } from "@/lib/image";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { templateSlug, mapping, subjectColumns, branding, row, lang, labels } = await req.json();
    const template = getTemplate(templateSlug);
    if (!template) {
      return NextResponse.json({ error: "Unknown template." }, { status: 400 });
    }
    const values = resolveValues(template, mapping ?? {}, row ?? {});
    const subjects = template.subjects
      ? resolveSubjects(subjectColumns ?? [], row ?? {})
      : undefined;
    const qr = template.qrField ? await qrDataUrl(values[template.qrField]) : undefined;
    const photo = template.photoField
      ? await fetchImageDataUrl(values[template.photoField])
      : undefined;
    return NextResponse.json({
      html: renderHTML(template.slug, values, {
        subjects,
        branding,
        qrDataUrl: qr,
        photoDataUrl: photo,
        lang: lang === "ar" ? "ar" : "en",
        labels,
      }),
    });
  } catch {
    return NextResponse.json({ error: "Could not build preview." }, { status: 400 });
  }
}
