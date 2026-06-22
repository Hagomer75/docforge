// PDF rendering with pdf-lib. Pure JS with the standard 14 fonts embedded, so
// it runs in a Node serverless function with no binaries or font files on disk.
import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  rgb,
  RGB,
} from "pdf-lib";
import { Branding, FieldValues, RenderOpts } from "./templates";
import { Lang } from "./i18n";
import { embedDocFonts, shape } from "./arabic";
import { docLabels } from "./doclabels";
import { code128b } from "./code128";

// Set per render so the low-level draw/measure helpers can shape Arabic
// without threading the language through every call.
let curLang: Lang = "en";
const SH = (s: string) => shape(s, curLang);

// Make a page auto-shape every string it draws (Arabic joining + RTL order).
function patchDraw(page: PDFPage) {
  const orig = page.drawText.bind(page);
  (page as unknown as { drawText: PDFPage["drawText"] }).drawText = ((txt: string, o) =>
    orig(SH(String(txt)), o)) as PDFPage["drawText"];
}

function hex(h: string): RGB {
  const n = parseInt(h.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

// Paint an explicit white page background (pages are transparent by default,
// which renders wrong on coloured paper / dark viewers / when composited).
function whiteBg(page: PDFPage) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
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
  // Letter-spacing/upper-casing only makes sense for Latin.
  return curLang === "ar" ? text : text.toUpperCase().split("").join(" ");
}

function wrap(font: PDFFont, size: number, max: number, text: string): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(SH(test), size) > max && cur) {
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
  const w = font.widthOfTextAtSize(SH(text), size);
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
  const { serifB, sans } = await embedDocFonts(doc, opts.lang, opts.branding?.font);
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
    const w = sans.widthOfTextAtSize(SH(line), 11);
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
  const { sans, sansB } = await embedDocFonts(doc, opts.lang, opts.branding?.font);
  const D = docLabels(opts.lang ?? "en", opts.labels);
  const M = 48;
  const right = width - M;
  const sy = 96;

  const sig = await embedDataUrl(doc, opts.branding?.signatureDataUrl, 34, 150);
  if (sig) page.drawImage(sig.image, { x: M, y: sy + 4, width: sig.w, height: sig.h });
  page.drawLine({ start: { x: M, y: sy }, end: { x: M + 170, y: sy }, color: C.line, thickness: 1 });
  if (value) page.drawText(value, { x: M, y: sy - 14, size: 12, font: sansB, color: C.ink });
  if (label) page.drawText(label, { x: M, y: sy - 28, size: 10, font: sans, color: C.muted });

  page.drawLine({ start: { x: right - 170, y: sy }, end: { x: right, y: sy }, color: edu, thickness: 1 });
  page.drawText(D.officialStamp, { x: right - 170, y: sy - 14, size: 10, font: sans, color: C.muted });
}

