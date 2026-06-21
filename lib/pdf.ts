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

// Embed any data-URL image (signature, QR) scaled to fit.
async function embedDataUrl(
  doc: PDFDocument,
  url: string | undefined,
  maxH: number,
  maxW: number
): Promise<{ image: PDFImage; w: number; h: number } | null> {
  if (!url) return null;
  const m = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(url);
  if (!m) return null;
  try {
    const bytes = Buffer.from(m[2], "base64");
    const image =
      m[1].toLowerCase() === "png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const { width: w, height: h } = image;
    const scale = Math.min(maxH / h, maxW / w, 1);
    return { image, w: w * scale, h: h * scale };
  } catch {
    return null;
  }
}

// Shared header band for A4 documents: logo + title + school, with a divider.
// Returns the y just below the divider.
async function drawDocHeader(
  doc: PDFDocument,
  page: PDFPage,
  title: string,
  opts: RenderOpts,
  edu: RGB,
  metaLines: string[]
): Promise<number> {
  const { width, height } = page.getSize();
  const serifB = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const M = 48;
  const right = width - M;
  let y = height - 70;

  const logo = await embedDataUrl(doc, opts.branding?.logoDataUrl, 40, 120);
  let titleX = M;
  if (logo) {
    page.drawImage(logo.image, { x: M, y: y - 6, width: logo.w, height: logo.h });
    titleX = M + logo.w + 12;
  }
  page.drawText(title, { x: titleX, y, size: 22, font: serifB, color: edu });
  const school = opts.branding?.schoolName?.trim();
  if (school) page.drawText(school, { x: titleX, y: y - 15, size: 11, font: sans, color: C.muted });

  metaLines.filter(Boolean).forEach((line, i) => {
    const w = sans.widthOfTextAtSize(line, 11);
    page.drawText(line, { x: right - w, y: y + 4 - i * 14, size: 11, font: sans, color: C.muted });
  });

  y -= 22;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, color: edu, thickness: 2 });
  return y - 6;
}

// Signature + stamp row near the bottom of a document.
async function drawSignatureRow(
  doc: PDFDocument,
  page: PDFPage,
  opts: RenderOpts,
  edu: RGB,
  label: string,
  value: string
): Promise<void> {
  const { width } = page.getSize();
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansB = await doc.embedFont(StandardFonts.HelveticaBold);
  const M = 48;
  const right = width - M;
  const sy = 96;

  const sig = await embedDataUrl(doc, opts.branding?.signatureDataUrl, 34, 150);
  if (sig) page.drawImage(sig.image, { x: M, y: sy + 4, width: sig.w, height: sig.h });
  page.drawLine({ start: { x: M, y: sy }, end: { x: M + 170, y: sy }, color: C.line, thickness: 1 });
  if (value) page.drawText(value, { x: M, y: sy - 14, size: 12, font: sansB, color: C.ink });
  if (label) page.drawText(label, { x: M, y: sy - 28, size: 10, font: sans, color: C.muted });

  page.drawLine({ start: { x: right - 170, y: sy }, end: { x: right, y: sy }, color: edu, thickness: 1 });
  page.drawText("Official stamp", { x: right - 170, y: sy - 14, size: 10, font: sans, color: C.muted });
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

  // Header band: logo + school name on one row, aligned per logoPos, sitting
  // well above the kicker (466) so they can never overlap.
  const logo = await embedLogo(doc, opts.branding, 40, 150);
  const school = opts.branding?.schoolName?.trim();
  const pos = opts.branding?.logoPos ?? "center";
  const gap = 12;
  const schoolSize = 14;
  const bandY = 516;
  const schoolW = school ? serifB.widthOfTextAtSize(school, schoolSize) : 0;
  const logoW = logo ? logo.w : 0;
  const totalW = logoW + (logo && school ? gap : 0) + schoolW;
  let startX = mid - totalW / 2;
  if (pos === "left") startX = 60;
  else if (pos === "right") startX = width - 60 - totalW;
  if (logo) {
    page.drawImage(logo.image, {
      x: startX, y: bandY - logo.h / 2, width: logo.w, height: logo.h,
    });
  }
  if (school) {
    page.drawText(school, {
      x: startX + logoW + (logo ? gap : 0),
      y: bandY - schoolSize / 2 + 1,
      size: schoolSize,
      font: serifB,
      color: edu,
    });
  }

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
  const sig = await embedDataUrl(doc, opts.branding?.signatureDataUrl, 30, 150);
  if (sig) page.drawImage(sig.image, { x: M, y: sy + 4, width: sig.w, height: sig.h });
  page.drawLine({ start: { x: M, y: sy }, end: { x: M + 180, y: sy }, color: C.line, thickness: 1 });
  if (v.teacher) page.drawText(v.teacher, { x: M, y: sy + 6, size: 12, font: sansB, color: C.ink });
  page.drawText("Teacher", { x: M, y: sy - 14, size: 10, font: sans, color: C.muted });
  page.drawLine({ start: { x: right - 180, y: sy }, end: { x: right, y: sy }, color: C.line, thickness: 1 });
  page.drawText("Signature", { x: right - 180, y: sy - 14, size: 10, font: sans, color: C.muted });
}

