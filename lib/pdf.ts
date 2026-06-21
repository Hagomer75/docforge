// PDF rendering with pdf-lib. Pure JS with the standard 14 fonts embedded, so
// it runs in a Node serverless function with no binaries or font files on disk.
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
  RGB,
} from "pdf-lib";
import { FieldValues } from "./templates";

function hex(h: string): RGB {
  const n = parseInt(h.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const C = {
  ink: hex("#1C2A39"),
  edu: hex("#2F6F6A"),
  gold: hex("#C8923A"),
  line: hex("#E7E3DB"),
  muted: hex("#6B7785"),
  paper: hex("#FBFAF7"),
};

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

async function certificatePDF(doc: PDFDocument, v: FieldValues): Promise<void> {
  const page = doc.addPage([841.89, 595.28]); // A4 landscape
  const { width, height } = page.getSize();
  const serifB = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifI = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansB = await doc.embedFont(StandardFonts.HelveticaBold);
  const mid = width / 2;

  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: C.edu,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 34,
    y: 34,
    width: width - 68,
    height: height - 68,
    borderColor: C.gold,
    borderWidth: 1,
  });

  drawCentered(page, mid, 478, spaced("Certificate of Achievement"), sansB, 11, C.gold);
  drawCentered(page, mid, 432, v.award_title || "Award", serifB, 30, C.edu);
  drawCentered(page, mid, 392, "This certificate is proudly presented to", sans, 12, C.muted);
  drawCentered(page, mid, 348, v.recipient_name || "Recipient name", serifB, 32, C.ink);
  page.drawLine({
    start: { x: width * 0.28, y: 338 },
    end: { x: width * 0.72, y: 338 },
    color: C.line,
    thickness: 1.5,
  });

  const detail = wrap(serifI, 12, width * 0.66, v.detail);
  detail.forEach((ln, i) =>
    drawCentered(page, mid, 308 - i * 17, ln, serifI, 12, C.muted)
  );

  const cols: [number, string, string][] = [
    [width * 0.27, v.teacher, "Teacher"],
    [width * 0.5, v.date, "Date"],
    [width * 0.73, v.school, "School"],
  ];
  for (const [cx, value, label] of cols) {
    if (value) drawCentered(page, cx, 104, value, sansB, 12, C.ink);
    page.drawLine({
      start: { x: cx - 70, y: 96 },
      end: { x: cx + 70, y: 96 },
      color: C.line,
      thickness: 1,
    });
    drawCentered(page, cx, 82, label, sans, 10, C.muted);
  }
}

async function progressReportPDF(doc: PDFDocument, v: FieldValues): Promise<void> {
  const page = doc.addPage([595.28, 841.89]); // A4 portrait
  const { width, height } = page.getSize();
  const serifB = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansB = await doc.embedFont(StandardFonts.HelveticaBold);
  const M = 48;
  const right = width - M;

  let y = height - 70;
  page.drawText("Progress Report", { x: M, y, size: 22, font: serifB, color: C.edu });
  const meta = [v.term, v.date].filter(Boolean);
  meta.forEach((m, i) => {
    const w = sans.widthOfTextAtSize(m, 11);
    page.drawText(m, { x: right - w, y: y + 4 - i * 14, size: 11, font: sans, color: C.muted });
  });
  y -= 16;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, color: C.edu, thickness: 2 });

  // Student / class
  y -= 40;
  page.drawText("STUDENT", { x: M, y: y + 18, size: 9, font: sans, color: C.muted });
  page.drawText(v.student_name || "Student name", { x: M, y, size: 16, font: sansB, color: C.ink });
  page.drawText("CLASS", { x: width / 2, y: y + 18, size: 9, font: sans, color: C.muted });
  page.drawText(v.class_name || "—", { x: width / 2, y, size: 16, font: sansB, color: C.ink });

  // Marks table
  y -= 42;
  const rowH = 30;
  page.drawRectangle({ x: M, y: y - 6, width: right - M, height: 24, color: C.paper });
  page.drawText("SUBJECT", { x: M + 12, y, size: 10, font: sans, color: C.muted });
  page.drawText("MARK", { x: right - 70, y, size: 10, font: sans, color: C.muted });
  y -= 8;

  const subjects: [string, string][] = [
    ["Mathematics", v.math],
    ["English", v.english],
    ["Science", v.science],
  ];
  for (const [name, mark] of subjects) {
    page.drawLine({ start: { x: M, y }, end: { x: right, y }, color: C.line, thickness: 1 });
    y -= rowH;
    page.drawText(name, { x: M + 12, y: y + 9, size: 13, font: sans, color: C.ink });
    const mk = mark || "—";
    const mw = sansB.widthOfTextAtSize(mk, 13);
    page.drawText(mk, { x: right - 12 - mw, y: y + 9, size: 13, font: sansB, color: C.ink });
  }
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, color: C.line, thickness: 1 });

  // Comment box
  y -= 36;
  const commentLines = wrap(sans, 12, right - M - 28, v.comment || "—");
  const boxH = Math.max(64, 34 + commentLines.length * 17);
  page.drawRectangle({
    x: M,
    y: y - boxH + 18,
    width: right - M,
    height: boxH,
    color: C.paper,
    borderColor: C.line,
    borderWidth: 1,
  });
  page.drawText("TEACHER'S COMMENT", { x: M + 14, y: y, size: 9, font: sansB, color: C.gold });
  commentLines.forEach((ln, i) =>
    page.drawText(ln, { x: M + 14, y: y - 20 - i * 17, size: 12, font: sans, color: C.ink })
  );

  // Signature
  const sy = 90;
  page.drawLine({ start: { x: M, y: sy }, end: { x: M + 180, y: sy }, color: C.line, thickness: 1 });
  if (v.teacher) page.drawText(v.teacher, { x: M, y: sy + 6, size: 12, font: sansB, color: C.ink });
  page.drawText("Teacher", { x: M, y: sy - 14, size: 10, font: sans, color: C.muted });
  page.drawLine({ start: { x: right - 180, y: sy }, end: { x: right, y: sy }, color: C.line, thickness: 1 });
  page.drawText("Signature", { x: right - 180, y: sy - 14, size: 10, font: sans, color: C.muted });
}

export async function renderPDF(slug: string, v: FieldValues): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  if (slug === "progress-report") {
    await progressReportPDF(doc, v);
  } else {
    await certificatePDF(doc, v);
  }
  return doc.save();
}