async function certificatePDF(
  doc: PDFDocument,
  v: FieldValues,
  opts: RenderOpts
): Promise<void> {
  const page = doc.addPage([841.89, 595.28]); // A4 landscape
  patchDraw(page);
  whiteBg(page);
  const { width, height } = page.getSize();
  const edu = accentColor(opts.branding);
  const { serifB, serifI, sans, sansB } = await embedDocFonts(doc, opts.lang, opts.branding?.font);
  const D = docLabels(opts.lang ?? "en", opts.labels);
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
  const schoolW = school ? serifB.widthOfTextAtSize(SH(school), schoolSize) : 0;
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

  drawCentered(page, mid, 466, spaced(D.certKicker), sansB, 11, C.gold);
  drawCentered(page, mid, 424, v.award_title || D.awardDefault, serifB, 28, edu);
  drawCentered(page, mid, 388, D.presentedTo, sans, 12, C.muted);
  drawCentered(page, mid, 346, v.recipient_name || D.recipientName, serifB, 32, C.ink);
  page.drawLine({
    start: { x: width * 0.28, y: 336 }, end: { x: width * 0.72, y: 336 },
    color: C.line, thickness: 1.5,
  });

  const detail = wrap(serifI, 12, width * 0.66, v.detail);
  detail.forEach((ln, i) => drawCentered(page, mid, 306 - i * 17, ln, serifI, 12, C.muted));

  const cols: [number, string, string][] = [
    [width * 0.27, v.teacher, D.teacher],
    [width * 0.5, v.date, D.date],
    [width * 0.73, v.school, D.school],
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
  patchDraw(page);
  whiteBg(page);
  const { width, height } = page.getSize();
  const edu = accentColor(opts.branding);
  const { serifB, sans, sansB } = await embedDocFonts(doc, opts.lang, opts.branding?.font);
  const D = docLabels(opts.lang ?? "en", opts.labels);
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
  page.drawText(D.prTitle, { x: titleX, y, size: 22, font: serifB, color: edu });
  if (school) page.drawText(school, { x: titleX, y: y - 15, size: 11, font: sans, color: C.muted });

  const meta = [v.term, v.date].filter(Boolean);
  meta.forEach((mtxt, i) => {
    const w = sans.widthOfTextAtSize(SH(mtxt), 11);
    page.drawText(mtxt, { x: right - w, y: y + 4 - i * 14, size: 11, font: sans, color: C.muted });
  });
  y -= 22;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, color: edu, thickness: 2 });

  // Student / class
  y -= 40;
  page.drawText(D.student, { x: M, y: y + 18, size: 9, font: sans, color: C.muted });
  page.drawText(v.student_name || D.studentName, { x: M, y, size: 16, font: sansB, color: C.ink });
  page.drawText(D.klass, { x: width / 2, y: y + 18, size: 9, font: sans, color: C.muted });
  page.drawText(v.class_name || "—", { x: width / 2, y, size: 16, font: sansB, color: C.ink });

  // Marks table — rows come from the chosen subject columns.
  y -= 42;
  const rowH = 28;
  page.drawRectangle({ x: M, y: y - 6, width: right - M, height: 24, color: C.paper });
  page.drawText(D.subject, { x: M + 12, y, size: 10, font: sans, color: C.muted });
  page.drawText(D.mark, { x: right - 70, y, size: 10, font: sans, color: C.muted });
  y -= 8;

  const subjects = opts.subjects ?? [];
  const rows = subjects.length ? subjects : [{ label: "—", mark: "—" }];
  for (const s of rows) {
    page.drawLine({ start: { x: M, y }, end: { x: right, y }, color: C.line, thickness: 1 });
    y -= rowH;
    page.drawText(s.label, { x: M + 12, y: y + 8, size: 13, font: sans, color: C.ink });
    const mk = s.mark || "—";
    const mw = sansB.widthOfTextAtSize(SH(mk), 13);
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
  page.drawText(D.teacherComment, { x: M + 14, y, size: 9, font: sansB, color: C.gold });
  commentLines.forEach((ln, i) =>
    page.drawText(ln, { x: M + 14, y: y - 20 - i * 17, size: 12, font: sans, color: C.ink })
  );

  // Signature
  const sy = 80;
  const sig = await embedDataUrl(doc, opts.branding?.signatureDataUrl, 30, 150);
  if (sig) page.drawImage(sig.image, { x: M, y: sy + 4, width: sig.w, height: sig.h });
  page.drawLine({ start: { x: M, y: sy }, end: { x: M + 180, y: sy }, color: C.line, thickness: 1 });
  if (v.teacher) page.drawText(v.teacher, { x: M, y: sy + 6, size: 12, font: sansB, color: C.ink });
  page.drawText(D.teacher, { x: M, y: sy - 14, size: 10, font: sans, color: C.muted });
  page.drawLine({ start: { x: right - 180, y: sy }, end: { x: right, y: sy }, color: C.line, thickness: 1 });
  page.drawText(D.signature, { x: right - 180, y: sy - 14, size: 10, font: sans, color: C.muted });
}

/* ---------- fee receipt ---------- */

async function feeReceiptPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const page = doc.addPage([595.28, 841.89]);
  patchDraw(page);
  whiteBg(page);
  const { width } = page.getSize();
  const edu = accentColor(opts.branding);
  const { sans, sansB } = await embedDocFonts(doc, opts.lang, opts.branding?.font);
  const D = docLabels(opts.lang ?? "en", opts.labels);
  const M = 48;
  const right = width - M;

  let y = await drawDocHeader(doc, page, D.frTitle, opts, edu, [
    `${D.receipt}: ${v.receipt_no || "—"}`,
    v.date || "",
  ]);

  // received from / method
  y -= 34;
  page.drawText(D.receivedFrom, { x: M, y: y + 16, size: 9, font: sans, color: C.muted });
  page.drawText(v.student_name || D.studentName, { x: M, y, size: 15, font: sansB, color: C.ink });
  page.drawText(D.method, { x: width / 2, y: y + 16, size: 9, font: sans, color: C.muted });
  page.drawText(v.payment_method || "—", { x: width / 2, y, size: 15, font: sansB, color: C.ink });

  // line item table
  y -= 36;
  page.drawRectangle({ x: M, y: y - 6, width: right - M, height: 24, color: C.paper });
  page.drawText(D.description, { x: M + 12, y, size: 10, font: sans, color: C.muted });
  page.drawText(D.amount, { x: right - 90, y, size: 10, font: sans, color: C.muted });
  y -= 8;
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, color: C.line, thickness: 1 });
  y -= 30;
  page.drawText(v.fee_type || D.tuitionDefault, { x: M + 12, y: y + 9, size: 13, font: sans, color: C.ink });
  const amt = v.amount || "—";
  const aw = sansB.widthOfTextAtSize(SH(amt), 13);
  page.drawText(amt, { x: right - 12 - aw, y: y + 9, size: 13, font: sansB, color: C.ink });
  page.drawLine({ start: { x: M, y }, end: { x: right, y }, color: C.line, thickness: 1 });

  // totals
  const tx = right - 230;
  const totalRow = (yy: number, label: string, val: string, big = false) => {
    page.drawText(label, { x: tx, y: yy, size: big ? 13 : 11, font: big ? sansB : sans, color: big ? edu : C.muted });
    const f = big ? sansB : sans;
    const w = f.widthOfTextAtSize(SH(val), big ? 15 : 12);
    page.drawText(val, { x: right - w, y: yy, size: big ? 15 : 12, font: big ? sansB : sans, color: big ? edu : C.ink });
  };
  y -= 26;
  totalRow(y, D.total, v.amount || "—");
  y -= 18;
  totalRow(y, D.paid, v.amount_paid || v.amount || "—");
  y -= 8;
  page.drawLine({ start: { x: tx, y }, end: { x: right, y }, color: edu, thickness: 1.5 });
  y -= 20;
  totalRow(y, D.balance, v.balance || "0", true);

  // PAID pill
  y -= 30;
  page.drawRectangle({ x: M, y: y - 4, width: 58, height: 20, color: edu });
  page.drawText(D.paidPill, { x: M + 14, y: y + 1, size: 11, font: sansB, color: rgb(1, 1, 1) });

  await drawSignatureRow(doc, page, opts, edu, D.receivedBy, v.received_by);
}

