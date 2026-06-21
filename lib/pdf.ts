// PDF rendering with pdf-lib. Pure JS with the standard 14 fonts embedded, so
// it runs in a Node serverless function with no binaries or font files on disk.
import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  StandardFonts,
  rgb,
  RGB,
} from "pdf-lib";
import { Branding, FieldValues, RenderOpts } from "./templates";

function hex(h: string): RGB {
  const n = parseInt(h.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const C = {
  ink: hex("#1C2A39"),
  gold: hex("#C8923A"),
  line: hex("#E7E3DB"),
  muted: hex("#6B7785"),
  paper: hex("#FBFAF7"),
};

function accentColor(branding?: Branding): RGB {
  const a = branding?.accent;
  return a && /^#[0-9a-fA-F]{6}$/.test(a) ? hex(a) : hex("#2F6F6A");
}

function spaced(text: string): string {
  return text.toUpperCase().split("").join(" ");
}

function wrap(font: PDFFont, size: number, max: number, text: string): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(test, size) > max && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawCentered(
  page: PDFPage,
  cx: number,
  y: number,
  text: string,
  font: PDFFont,
  size: number,
  color: RGB
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: cx - w / 2, y, size, font, color });
}

// Embed a data-URL logo. Returns the image scaled to fit maxH/maxW, or null.
async function embedLogo(
  doc: PDFDocument,
  branding: Branding | undefined,
  maxH: number,
  maxW: number
): Promise<{ image: PDFImage; w: number; h: number } | null> {
  const url = branding?.logoDataUrl;
  if (!url) return null;
  const m = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(url);
  if (!m) return null;
  try {
    const isPng = m[1].toLowerCase() === "png";
    const bytes = Buffer.from(m[2], "base64");
    const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const { width: w, height: h } = image;
    const scale = Math.min(maxH / h, maxW / w, 1);
    return { image, w: w * scale, h: h * scale };
  } catch {
    return null; // bad image data should never break the whole batch
  }
}

async function certificatePDF(
  doc: PDFDocument,
  v: FieldValues,
  opts: RenderOpts
): Promise<void> {
  const page = doc.addPage([841.89, 595.28]); // A4 landscape
  const { width, height } = page.getSize();
  const edu = accentColor(opts.branding);
  const serifB = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifI = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansB = await doc.embedFont(StandardFonts.HelveticaBold);
  const mid = width / 2;

  page.drawRectangle({
    x: 24, y: 24, width: width - 48, height: height - 48,
    borderColor: edu, borderWidth: 3,
  });
  page.drawRectangle({
    x: 34, y: 34, width: width - 68, height: height - 68,
    borderColor: C.gold, borderWidth: 1,
  });

  // Optional logo + school name stacked above the kicker (kicker sits at 466).
  const logo = await embedLogo(doc, opts.branding, 46, 170);
  const school = opts.branding?.schoolName?.trim();
  let schoolY = 500;
  if (logo) {
    const top = 548;
    page.drawImage(logo.image, {
      x: mid - logo.w / 2, y: top - logo.h, width: logo.w, height: logo.h,
    });
    schoolY = top - logo.h - 13;
  }
  if (school) drawCentered(page, mid, schoolY, school, serifB, 13, edu);

  drawCentered(page, mid, 466, spaced("Certificate of Achievement"), sansB, 11, C.gold);
  drawCentered(page, mid, 424, v.award_title || "Award", serifB, 28, edu);
  drawCentered(page, mid, 388, "This certificate is proudly presented to", sans, 12, C.muted);
  drawCentered(page, mid, 346, v.recipient_name || "Recipient name", serifB, 32, C.ink);
  page.drawLine({
    start: { x: width * 0.28, y: 336 }, end: { x: width * 0.72, y: 336 },
    color: C.line, thickness: 1.5,
  });

  const detail = wrap(serifI, 12, width * 0.66, v.detail);
  detail.forEach((ln, i) => drawCentered(page, mid, 306 - i * 17, ln, serifI, 12, C.muted));

  const cols: [number, string, string][] = [
    [width * 0.27, v.teacher, "Teacher"],
    [width * 0.5, v.date, "Date"],
    [width * 0.73, v.school, "School"],
  ];
  for (const [cx, value, label] of cols) {
    if (value) drawCentered(page, cx, 104, value, sansB, 12, C.ink);
    page.drawLine({ start: { x: cx - 70, y: 96 }, end: { x: cx + 70, y: 96 }, color: C.line, thickness: 1 });
    drawCentered(page, cx, 82, label, sans, 10, C.muted);
  }
}