/* ---------- fee receipt ---------- */

async function feeReceiptPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const page = doc.addPage([595.28, 841.89]);
  const { width } = page.getSize();
  const edu = accentColor(opts.branding);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansB = await doc.embedFont(StandardFonts.HelveticaBold);
  const M = 48;
  const right = width - M;

  let y = await drawDocHeader(doc, page, "Fee Receipt", opts, edu, [
    `Receipt: ${v.receipt_no || "—"}`,
    v.date || "",
  ]);

  // received from / method
  y -= 34;
  page.drawText("RECEIVED FROM", { x: M, y: y + 16, size: 9, font: sans, color: C.muted });
  page.drawText(v.student_name || "Student name", { x: M, y, size: 15, font: sansB, color: C.ink });
  page.drawText("METHOD", { x: width / 2, y: y + 16, size: 9, font: sans, color: C.muted });
  page.drawText(v.payment_method || "—", { x: width / 2, y, size: 15, font: sansB, color: C.ink });

  // line item table
  y -= 36;
  page.drawRectangle({ x: M, y: y - 6, width: right - M, height: 24, color: C.paper });
  page.drawText("DESCRIPTION", { x: M + 12, y, size: 10, font: sans, color: C.muted });
  page.drawText("AMOUNT", { x: right - 90, y, size: 10, font: sans, color: C.muted });
  y -= 8;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, color: C.line, thickness: 1 });
  y -= 30;
  page.drawText(v.fee_type || "Tuition fee", { x: M + 12, y: y + 9, size: 13, font: sans, color: C.ink });
  const amt = v.amount || "—";
  const aw = sansB.widthOfTextAtSize(amt, 13);
  page.drawText(amt, { x: right - 12 - aw, y: y + 9, size: 13, font: sansB, color: C.ink });
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, color: C.line, thickness: 1 });

  // totals
  const tx = right - 230;
  const totalRow = (yy: number, label: string, val: string, big = false) => {
    page.drawText(label, { x: tx, y: yy, size: big ? 13 : 11, font: big ? sansB : sans, color: big ? edu : C.muted });
    const f = big ? sansB : sans;
    const w = f.widthOfTextAtSize(val, big ? 15 : 12);
    page.drawText(val, { x: right - w, y: yy, size: big ? 15 : 12, font: big ? sansB : sans, color: big ? edu : C.ink });
  };
  y -= 26;
  totalRow(y, "Total", v.amount || "—");
  y -= 18;
  totalRow(y, "Paid", v.amount_paid || v.amount || "—");
  y -= 8;
  page.drawLine({ start: { x: tx, y }, end: { x: right, y }, color: edu, thickness: 1.5 });
  y -= 20;
  totalRow(y, "Balance", v.balance || "0", true);

  // PAID pill
  y -= 30;
  page.drawRectangle({ x: M, y: y - 4, width: 58, height: 20, color: edu });
  page.drawText("PAID", { x: M + 14, y: y + 1, size: 11, font: sansB, color: rgb(1, 1, 1) });

  await drawSignatureRow(doc, page, opts, edu, "Received by", v.received_by);
}

/* ---------- cards (ID + library) ---------- */

type CardCfg = {
  tag: string;
  role: string;
  name: string;
  rows: { k: string; v: string }[];
  idValue: string;
};