/* ---------- cards (ID + library) ---------- */

type CardCfg = {
  tag: string;
  role: string;
  name: string;
  rows: { k: string; v: string }[];
  idValue: string;
};

// Real, scannable Code-128B barcode drawn to fit the given box width, with an
// 8-module quiet zone each side. `seed` is the payload (e.g. the id value).
function drawBarcode(
  page: ReturnType<PDFDocument["addPage"]>,
  x: number, y: number, w: number, h: number, seed: string,
): void {
  const pat = code128b(seed && seed.length ? seed : "00000000");
  const total = pat.reduce((a, b) => a + b, 0);
  const qz = 8;
  const mw = w / (total + qz * 2);
  let cx = x + qz * mw;
  let bar = true;
  for (const run of pat) {
    const ww = mw * run;
    if (bar) page.drawRectangle({ x: cx, y, width: ww, height: h, color: C.ink });
    cx += ww;
    bar = !bar;
  }
}

// Greedy word-wrap (pdf-lib has no auto-wrap). Returns lines fitting maxW at size.
function wrapText(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const trial = line ? line + " " + w : w;
    if (font.widthOfTextAtSize(SH(trial), size) > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Second CR80 face: terms, "if found return to", emergency contact, magstripe.
async function drawCardBack(doc: PDFDocument, cfg: CardCfg, opts: RenderOpts): Promise<void> {
  const portrait = opts.cardOrientation === "portrait";
  const W = portrait ? 227 : 360, H = portrait ? 360 : 227, M = 16;
  const page = doc.addPage([W, H]);
  patchDraw(page);
  whiteBg(page);
  const { sans, sansB } = await embedDocFonts(doc, opts.lang, opts.branding?.font);
  const D = docLabels(opts.lang ?? "en", opts.labels);

  // faux magnetic stripe near the top
  page.drawRectangle({ x: 0, y: H - 54, width: W, height: 30, color: C.ink });

  let y = H - 80;
  for (const line of wrapText(D.cardTerms, sans, 8, W - M * 2)) {
    page.drawText(line, { x: M, y, size: 8, font: sans, color: C.muted });
    y -= 12;
  }
  y -= 14;
  page.drawText(D.cardReturn.toUpperCase(), { x: M, y, size: 7, font: sans, color: C.muted });
  page.drawText(opts.branding?.schoolName?.trim() || D.schoolNamePh, { x: M, y: y - 14, size: 11, font: sansB, color: C.ink });
  y -= 40;
  page.drawText(D.cardEmergency.toUpperCase(), { x: M, y, size: 7, font: sans, color: C.muted });
  page.drawLine({ start: { x: M, y: y - 14 }, end: { x: W - M, y: y - 14 }, thickness: 0.75, color: C.line });
}

async function cardPDF(
  doc: PDFDocument,
  cfg: CardCfg,
  opts: RenderOpts
): Promise<void> {
  const portrait = opts.cardOrientation === "portrait";
  const W = portrait ? 227 : 360, H = portrait ? 360 : 227;
  const page = doc.addPage([W, H]);
  patchDraw(page);
  whiteBg(page);
  const edu = accentColor(opts.branding);
  const { serifB, sans, sansB } = await embedDocFonts(doc, opts.lang, opts.branding?.font);
  const D = docLabels(opts.lang ?? "en", opts.labels);
  const white = rgb(1, 1, 1);

  const headH = 44;
  const footH = 30;
  const M = 16;

  // header band: school name + tag, with a softer accent rule beneath
  page.drawRectangle({ x: 0, y: H - headH, width: W, height: headH, color: edu });
  page.drawRectangle({ x: 0, y: H - headH - 3, width: W, height: 3, color: edu, opacity: 0.55 });
  page.drawText(opts.branding?.schoolName?.trim() || D.schoolNamePh, {
    x: M, y: H - 27, size: 13, font: serifB, color: white,
  });
  const tw = sans.widthOfTextAtSize(SH(cfg.tag), 8);
  page.drawText(cfg.tag, { x: W - M - tw, y: H - 25, size: 8, font: sans, color: white });

  if (portrait) {
    // PORTRAIT (lanyard) layout: photo top-centre, stacked centred fields, QR, barcode.
    const cx = W / 2;
    const pfW = 86, pfH = 96, pfX = (W - pfW) / 2, pfTop = H - headH - 14;
    page.drawRectangle({ x: pfX - 2, y: pfTop - pfH - 2, width: pfW + 4, height: pfH + 4, color: edu });
    page.drawRectangle({ x: pfX, y: pfTop - pfH, width: pfW, height: pfH, color: C.paper });
    const pPhoto = await embedDataUrl(doc, opts.photoDataUrl, pfH, pfW);
    if (pPhoto) {
      page.drawImage(pPhoto.image, {
        x: pfX + (pfW - pPhoto.w) / 2,
        y: pfTop - pfH + (pfH - pPhoto.h) / 2,
        width: pPhoto.w, height: pPhoto.h,
      });
    }
    const nm = cfg.name || D.studentName;
    let py = pfTop - pfH - 18;
    page.drawText(nm, { x: cx - serifB.widthOfTextAtSize(SH(nm), 14) / 2, y: py, size: 14, font: serifB, color: C.ink });
    const ro = cfg.role.toUpperCase();
    py -= 13;
    page.drawText(ro, { x: cx - sans.widthOfTextAtSize(SH(ro), 7) / 2, y: py, size: 7, font: sans, color: C.muted });
    py -= 24;
    cfg.rows.forEach((r) => {
      const k = r.k.toUpperCase(), val = r.v || "—";
      page.drawText(k, { x: cx - sans.widthOfTextAtSize(SH(k), 7) / 2, y: py, size: 7, font: sans, color: C.muted });
      page.drawText(val, { x: cx - sansB.widthOfTextAtSize(SH(val), 11) / 2, y: py - 12, size: 11, font: sansB, color: C.ink });
      py -= 27;
    });
    // QR centred below the last field, clamped to sit above the footer.
    const pqr = 58, pqrX = cx - pqr / 2, pqrY = Math.max(footH + 10, py - pqr + 6);
    const pQr = await embedDataUrl(doc, opts.qrDataUrl, pqr, pqr);
    if (pQr) page.drawImage(pQr.image, { x: pqrX, y: pqrY, width: pQr.w, height: pQr.h });
    else page.drawRectangle({ x: pqrX, y: pqrY, width: pqr, height: pqr, borderColor: C.line, borderWidth: 1 });

    page.drawRectangle({ x: 0, y: 0, width: W, height: footH, color: C.paper });
    page.drawLine({ start: { x: 0, y: footH }, end: { x: W, y: footH }, thickness: 0.75, color: C.line });
    drawBarcode(page, M, 13, W - M * 2, 11, cfg.idValue);
    const pid = cfg.idValue || "";
    page.drawText(pid, { x: (W - sansB.widthOfTextAtSize(SH(pid), 8)) / 2, y: 3, size: 8, font: sansB, color: C.ink });
    if (opts.cardBack) await drawCardBack(doc, cfg, opts);
    return;
  }

  // photo (left) in an accent frame
  const fX = M, fW = 60, fH = 74, fTop = H - headH - 12;
  page.drawRectangle({ x: fX - 2, y: fTop - fH - 2, width: fW + 4, height: fH + 4, color: edu });
  page.drawRectangle({ x: fX, y: fTop - fH, width: fW, height: fH, color: C.paper });
  const photo = await embedDataUrl(doc, opts.photoDataUrl, fH, fW);
  if (photo) {
    page.drawImage(photo.image, {
      x: fX + (fW - photo.w) / 2,
      y: fTop - fH + (fH - photo.h) / 2,
      width: photo.w, height: photo.h,
    });
  }

  // info block
  const ix = fX + fW + 16;
  page.drawText(cfg.name || D.studentName, { x: ix, y: fTop - 12, size: 15, font: serifB, color: C.ink });
  page.drawText(cfg.role.toUpperCase(), { x: ix, y: fTop - 26, size: 7.5, font: sans, color: C.muted });

  // fields as a 2-up grid
  const colW = 96;
  const fy = fTop - 50;
  cfg.rows.forEach((r, i) => {
    const cxx = ix + (i % 2) * colW;
    const cyy = fy - Math.floor(i / 2) * 30;
    page.drawText(r.k.toUpperCase(), { x: cxx, y: cyy, size: 7, font: sans, color: C.muted });
    page.drawText(r.v || "—", { x: cxx, y: cyy - 12, size: 11.5, font: sansB, color: C.ink });
  });

  // signature line in the lower-left of the body
  const sigW = 150, sigBaseY = footH + 12;
  const sigImg = await embedDataUrl(doc, opts.branding?.signatureDataUrl, 22, sigW);
  if (sigImg) {
    page.drawImage(sigImg.image, { x: ix, y: sigBaseY + 4, width: sigImg.w, height: sigImg.h });
  }
  page.drawLine({
    start: { x: ix, y: sigBaseY }, end: { x: ix + sigW, y: sigBaseY },
    thickness: 0.75, color: C.line,
  });
  page.drawText(D.signature.toUpperCase(), { x: ix, y: sigBaseY - 9, size: 6.5, font: sans, color: C.muted });

  // QR (top-right, aligned with the info block)
  const qrS = 58;
  const qrX = W - M - qrS;
  const qrY = fTop - qrS;
  const qr = await embedDataUrl(doc, opts.qrDataUrl, qrS, qrS);
  if (qr) {
    page.drawImage(qr.image, { x: qrX, y: qrY, width: qr.w, height: qr.h });
  } else {
    page.drawRectangle({ x: qrX, y: qrY, width: qrS, height: qrS, borderColor: C.line, borderWidth: 1 });
  }

  // footer: full-width barcode + id number
  page.drawRectangle({ x: 0, y: 0, width: W, height: footH, color: C.paper });
  page.drawLine({ start: { x: 0, y: footH }, end: { x: W, y: footH }, thickness: 0.75, color: C.line });
  drawBarcode(page, M, 13, W - M * 2, 11, cfg.idValue);
  const idTxt = cfg.idValue || "";
  const idw = sansB.widthOfTextAtSize(SH(idTxt), 8);
  page.drawText(idTxt, { x: (W - idw) / 2, y: 3, size: 8, font: sansB, color: C.ink });

  if (opts.cardBack) await drawCardBack(doc, cfg, opts);
}

async function idCardPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const D = docLabels(opts.lang ?? "en", opts.labels);
  await cardPDF(doc, {
    tag: D.idTag, role: D.idRole, name: v.full_name,
    rows: [{ k: D.klass, v: v.class_name }, { k: D.validUntil, v: v.valid_until }],
    idValue: v.student_id || "ID-000",
  }, opts);
}

async function libraryCardPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const D = docLabels(opts.lang ?? "en", opts.labels);
  await cardPDF(doc, {
    tag: D.libTag, role: D.libRole, name: v.full_name,
    rows: [{ k: D.klass, v: v.class_name }, { k: D.expires, v: v.expiry }],
    idValue: v.member_id || "MEM-000",
  }, opts);
}