async function progressReportPDF(
  doc: PDFDocument,
  v: FieldValues,
  opts: RenderOpts
): Promise<void> {
  const page = doc.addPage([595.28, 841.89]); // A4 portrait
  const { width, height } = page.getSize();
  const edu = accentColor(opts.branding);
  const serifB = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansB = await doc.embedFont(StandardFonts.HelveticaBold);
  const M = 48;
  const right = width - M;

  let y = height - 70;
  const school = opts.branding?.schoolName?.trim();

  // Optional logo at top-left, title beside it.
  const logo = await embedLogo(doc, opts.branding, 40, 120);
  let titleX = M;
  if (logo) {
    page.drawImage(logo.image, { x: M, y: y - 6, width: logo.w, height: logo.h });
    titleX = M + logo.w + 12;
  }
  page.drawText("Progress Report", { x: titleX, y, size: 22, font: serifB, color: edu });
  if (school) page.drawText(school, { x: titleX, y: y - 15, size: 11, font: sans, color: C.muted });

  const meta = [v.term, v.date].filter(Boolean);
  meta.forEach((mtxt, i) => {
    const w = sans.widthOfTextAtSize(mtxt, 11);
    page.drawText(mtxt, { x: right - w, y: y + 4 - i * 14, size: 11, font: sans, color: C.muted });
  });
  y -= 22;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, color: edu, thickness: 2 });

  // Student / class
  y -= 40;
  page.drawText("STUDENT", { x: M, y: y + 18, size: 9, font: sans, color: C.muted });
  page.drawText(v.student_name || "Student name", { x: M, y, size: 16, font: sansB, color: C.ink });
  page.drawText("CLASS", { x: width / 2, y: y + 18, size: 9, font: sans, color: C.muted });
  page.drawText(v.class_name || "—", { x: width / 2, y, size: 16, font: sansB, color: C.ink });

  // Marks table — rows come from the chosen subject columns.
  y -= 42;
  const rowH = 28;
  page.drawRectangle({ x: M, y: y - 6, width: right - M, height: 24, color: C.paper });
  page.drawText("SUBJECT", { x: M + 12, y, size: 10, font: sans, color: C.muted });
  page.drawText("MARK", { x: right - 70, y, size: 10, font: sans, color: C.muted });
  y -= 8;

  const subjects = opts.subjects ?? [];
  const rows = subjects.length ? subjects : [{ label: "—", mark: "—" }];
  for (const s of rows) {
    page.drawLine({ start: { x: M, y }, end: { x: right, y }, color: C.line, thickness: 1 });
    y -= rowH;
    page.drawText(s.label, { x: M + 12, y: y + 8, size: 13, font: sans, color: C.ink });
    const mk = s.mark || "—";
    const mw = sansB.widthOfTextAtSize(mk, 13);
    page.drawText(mk, { x: right - 12 - mw, y: y + 8, size: 13, font: sansB, color: C.ink });
  }
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, color: C.line, thickness: 1 });

  // Comment box
  y -= 34;
  const commentLines = wrap(sans, 12, right - M - 28, v.comment || "—");
  const boxH = Math.max(60, 32 + commentLines.length * 17);
  page.drawRectangle({
    x: M, y: y - boxH + 18, width: right - M, height: boxH,
    color: C.paper, borderColor: C.line, borderWidth: 1,
  });
  page.drawText("TEACHER'S COMMENT", { x: M + 14, y, size: 9, font: sansB, color: C.gold });
  commentLines.forEach((ln, i) =>
    page.drawText(ln, { x: M + 14, y: y - 20 - i * 17, size: 12, font: sans, color: C.ink })
  );

  // Signature
  const sy = 80;
  page.drawLine({ start: { x: M, y: sy }, end: { x: M + 180, y: sy }, color: C.line, thickness: 1 });
  if (v.teacher) page.drawText(v.teacher, { x: M, y: sy + 6, size: 12, font: sansB, color: C.ink });
  page.drawText("Teacher", { x: M, y: sy - 14, size: 10, font: sans, color: C.muted });
  page.drawLine({ start: { x: right - 180, y: sy }, end: { x: right, y: sy }, color: C.line, thickness: 1 });
  page.drawText("Signature", { x: right - 180, y: sy - 14, size: 10, font: sans, color: C.muted });
}

export async function renderPDF(
  slug: string,
  v: FieldValues,
  opts: RenderOpts = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  if (slug === "progress-report") {
    await progressReportPDF(doc, v, opts);
  } else {
    await certificatePDF(doc, v, opts);
  }
  return doc.save();
}