async function cardPDF(
  doc: PDFDocument,
  cfg: CardCfg,
  opts: RenderOpts
): Promise<void> {
  const W = 360, H = 227;
  const page = doc.addPage([W, H]);
  const edu = accentColor(opts.branding);
  const serifB = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansB = await doc.embedFont(StandardFonts.HelveticaBold);
  const white = rgb(1, 1, 1);

  // top colour bar: school name + tag
  const barH = 40;
  page.drawRectangle({ x: 0, y: H - barH, width: W, height: barH, color: edu });
  page.drawText(opts.branding?.schoolName?.trim() || "School name", {
    x: 16, y: H - 26, size: 13, font: serifB, color: white,
  });
  const tw = sans.widthOfTextAtSize(cfg.tag, 8);
  page.drawText(cfg.tag, { x: W - 16 - tw, y: H - 24, size: 8, font: sans, color: white });

  // photo (left)
  const boxX = 16, boxW = 50, boxH = 64, boxTop = H - barH - 10;
  const photo = await embedDataUrl(doc, opts.photoDataUrl, boxH, boxW);
  if (photo) {
    page.drawImage(photo.image, {
      x: boxX + (boxW - photo.w) / 2,
      y: boxTop - boxH + (boxH - photo.h) / 2,
      width: photo.w, height: photo.h,
    });
  } else {
    page.drawRectangle({
      x: boxX, y: boxTop - boxH, width: boxW, height: boxH,
      borderColor: C.line, borderWidth: 1, color: C.paper,
    });
  }

  // info (middle)
  const ix = boxX + boxW + 14;
  let y = H - barH - 26;
  page.drawText(cfg.name || "Full name", { x: ix, y, size: 16, font: serifB, color: C.ink });
  y -= 13;
  page.drawText(cfg.role.toUpperCase(), { x: ix, y, size: 8, font: sans, color: C.muted });
  y -= 22;
  for (const r of cfg.rows) {
    page.drawText(r.k.toUpperCase(), { x: ix, y, size: 8, font: sans, color: C.muted });
    page.drawText(r.v || "—", { x: ix, y: y - 13, size: 13, font: sansB, color: C.ink });
    y -= 30;
  }

  // QR (right)
  const qr = await embedDataUrl(doc, opts.qrDataUrl, 76, 76);
  const qrX = W - 16 - 76;
  if (qr) {
    page.drawImage(qr.image, { x: qrX, y: 36, width: qr.w, height: qr.h });
  } else {
    page.drawRectangle({ x: qrX, y: 36, width: 76, height: 76, borderColor: C.line, borderWidth: 1 });
  }
  const idw = sansB.widthOfTextAtSize(cfg.idValue, 10);
  page.drawText(cfg.idValue, { x: qrX + 38 - idw / 2, y: 20, size: 10, font: sansB, color: edu });
}

async function idCardPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  await cardPDF(doc, {
    tag: "STUDENT ID", role: "Student", name: v.full_name,
    rows: [{ k: "Class", v: v.class_name }, { k: "Valid until", v: v.valid_until }],
    idValue: v.student_id || "ID-000",
  }, opts);
}

async function libraryCardPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  await cardPDF(doc, {
    tag: "LIBRARY", role: "Member", name: v.full_name,
    rows: [{ k: "Class", v: v.class_name }, { k: "Expires", v: v.expiry }],
    idValue: v.member_id || "MEM-000",
  }, opts);
}

async function hallPassPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const W = 400, H = 200;
  const page = doc.addPage([W, H]);
  const edu = accentColor(opts.branding);
  const serifB = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansB = await doc.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 0, width: 10, height: H, color: edu });
  const M = 28;
  let y = H - 28;
  page.drawText("CORRIDOR PASS", { x: M, y, size: 8, font: sansB, color: edu });
  const school = opts.branding?.schoolName?.trim();
  if (school) {
    const w = sans.widthOfTextAtSize(school, 9);
    page.drawText(school, { x: W - 18 - w, y, size: 9, font: sans, color: C.muted });
  }
  y -= 26;
  page.drawText("Hall Pass", { x: M, y, size: 24, font: serifB, color: C.ink });
  y -= 22;
  page.drawText("Permission for", { x: M, y, size: 9, font: sans, color: C.muted });
  y -= 18;
  page.drawText(v.student_name || "Student name", { x: M, y, size: 18, font: serifB, color: C.ink });

  const cells: [string, string][] = [
    ["Destination", v.destination],
    ["Time out", v.time_out],
    ["Date", v.date],
    ["Issued by", v.teacher],
  ];
  const cw = (W - M - 18) / 4;
  cells.forEach(([k, val], i) => {
    const cx = M + i * cw;
    page.drawText(k.toUpperCase(), { x: cx, y: 44, size: 8, font: sans, color: C.muted });
    page.drawText(val || "—", { x: cx, y: 28, size: 13, font: sansB, color: C.ink });
  });
}

/* ---------- letters ---------- */