async function hallPassPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const W = 400, H = 215;
  const page = doc.addPage([W, H]);
  patchDraw(page);
  whiteBg(page);
  const edu = accentColor(opts.branding);
  const { serifB, sans, sansB } = await embedDocFonts(doc, opts.lang, opts.branding?.font);
  const D = docLabels(opts.lang ?? "en", opts.labels);
  const white = rgb(1, 1, 1);
  const headH = 44, footH = 30, M = 22;
  const passId = `${v.date || ""}${v.time_out ? " " + v.time_out : ""}`.trim();

  // header band + soft accent rule (matches cardPDF)
  page.drawRectangle({ x: 0, y: H - headH, width: W, height: headH, color: edu });
  page.drawRectangle({ x: 0, y: H - headH - 3, width: W, height: 3, color: edu, opacity: 0.55 });
  page.drawText(opts.branding?.schoolName?.trim() || D.schoolNamePh, { x: M, y: H - 27, size: 13, font: serifB, color: white });
  const tw = sans.widthOfTextAtSize(SH(D.corridorPass), 8);
  page.drawText(D.corridorPass, { x: W - M - tw, y: H - 25, size: 8, font: sans, color: white });

  // body
  let y = H - headH - 24;
  page.drawText(D.hallPass, { x: M, y, size: 22, font: serifB, color: C.ink });
  y -= 18;
  page.drawText(D.permissionFor, { x: M, y, size: 9, font: sans, color: C.muted });
  y -= 16;
  page.drawText(v.student_name || D.studentName, { x: M, y, size: 17, font: serifB, color: C.ink });

  const cells: [string, string][] = [
    [D.destination, v.destination],
    [D.timeOut, v.time_out],
    [D.date, v.date],
    [D.issuedBy, v.teacher],
  ];
  const cw = (W - M * 2) / 4;
  const gy = footH + 26;
  cells.forEach(([k, val], i) => {
    const cx = M + i * cw;
    page.drawText(k.toUpperCase(), { x: cx, y: gy, size: 8, font: sans, color: C.muted });
    page.drawText(val || "—", { x: cx, y: gy - 14, size: 13, font: sansB, color: C.ink });
  });

  // footer: paper band + divider + optional barcode/id
  page.drawRectangle({ x: 0, y: 0, width: W, height: footH, color: C.paper });
  page.drawLine({ start: { x: 0, y: footH }, end: { x: W, y: footH }, thickness: 0.75, color: C.line });
  if (passId) {
    drawBarcode(page, M, 13, W - M * 2, 11, passId);
    const idw = sansB.widthOfTextAtSize(SH(passId), 8);
    page.drawText(passId, { x: (W - idw) / 2, y: 3, size: 8, font: sansB, color: C.ink });
  }
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
  patchDraw(page);
  whiteBg(page);
  const { width } = page.getSize();
  const edu = accentColor(opts.branding);
  const { sans, sansB } = await embedDocFonts(doc, opts.lang, opts.branding?.font);
  const M = 48;
  const right = width - M;
  const textW = right - M;
  const rtl = opts.lang === "ar";
  // Right-align body text for Arabic.
  const lineX = (text: string, font: PDFFont, size: number) =>
    rtl ? right - font.widthOfTextAtSize(SH(text), size) : M;

  let y = await drawDocHeader(doc, page, title, opts, edu, [v.date || ""]);
  y -= 30;
  page.drawText(greeting, { x: lineX(greeting, sansB, 13), y, size: 13, font: sansB, color: C.ink });
  y -= 24;

  const drawPara = (text: string) => {
    for (const ln of wrap(sans, 12, textW, text)) {
      page.drawText(ln, { x: lineX(ln, sans, 12), y, size: 12, font: sans, color: C.ink });
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
  const D = docLabels(opts.lang ?? "en", opts.labels);
  const greeting = v.guardian ? D.dearName(v.guardian) : D.dearGuardian;
  const msg = v.message || D.attMsg(v.student_name || D.theStudent);
  await letterPDF(
    doc, opts, D.attTitle, greeting,
    [msg, D.attClose],
    [
      { k: D.student, v: v.student_name },
      { k: D.klass, v: v.class_name },
      { k: D.attendance, v: v.attendance_pct },
      { k: D.daysAbsent, v: v.days_absent },
      { k: D.period, v: v.period },
    ],
    v.signatory ? "" : D.schoolAdmin, v.signatory, v
  );
}

async function enrollmentLetterPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const D = docLabels(opts.lang ?? "en", opts.labels);
  const status = v.status || D.confirmedDefault;
  await letterPDF(
    doc, opts, D.enrTitle, D.toWhom,
    [D.enrBody(v.student_name || D.theStudent, status, v.academic_year || "—"), D.enrClose],
    [
      { k: D.student, v: v.student_name },
      { k: D.classGrade, v: v.class_name },
      { k: D.academicYear, v: v.academic_year },
      { k: D.admissionNo, v: v.admission_no },
      { k: D.statusLbl, v: status },
    ],
    D.authSignatory, v.signatory, v
  );
}

async function permissionSlipPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const D = docLabels(opts.lang ?? "en", opts.labels);
  const greeting = v.guardian ? D.dearName(v.guardian) : D.dearGuardian;
  await letterPDF(
    doc, opts, D.permTitle, greeting,
    [D.permBody(v.student_name || D.theStudent, v.event || D.activityDefault), D.permClose],
    [
      { k: D.activity, v: v.event },
      { k: D.date, v: v.event_date },
      { k: D.location, v: v.location },
      { k: D.cost, v: v.cost },
    ],
    D.parentSig, "", v
  );
}

async function referenceLetterPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const D = docLabels(opts.lang ?? "en", opts.labels);
  const who = v.role ? `${v.student_name || D.theStudent}, ${v.role}` : v.student_name || D.theStudent;
  await letterPDF(
    doc, opts, D.refTitle, D.toWhom,
    [v.body || D.refBody(who), D.refClose],
    [],
    v.position || D.authSignatory, v.signatory, v
  );
}

async function transferCertPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const D = docLabels(opts.lang ?? "en", opts.labels);
  await letterPDF(
    doc, opts, D.tcTitle, D.toWhom,
    [D.tcBody(v.student_name || D.theStudent, v.class_name || "—", v.date_leaving || "—"), D.tcClose],
    [
      { k: D.student, v: v.student_name },
      { k: D.admissionNo, v: v.admission_no },
      { k: D.dob, v: v.dob },
      { k: D.klass, v: v.class_name },
      { k: D.dateLeaving, v: v.date_leaving },
      { k: D.reason, v: v.reason },
      { k: D.conduct, v: v.conduct },
    ],
    D.authSignatory, v.signatory, v
  );
}