async function letterPDF(
  doc: PDFDocument,
  opts: RenderOpts,
  title: string,
  greeting: string,
  paragraphs: string[],
  facts: { k: string; v: string }[],
  signLabel: string,
  signValue: string,
  v: FieldValues
): Promise<void> {
  const page = doc.addPage([595.28, 841.89]);
  const { width } = page.getSize();
  const edu = accentColor(opts.branding);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansB = await doc.embedFont(StandardFonts.HelveticaBold);
  const M = 48;
  const right = width - M;
  const textW = right - M;

  let y = await drawDocHeader(doc, page, title, opts, edu, [v.date || ""]);
  y -= 30;
  page.drawText(greeting, { x: M, y, size: 13, font: sansB, color: C.ink });
  y -= 24;

  const drawPara = (text: string) => {
    for (const ln of wrap(sans, 12, textW, text)) {
      page.drawText(ln, { x: M, y, size: 12, font: sans, color: C.ink });
      y -= 18;
    }
    y -= 8;
  };
  if (paragraphs[0]) drawPara(paragraphs[0]);

  // facts box
  if (facts.length) {
    const cols = 3;
    const colW = textW / cols;
    const rows = Math.ceil(facts.length / cols);
    const boxH = 18 + rows * 34;
    page.drawRectangle({
      x: M, y: y - boxH + 10, width: textW, height: boxH,
      color: C.paper, borderColor: C.line, borderWidth: 1,
    });
    facts.forEach((f, i) => {
      const cx = M + 14 + (i % cols) * colW;
      const cy = y - 6 - Math.floor(i / cols) * 34;
      page.drawText(f.k.toUpperCase(), { x: cx, y: cy, size: 8, font: sans, color: C.muted });
      page.drawText(f.v || "—", { x: cx, y: cy - 15, size: 13, font: sansB, color: C.ink });
    });
    y -= boxH + 6;
  }

  paragraphs.slice(1).forEach(drawPara);

  await drawSignatureRow(doc, page, opts, edu, signLabel, signValue);
}

async function attendanceLetterPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const greeting = v.guardian ? `Dear ${v.guardian},` : "Dear Parent / Guardian,";
  const msg =
    v.message ||
    `This letter is to formally notify you regarding the school attendance of your child, ${v.student_name || "the student"}. We request your support in ensuring regular attendance going forward.`;
  await letterPDF(
    doc, opts, "Attendance Notice", greeting,
    [msg, "Please contact the school office if you have any questions or wish to discuss the matter further."],
    [
      { k: "Student", v: v.student_name },
      { k: "Class", v: v.class_name },
      { k: "Attendance", v: v.attendance_pct },
      { k: "Days absent", v: v.days_absent },
      { k: "Period", v: v.period },
    ],
    v.signatory ? "" : "School administration", v.signatory, v
  );
}

async function enrollmentLetterPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const status = v.status || "confirmed";
  await letterPDF(
    doc, opts, "Enrollment Confirmation", "To whom it may concern,",
    [
      `This is to certify that ${v.student_name || "the student"} is ${status} for enrollment at our institution for the academic year ${v.academic_year || "—"}.`,
      "This confirmation is issued upon request and may be used for official purposes.",
    ],
    [
      { k: "Student", v: v.student_name },
      { k: "Class / grade", v: v.class_name },
      { k: "Academic year", v: v.academic_year },
      { k: "Admission no.", v: v.admission_no },
      { k: "Status", v: status },
    ],
    "Authorised signatory", v.signatory, v
  );
}

async function permissionSlipPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const greeting = v.guardian ? `Dear ${v.guardian},` : "Dear Parent / Guardian,";
  await letterPDF(
    doc, opts, "Permission Slip", greeting,
    [
      `Your child ${v.student_name || "the student"} has been invited to take part in ${v.event || "a school activity"}. We are seeking your permission for them to attend.`,
      "Please sign below to give consent for your child to participate. Return this slip to the school office by the date indicated.",
    ],
    [
      { k: "Activity", v: v.event },
      { k: "Date", v: v.event_date },
      { k: "Location", v: v.location },
      { k: "Cost", v: v.cost },
    ],
    "Parent / guardian signature", "", v
  );
}

async function referenceLetterPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const who = v.role ? `${v.student_name || "the student"}, ${v.role}` : v.student_name || "the student";
  await letterPDF(
    doc, opts, "Reference Letter", "To whom it may concern,",
    [
      v.body ||
        `I am pleased to provide this reference for ${who}. Throughout the time I have known them, they have consistently demonstrated strong character, reliability, and ability. I recommend them without reservation and am confident they will be a valuable addition to any institution or programme.`,
      "Please do not hesitate to contact me should you require any further information.",
    ],
    [],
    v.position || "Authorised signatory", v.signatory, v
  );
}

export async function renderPDF(
  slug: string,
  v: FieldValues,
  opts: RenderOpts = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  switch (slug) {
    case "progress-report":
      await progressReportPDF(doc, v, opts);
      break;
    case "fee-receipt":
      await feeReceiptPDF(doc, v, opts);
      break;
    case "student-id-card":
      await idCardPDF(doc, v, opts);
      break;
    case "library-card":
      await libraryCardPDF(doc, v, opts);
      break;
    case "hall-pass":
      await hallPassPDF(doc, v, opts);
      break;
    case "permission-slip":
      await permissionSlipPDF(doc, v, opts);
      break;
    case "reference-letter":
      await referenceLetterPDF(doc, v, opts);
      break;
    case "attendance-letter":
      await attendanceLetterPDF(doc, v, opts);
      break;
    case "enrollment-confirmation":
      await enrollmentLetterPDF(doc, v, opts);
      break;
    default:
      await certificatePDF(doc, v, opts);
  }
  return doc.save();
}