async function bonafideCertPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const D = docLabels(opts.lang ?? "en", opts.labels);
  await letterPDF(
    doc, opts, D.bfTitle, D.toWhom,
    [
      D.bfBody(v.student_name || D.theStudent, v.class_name || "—", v.academic_year || "—"),
      D.bfPurpose(v.purpose || D.purposeDefault),
      D.bfClose,
    ],
    [
      { k: D.student, v: v.student_name },
      { k: D.klass, v: v.class_name },
      { k: D.academicYear, v: v.academic_year },
      { k: D.dob, v: v.dob },
    ],
    D.authSignatory, v.signatory, v
  );
}

async function characterCertPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const D = docLabels(opts.lang ?? "en", opts.labels);
  await letterPDF(
    doc, opts, D.ccTitle, D.toWhom,
    [D.ccBody(v.student_name || D.theStudent, v.class_name || "—", v.conduct || D.conductDefault), D.ccClose],
    [
      { k: D.student, v: v.student_name },
      { k: D.klass, v: v.class_name },
      { k: D.period, v: v.period },
      { k: D.conduct, v: v.conduct || D.conductDefault },
    ],
    D.authSignatory, v.signatory, v
  );
}

// Decorative landscape completion / graduation certificate (mirrors certificatePDF).
async function completionCertPDF(doc: PDFDocument, v: FieldValues, opts: RenderOpts): Promise<void> {
  const page = doc.addPage([841.89, 595.28]);
  patchDraw(page);
  whiteBg(page);
  const { width, height } = page.getSize();
  const edu = accentColor(opts.branding);
  const { serifB, sans, sansB } = await embedDocFonts(doc, opts.lang, opts.branding?.font);
  const D = docLabels(opts.lang ?? "en", opts.labels);
  const mid = width / 2;

  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: edu, borderWidth: 3 });
  page.drawRectangle({ x: 34, y: 34, width: width - 68, height: height - 68, borderColor: C.gold, borderWidth: 1 });

  const logo = await embedLogo(doc, opts.branding, 40, 150);
  const school = opts.branding?.schoolName?.trim();
  const pos = opts.branding?.logoPos ?? "center";
  const gap = 12, schoolSize = 14, bandY = 516;
  const schoolW = school ? serifB.widthOfTextAtSize(SH(school), schoolSize) : 0;
  const logoW = logo ? logo.w : 0;
  const totalW = logoW + (logo && school ? gap : 0) + schoolW;
  let startX = mid - totalW / 2;
  if (pos === "left") startX = 60;
  else if (pos === "right") startX = width - 60 - totalW;
  if (logo) page.drawImage(logo.image, { x: startX, y: bandY - logo.h / 2, width: logo.w, height: logo.h });
  if (school) page.drawText(school, { x: startX + logoW + (logo ? gap : 0), y: bandY - schoolSize / 2 + 1, size: schoolSize, font: serifB, color: edu });

  drawCentered(page, mid, 466, spaced(D.complKicker), sansB, 13, C.gold);
  drawCentered(page, mid, 428, D.complCertify, sans, 12, C.muted);
  drawCentered(page, mid, 386, v.student_name || D.studentName, serifB, 32, C.ink);
  page.drawLine({ start: { x: width * 0.28, y: 376 }, end: { x: width * 0.72, y: 376 }, color: C.line, thickness: 1.5 });

  const body = wrap(sans, 14, width * 0.7, D.complBody(v.program || D.programDefault, v.academic_year || "—"));
  body.forEach((ln, i) => drawCentered(page, mid, 344 - i * 19, ln, sans, 14, C.ink));
  if (v.result) drawCentered(page, mid, 344 - body.length * 19 - 8, `${D.result}: ${v.result}`, sansB, 13, edu);

  const cols: [number, string, string][] = [
    [width * 0.27, v.signatory, D.authSignatory],
    [width * 0.5, v.completion_date, D.completionDate],
    [width * 0.73, v.school, D.school],
  ];
  for (const [cx, value, label] of cols) {
    if (value) drawCentered(page, cx, 104, value, sansB, 12, C.ink);
    page.drawLine({ start: { x: cx - 70, y: 96 }, end: { x: cx + 70, y: 96 }, color: C.line, thickness: 1 });
    drawCentered(page, cx, 82, label, sans, 10, C.muted);
  }
}

/* ---------- card sheets (tile many cards per A4 page) ---------- */

const A4 = { w: 595.28, h: 841.89 };

type Layout = {
  cols: number; rows: number; cw: number; ch: number;
  gapX: number; gapY: number; marginX: number; marginY: number; scale: number;
};

// Tiling layout for a card slug at N-up. Card native sizes: id/library 360x227,
// hall-pass 400x200.
function sheetLayout(slug: string, n: number, portrait = false): Layout {
  const isHall = slug === "hall-pass";
  const baseW = isHall ? 400 : portrait ? 227 : 360;
  const baseH = isHall ? 215 : portrait ? 360 : 227;
  if (portrait && !isHall && n > 1) {
    // Tall cards: pick a grid then scale by BOTH width and height so nothing
    // overflows A4. 10-up uses 3x4 (12 slots, fits 10).
    const grid = n === 10 ? { cols: 3, rows: 4 } : n === 4 ? { cols: 2, rows: 2 } : { cols: 2, rows: 1 };
    const { cols, rows } = grid;
    const gapX = 16, gapY = 14, marginMin = 32;
    const availW = A4.w - 2 * marginMin - (cols - 1) * gapX;
    const availH = A4.h - 2 * marginMin - (rows - 1) * gapY;
    const scale = Math.min(availW / cols / baseW, availH / rows / baseH, 1);
    const cw = baseW * scale, ch = baseH * scale;
    const marginX = (A4.w - (cols * cw + (cols - 1) * gapX)) / 2;
    const marginY = (A4.h - (rows * ch + (rows - 1) * gapY)) / 2;
    return { cols, rows, cw, ch, gapX, gapY, marginX, marginY, scale };
  }
  if (n === 10 && !isHall) {
    const cols = 2, rows = 5, gapX = 18, gapY = 14, marginX = 40, marginY = 40;
    const cw = (A4.w - 2 * marginX - gapX) / cols;
    const scale = cw / baseW;
    return { cols, rows, cw, ch: baseH * scale, gapX, gapY, marginX, marginY, scale };
  }
  if (n === 4) {
    const gapY = isHall ? 14 : 16, marginY = isHall ? 36 : 40;
    return { cols: 1, rows: 4, cw: baseW, ch: baseH, gapX: 0, gapY, marginX: (A4.w - baseW) / 2, marginY, scale: 1 };
  }
  if (n === 2) {
    const gapY = isHall ? 24 : 30, marginY = isHall ? 80 : 90;
    return { cols: 1, rows: 2, cw: baseW, ch: baseH, gapX: 0, gapY, marginX: (A4.w - baseW) / 2, marginY, scale: 1 };
  }
  // 1-up centred
  return { cols: 1, rows: 1, cw: baseW, ch: baseH, gapX: 0, gapY: 0, marginX: (A4.w - baseW) / 2, marginY: (A4.h - baseH) / 2, scale: 1 };
}

// L-shaped crop marks just outside each tile corner.
function cutGuideMarks(page: PDFPage, x: number, y: number, w: number, h: number) {
  const t = 8, g = 3, o = { color: C.line, thickness: 0.5 };
  const corner = (cx: number, cy: number, dx: number, dy: number) => {
    page.drawLine({ start: { x: cx + dx * g, y: cy }, end: { x: cx + dx * (g + t), y: cy }, ...o });
    page.drawLine({ start: { x: cx, y: cy + dy * g }, end: { x: cx, y: cy + dy * (g + t) }, ...o });
  };
  corner(x, y, -1, -1);
  corner(x + w, y, 1, -1);
  corner(x, y + h, -1, 1);
  corner(x + w, y + h, 1, 1);
}

export type SheetRow = { v: FieldValues; qrDataUrl?: string; photoDataUrl?: string };

// Render many cards tiled onto shared A4 pages — one combined multi-page PDF.
// Reuses renderPDF per card (pixel parity, Arabic + font style for free).
export async function renderCardSheet(
  slug: string,
  rows: SheetRow[],
  opts: RenderOpts = {}
): Promise<Uint8Array> {
  curLang = opts.lang === "ar" ? "ar" : "en";
  const out = await PDFDocument.create();
  const L = sheetLayout(slug, opts.cardsPerPage ?? 1, opts.cardOrientation === "portrait" && slug !== "hall-pass");
  const perPage = L.cols * L.rows;
  let page = out.addPage([A4.w, A4.h]);
  whiteBg(page);
  for (let i = 0; i < rows.length; i++) {
    const slot = i % perPage;
    if (i > 0 && slot === 0) { page = out.addPage([A4.w, A4.h]); whiteBg(page); }
    const col = slot % L.cols;
    const row = Math.floor(slot / L.cols);
    const ox = L.marginX + col * (L.cw + L.gapX);
    const oy = A4.h - L.marginY - L.ch - row * (L.ch + L.gapY);
    const cardBytes = await renderPDF(slug, rows[i].v, {
      ...opts,
      cardsPerPage: 1,
      cardBack: false, // sheets are front-only; backs are for single-card duplex
      qrDataUrl: rows[i].qrDataUrl,
      photoDataUrl: rows[i].photoDataUrl,
    });
    const src = await PDFDocument.load(cardBytes);
    const [embedded] = await out.embedPdf(src, [0]);
    page.drawPage(embedded, { x: ox, y: oy, xScale: L.scale, yScale: L.scale });
    if (opts.cutGuides !== false) cutGuideMarks(page, ox, oy, L.cw, L.ch);
  }
  return out.save();
}

export async function renderPDF(
  slug: string,
  v: FieldValues,
  opts: RenderOpts = {}
): Promise<Uint8Array> {
  curLang = opts.lang === "ar" ? "ar" : "en";
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
    case "completion-certificate":
      await completionCertPDF(doc, v, opts);
      break;
    case "transfer-certificate":
      await transferCertPDF(doc, v, opts);
      break;
    case "bonafide-certificate":
      await bonafideCertPDF(doc, v, opts);
      break;
    case "character-certificate":
      await characterCertPDF(doc, v, opts);
      break;
    default:
      await certificatePDF(doc, v, opts);
  }
  return doc.save();
}
