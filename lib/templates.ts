// Template definitions: field schema + HTML rendering used for the live
// preview. PDF rendering for the same templates lives in ./pdf.ts and shares
// the same field keys + render options so one mapping drives both.
import { docLabels } from "./doclabels";

export type Field = {
  key: string;
  label: string;
  required: boolean;
};

export type Template = {
  slug: string;
  name: string;
  description: string;
  fields: Field[];
  subjects?: boolean; // report-card style: pick columns to render as mark rows
  qrField?: string; // field key whose value is encoded as a QR code
  photoField?: string; // field key holding an image URL to embed (ID cards)
  group?: string; // UI grouping label
};

export const TEMPLATES: Template[] = [
  {
    slug: "certificate-classic",
    name: "Classic certificate",
    description: "Award certificate, A4 landscape",
    group: "Certificates",
    fields: [
      { key: "recipient_name", label: "Recipient name", required: true },
      { key: "award_title", label: "Award", required: true },
      { key: "detail", label: "Detail / citation", required: false },
      { key: "teacher", label: "Teacher", required: false },
      { key: "date", label: "Date", required: false },
      { key: "school", label: "School", required: false },
    ],
  },
  {
    slug: "progress-report",
    name: "Progress report",
    description: "Per-subject marks + comment, A4 portrait",
    group: "Reports",
    subjects: true,
    fields: [
      { key: "student_name", label: "Student name", required: true },
      { key: "class_name", label: "Class", required: false },
      { key: "term", label: "Term", required: false },
      { key: "comment", label: "Teacher comment", required: false },
      { key: "teacher", label: "Teacher", required: false },
      { key: "date", label: "Date", required: false },
    ],
  },
  {
    slug: "fee-receipt",
    name: "Fee receipt",
    description: "Payment receipt, A4 portrait",
    group: "Finance",
    fields: [
      { key: "student_name", label: "Student name", required: true },
      { key: "receipt_no", label: "Receipt no.", required: false },
      { key: "fee_type", label: "Fee type", required: false },
      { key: "amount", label: "Amount", required: true },
      { key: "amount_paid", label: "Amount paid", required: false },
      { key: "balance", label: "Balance", required: false },
      { key: "payment_method", label: "Payment method", required: false },
      { key: "date", label: "Date", required: false },
      { key: "received_by", label: "Received by", required: false },
    ],
  },
  {
    slug: "student-id-card",
    name: "Student ID card",
    description: "ID card with photo + QR, CR80",
    group: "Cards",
    qrField: "student_id",
    photoField: "photo_url",
    fields: [
      { key: "full_name", label: "Full name", required: true },
      { key: "student_id", label: "Student ID", required: true },
      { key: "class_name", label: "Class", required: false },
      { key: "valid_until", label: "Valid until", required: false },
      { key: "photo_url", label: "Photo URL", required: false },
    ],
  },
  {
    slug: "attendance-letter",
    name: "Attendance letter",
    description: "Attendance notice, A4 portrait",
    group: "Letters",
    fields: [
      { key: "student_name", label: "Student name", required: true },
      { key: "class_name", label: "Class", required: false },
      { key: "attendance_pct", label: "Attendance %", required: false },
      { key: "days_absent", label: "Days absent", required: false },
      { key: "period", label: "Period", required: false },
      { key: "guardian", label: "Guardian name", required: false },
      { key: "message", label: "Message", required: false },
      { key: "signatory", label: "Signed by", required: false },
      { key: "date", label: "Date", required: false },
    ],
  },
  {
    slug: "enrollment-confirmation",
    name: "Enrollment confirmation",
    description: "Admission confirmation, A4 portrait",
    group: "Letters",
    fields: [
      { key: "student_name", label: "Student name", required: true },
      { key: "class_name", label: "Class / grade", required: false },
      { key: "academic_year", label: "Academic year", required: false },
      { key: "status", label: "Status", required: false },
      { key: "admission_no", label: "Admission no.", required: false },
      { key: "signatory", label: "Signed by", required: false },
      { key: "date", label: "Date", required: false },
    ],
  },
  {
    slug: "library-card",
    name: "Library card",
    description: "Library card with photo + QR, CR80",
    group: "Cards",
    qrField: "member_id",
    photoField: "photo_url",
    fields: [
      { key: "full_name", label: "Full name", required: true },
      { key: "member_id", label: "Member ID", required: true },
      { key: "class_name", label: "Class", required: false },
      { key: "expiry", label: "Expires", required: false },
      { key: "photo_url", label: "Photo URL", required: false },
    ],
  },
  {
    slug: "hall-pass",
    name: "Hall pass",
    description: "Corridor pass, landscape card",
    group: "Cards",
    fields: [
      { key: "student_name", label: "Student name", required: true },
      { key: "destination", label: "Destination", required: true },
      { key: "time_out", label: "Time out", required: false },
      { key: "date", label: "Date", required: false },
      { key: "teacher", label: "Issued by", required: false },
    ],
  },
  {
    slug: "permission-slip",
    name: "Permission slip",
    description: "Consent letter, A4 portrait",
    group: "Letters",
    fields: [
      { key: "student_name", label: "Student name", required: true },
      { key: "event", label: "Event / activity", required: true },
      { key: "event_date", label: "Event date", required: false },
      { key: "location", label: "Location", required: false },
      { key: "cost", label: "Cost", required: false },
      { key: "guardian", label: "Guardian name", required: false },
      { key: "signatory", label: "Issued by", required: false },
      { key: "date", label: "Date", required: false },
    ],
  },
  {
    slug: "reference-letter",
    name: "Reference letter",
    description: "Recommendation letter, A4 portrait",
    group: "Letters",
    fields: [
      { key: "student_name", label: "Student name", required: true },
      { key: "role", label: "Role / relationship", required: false },
      { key: "body", label: "Letter body", required: false },
      { key: "signatory", label: "Signed by", required: false },
      { key: "position", label: "Position / title", required: false },
      { key: "date", label: "Date", required: false },
    ],
  },
];

export function getTemplate(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

export type FieldValues = Record<string, string>;
export type Subject = { label: string; mark: string };
export type LogoPos = "left" | "center" | "right";
export type DocFont = "classic" | "modern" | "typewriter";
export const DEFAULT_FONT: DocFont = "classic";
export type Branding = {
  schoolName?: string;
  accent?: string; // hex, e.g. "#2F6F6A"
  logoDataUrl?: string; // data:image/...;base64,...
  logoPos?: LogoPos; // header alignment on the certificate
  signatureDataUrl?: string; // signature image for documents with a sign line
  font?: DocFont; // document typography style (Latin only; Arabic stays Amiri)
};
export type RenderOpts = {
  subjects?: Subject[];
  branding?: Branding;
  qrDataUrl?: string; // server-generated QR for templates with qrField
  photoDataUrl?: string; // server-fetched photo for templates with photoField
  lang?: "en" | "ar"; // document language (drives labels + Arabic shaping)
  cardsPerPage?: 1 | 2 | 4 | 10; // card-sheet tiling (cards only)
  cutGuides?: boolean; // draw corner cut marks on card sheets
};

// Map each font style to display/body CSS families for the HTML preview.
// Classic keeps today's look (Fraunces + Inter).
const FONT_CSS: Record<DocFont, { display: string; body: string }> = {
  classic: { display: "'Fraunces',serif", body: "'Inter',sans-serif" },
  modern: { display: "'Inter',sans-serif", body: "'Inter',sans-serif" },
  typewriter: { display: "'Courier New',monospace", body: "'Courier New',monospace" },
};
function fontVars(opts: RenderOpts): string {
  const f = FONT_CSS[opts.branding?.font ?? "classic"];
  return `:root{--f-display:${f.display};--f-body:${f.body}}`;
}

export function resolveValues(
  template: Template,
  mapping: Record<string, string>,
  row: Record<string, unknown>
): FieldValues {
  const values: FieldValues = {};
  for (const field of template.fields) {
    const column = mapping[field.key];
    const raw = column ? row[column] : undefined;
    values[field.key] = raw == null ? "" : String(raw).trim();
  }
  return values;
}

export function resolveSubjects(
  subjectColumns: string[],
  row: Record<string, unknown>
): Subject[] {
  return (subjectColumns ?? []).map((col) => {
    const raw = row[col];
    return { label: col, mark: raw == null ? "" : String(raw).trim() };
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const DEFAULTS = {
  ink: "#1C2A39",
  paper: "#FBFAF7",
  edu: "#2F6F6A",
  gold: "#C8923A",
  line: "#E7E3DB",
  muted: "#6B7785",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&family=Cairo:wght@400;600;700&display=swap');`;

// Per-document direction + Arabic font override, injected into <head>.
function dirAttrs(opts: RenderOpts): string {
  return opts.lang === "ar" ? ` dir="rtl" lang="ar"` : "";
}
function arFont(opts: RenderOpts): string {
  return opts.lang === "ar"
    ? `*{font-family:'Cairo',sans-serif !important}`
    : "";
}

function accentOf(branding?: Branding): string {
  const a = branding?.accent;
  return a && /^#[0-9a-fA-F]{6}$/.test(a) ? a : DEFAULTS.edu;
}

function logoTag(branding: Branding | undefined, maxH: number): string {
  if (!branding?.logoDataUrl) return "";
  return `<img src="${branding.logoDataUrl}" style="max-height:${maxH}px;max-width:200px;object-fit:contain" alt="logo">`;
}

function sigTag(branding: Branding | undefined, maxH: number): string {
  if (!branding?.signatureDataUrl) return "";
  return `<img src="${branding.signatureDataUrl}" style="max-height:${maxH}px;max-width:170px;object-fit:contain;display:block;margin-bottom:2px" alt="signature">`;
}

// Shared <head> styles every A4 document reuses.
function docHead(edu: string, opts: RenderOpts): string {
  return `<style>
${FONTS}
${arFont(opts)}
${fontVars(opts)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--f-body);color:${DEFAULTS.ink};background:#fff;padding:34px 40px}
.bhead{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid ${edu};padding-bottom:12px}
.bhead .l{display:flex;align-items:center;gap:12px}
.bhead h1{font-family:var(--f-display);font-weight:700;font-size:22px;color:${edu}}
.bhead .sn{font-size:12px;color:${DEFAULTS.muted}}
.bhead .meta{text-align:right;font-size:12px;color:${DEFAULTS.muted}}
.sign{margin-top:40px;display:flex;justify-content:space-between;font-size:12px;color:${DEFAULTS.muted}}
.sign .blk b{display:block;color:${DEFAULTS.ink};border-top:1px solid ${DEFAULTS.line};padding-top:5px;min-width:160px}
.muted{color:${DEFAULTS.muted}}
</style>`;
}

function bhead(title: string, edu: string, opts: RenderOpts, metaHtml: string): string {
  const school = opts.branding?.schoolName?.trim();
  return `<div class="bhead">
  <div class="l">${logoTag(opts.branding, 40)}<div><h1>${esc(title)}</h1>${school ? `<div class="sn">${esc(school)}</div>` : ""}</div></div>
  <div class="meta">${metaHtml}</div>
</div>`;
}

function signBlock(label: string, value: string, opts: RenderOpts, edu: string): string {
  const D = docLabels(opts.lang ?? "en");
  return `<div class="sign">
  <span class="blk">${sigTag(opts.branding, 38)}<b>${esc(value) || "&nbsp;"}</b>${esc(label)}</span>
  <span class="blk"><b style="border-color:${edu}">&nbsp;</b>${esc(D.officialStamp)}</span>
</div>`;
}

/* ---------- certificate ---------- */

function certificateHTML(v: FieldValues, opts: RenderOpts): string {
  const edu = accentOf(opts.branding);
  const school = opts.branding?.schoolName?.trim();
  const logo = logoTag(opts.branding, 48);
  const pos = opts.branding?.logoPos ?? "center";
  const justify = pos === "left" ? "flex-start" : pos === "right" ? "flex-end" : "center";
  const hasHeader = !!(logo || school);
  const D = docLabels(opts.lang ?? "en");
  return `<!doctype html><html${dirAttrs(opts)}><head><meta charset="utf-8"><style>
${FONTS}
${arFont(opts)}
${fontVars(opts)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{font-family:var(--f-body);color:${DEFAULTS.ink};background:#fff;display:flex;align-items:center;justify-content:center;padding:18px}
.cert{width:100%;max-width:760px;aspect-ratio:1.414/1;border:3px solid ${edu};padding:10px}
.inner{height:100%;border:1px solid ${DEFAULTS.gold};padding:4.5% 8% 6%;display:flex;flex-direction:column;align-items:center;text-align:center}
.head{height:62px;width:100%;display:flex;align-items:center;gap:12px;justify-content:${justify};flex-shrink:0;margin-bottom:10px}
.head img{max-height:48px;max-width:190px;object-fit:contain;display:block}
.head .sn{font-family:var(--f-display);font-weight:600;font-size:15px;color:${edu};letter-spacing:.02em;white-space:nowrap}
.kicker{font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:${DEFAULTS.gold};font-weight:600}
.title{font-family:var(--f-display);font-weight:700;font-size:27px;color:${edu};margin:6px 0 14px;line-height:1.12}
.intro{font-size:13px;color:${DEFAULTS.muted};letter-spacing:.04em}
.name{font-family:var(--f-display);font-weight:600;font-size:31px;margin:8px 0;border-bottom:2px solid ${DEFAULTS.line};padding-bottom:8px;min-width:60%}
.detail{font-size:13px;color:${DEFAULTS.muted};font-style:italic;margin-top:6px;max-width:80%}
.foot{margin-top:auto;display:flex;justify-content:space-between;width:100%;padding-top:20px;font-size:12px;color:${DEFAULTS.muted}}
.foot b{display:block;color:${DEFAULTS.ink};font-weight:600;border-top:1px solid ${DEFAULTS.line};padding-top:5px;min-width:120px}
</style></head><body>
<div class="cert"><div class="inner">
  ${hasHeader ? `<div class="head">${logo}${school ? `<span class="sn">${esc(school)}</span>` : ""}</div>` : `<div class="head" style="height:24px"></div>`}
  <div class="kicker">${esc(D.certKicker)}</div>
  <div class="title">${esc(v.award_title) || esc(D.awardDefault)}</div>
  <div class="intro">${esc(D.presentedTo)}</div>
  <div class="name">${esc(v.recipient_name) || esc(D.recipientName)}</div>
  ${v.detail ? `<div class="detail">${esc(v.detail)}</div>` : ""}
  <div class="foot">
    <span><b>${esc(v.teacher) || "&nbsp;"}</b>${esc(D.teacher)}</span>
    <span><b>${esc(v.date) || "&nbsp;"}</b>${esc(D.date)}</span>
    <span><b>${esc(v.school) || "&nbsp;"}</b>${esc(D.school)}</span>
  </div>
</div></div>
</body></html>`;
}

/* ---------- progress report ---------- */

function progressReportHTML(v: FieldValues, opts: RenderOpts): string {
  const edu = accentOf(opts.branding);
  const D = docLabels(opts.lang ?? "en");
  const subjects = opts.subjects ?? [];
  const rowsHtml =
    subjects.length === 0
      ? `<tr><td colspan="2" class="muted">${esc(D.noSubjects)}</td></tr>`
      : subjects
          .map((s) => `<tr><td>${esc(s.label)}</td><td class="mark">${esc(s.mark || "—")}</td></tr>`)
          .join("");
  return `<!doctype html><html${dirAttrs(opts)}><head><meta charset="utf-8">${docHead(edu, opts)}<style>
.who{margin:18px 0;display:flex;gap:26px;font-size:14px}
.who .lbl{color:${DEFAULTS.muted};font-size:11px;text-transform:uppercase;letter-spacing:.1em}
.who b{font-size:16px;font-weight:600}
table{width:100%;border-collapse:collapse;margin-top:6px;font-size:14px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid ${DEFAULTS.line}}
th{background:${DEFAULTS.paper};color:${DEFAULTS.muted};font-size:11px;text-transform:uppercase;letter-spacing:.08em}
td.mark{font-weight:600;text-align:right}
.comment{margin-top:20px;border:1px solid ${DEFAULTS.line};border-radius:8px;padding:14px 16px;background:${DEFAULTS.paper}}
.comment .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:${DEFAULTS.gold};font-weight:600;margin-bottom:6px}
.comment p{font-size:13.5px;line-height:1.6}
</style></head><body>
${bhead(D.prTitle, edu, opts, `${esc(v.term) || ""}<br>${esc(v.date) || ""}`)}
<div class="who">
  <div><div class="lbl">${esc(D.student)}</div><b>${esc(v.student_name) || esc(D.studentName)}</b></div>
  <div><div class="lbl">${esc(D.klass)}</div><b>${esc(v.class_name) || "—"}</b></div>
</div>
<table><thead><tr><th>${esc(D.subject)}</th><th style="text-align:right">${esc(D.mark)}</th></tr></thead><tbody>${rowsHtml}</tbody></table>
<div class="comment"><div class="lbl">${esc(D.teacherComment)}</div><p>${esc(v.comment) || "—"}</p></div>
<div class="sign">
  <span class="blk">${sigTag(opts.branding, 38)}<b>${esc(v.teacher) || "&nbsp;"}</b>${esc(D.teacher)}</span>
  <span class="blk"><b>&nbsp;</b>${esc(D.signature)}</span>
</div>
</body></html>`;
}

/* ---------- fee receipt ---------- */

function feeReceiptHTML(v: FieldValues, opts: RenderOpts): string {
  const edu = accentOf(opts.branding);
  const D = docLabels(opts.lang ?? "en");
  return `<!doctype html><html${dirAttrs(opts)}><head><meta charset="utf-8">${docHead(edu, opts)}<style>
.rmeta{display:flex;gap:30px;margin:18px 0;font-size:13px}
.rmeta .lbl{color:${DEFAULTS.muted};font-size:11px;text-transform:uppercase;letter-spacing:.08em}
.rmeta b{font-size:15px}
table{width:100%;border-collapse:collapse;margin-top:6px;font-size:14px}
th,td{text-align:left;padding:11px 12px;border-bottom:1px solid ${DEFAULTS.line}}
th{background:${DEFAULTS.paper};color:${DEFAULTS.muted};font-size:11px;text-transform:uppercase;letter-spacing:.08em}
td.amt,th.amt{text-align:right;font-weight:600}
.totals{margin-top:14px;margin-left:auto;width:260px;font-size:14px}
.totals .row{display:flex;justify-content:space-between;padding:6px 2px}
.totals .row.grand{border-top:2px solid ${edu};margin-top:4px;padding-top:9px;font-weight:700;font-size:16px;color:${edu}}
.pill{display:inline-block;font-size:12px;font-weight:600;color:#fff;background:${edu};border-radius:20px;padding:3px 12px}
</style></head><body>
${bhead(D.frTitle, edu, opts, `${esc(D.receipt)}: <b style="color:${DEFAULTS.ink}">${esc(v.receipt_no) || "—"}</b><br>${esc(v.date) || ""}`)}
<div class="rmeta">
  <div><div class="lbl">${esc(D.receivedFrom)}</div><b>${esc(v.student_name) || esc(D.studentName)}</b></div>
  <div><div class="lbl">${esc(D.method)}</div><b>${esc(v.payment_method) || "—"}</b></div>
</div>
<table><thead><tr><th>${esc(D.description)}</th><th class="amt">${esc(D.amount)}</th></tr></thead>
<tbody><tr><td>${esc(v.fee_type) || esc(D.tuitionDefault)}</td><td class="amt">${esc(v.amount) || "—"}</td></tr></tbody></table>
<div class="totals">
  <div class="row"><span class="muted">${esc(D.total)}</span><span>${esc(v.amount) || "—"}</span></div>
  <div class="row"><span class="muted">${esc(D.paid)}</span><span>${esc(v.amount_paid) || esc(v.amount) || "—"}</span></div>
  <div class="row grand"><span>${esc(D.balance)}</span><span>${esc(v.balance) || "0"}</span></div>
</div>
<div style="margin-top:22px"><span class="pill">${esc(D.paidPill)}</span></div>
${signBlock(D.receivedBy, v.received_by, opts, edu)}
</body></html>`;
}

/* ---------- cards (ID + library) ---------- */

function cardHTML(
  tag: string,
  role: string,
  rows: { k: string; v: string }[],
  idValue: string,
  name: string,
  v: FieldValues,
  opts: RenderOpts
): string {
  const edu = accentOf(opts.branding);
  const D = docLabels(opts.lang ?? "en");
  const school = opts.branding?.schoolName?.trim();
  const qr = opts.qrDataUrl
    ? `<img src="${opts.qrDataUrl}" style="width:78px;height:78px" alt="qr">`
    : `<div class="qrph">QR</div>`;
  const photo = opts.photoDataUrl
    ? `<img class="photo" src="${opts.photoDataUrl}" alt="photo">`
    : `<div class="photo ph">Photo</div>`;
  const rowsHtml = rows
    .map((r) => `<div class="rowi"><div class="k">${esc(r.k)}</div><div class="vv">${esc(r.v) || "—"}</div></div>`)
    .join("");
  return `<!doctype html><html${dirAttrs(opts)}><head><meta charset="utf-8"><style>
${FONTS}
${arFont(opts)}
${fontVars(opts)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{font-family:var(--f-body);background:#fff;display:flex;align-items:center;justify-content:center;padding:24px}
.card{width:430px;height:271px;border-radius:14px;overflow:hidden;border:1px solid ${DEFAULTS.line};box-shadow:0 18px 40px -24px rgba(28,42,57,.5);display:flex;flex-direction:column}
.cardtop{background:${edu};color:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px}
.cardtop img.logo{max-height:30px;max-width:120px;object-fit:contain;filter:brightness(0) invert(1)}
.cardtop .sn{font-family:var(--f-display);font-weight:600;font-size:15px}
.cardtop .tag{margin-left:auto;font-size:9px;letter-spacing:.18em;text-transform:uppercase;opacity:.85}
.cardbody{flex:1;display:flex;padding:14px 16px;gap:14px;align-items:stretch}
.photo{width:64px;height:84px;border-radius:7px;object-fit:cover;border:1px solid ${DEFAULTS.line};flex-shrink:0;background:${DEFAULTS.paper}}
.photo.ph{display:flex;align-items:center;justify-content:center;color:${DEFAULTS.muted};font-size:10px;border-style:dashed}
.info{flex:1;min-width:0}
.info .nm{font-family:var(--f-display);font-weight:600;font-size:19px;color:${DEFAULTS.ink};line-height:1.1}
.info .role{font-size:10px;color:${DEFAULTS.muted};text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px}
.info .rowi{margin-top:8px}
.info .k{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:${DEFAULTS.muted}}
.info .vv{font-size:13px;font-weight:600;color:${DEFAULTS.ink}}
.qrwrap{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:5px}
.qrph{width:78px;height:78px;border:1px dashed ${DEFAULTS.line};border-radius:8px;display:flex;align-items:center;justify-content:center;color:${DEFAULTS.muted};font-size:12px}
.qrid{font-size:11px;font-weight:600;color:${edu};letter-spacing:.05em;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
</style></head><body>
<div class="card">
  <div class="cardtop">
    ${opts.branding?.logoDataUrl ? `<img class="logo" src="${opts.branding.logoDataUrl}" alt="logo">` : ""}
    <span class="sn">${school ? esc(school) : esc(D.schoolNamePh)}</span>
    <span class="tag">${esc(tag)}</span>
  </div>
  <div class="cardbody">
    ${photo}
    <div class="info">
      <div class="nm">${esc(name) || esc(D.studentName)}</div>
      <div class="role">${esc(role)}</div>
      ${rowsHtml}
    </div>
    <div class="qrwrap">${qr}<div class="qrid">${esc(idValue)}</div></div>
  </div>
</div>
</body></html>`;
}

function idCardHTML(v: FieldValues, opts: RenderOpts): string {
  const D = docLabels(opts.lang ?? "en");
  return cardHTML(
    D.idTag, D.idRole,
    [{ k: D.klass, v: v.class_name }, { k: D.validUntil, v: v.valid_until }],
    v.student_id || "ID-000", v.full_name, v, opts
  );
}

function libraryCardHTML(v: FieldValues, opts: RenderOpts): string {
  const D = docLabels(opts.lang ?? "en");
  return cardHTML(
    D.libTag, D.libRole,
    [{ k: D.klass, v: v.class_name }, { k: D.expires, v: v.expiry }],
    v.member_id || "MEM-000", v.full_name, v, opts
  );
}

function hallPassHTML(v: FieldValues, opts: RenderOpts): string {
  const edu = accentOf(opts.branding);
  const D = docLabels(opts.lang ?? "en");
  const school = opts.branding?.schoolName?.trim();
  return `<!doctype html><html${dirAttrs(opts)}><head><meta charset="utf-8"><style>
${FONTS}
${arFont(opts)}
${fontVars(opts)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{font-family:var(--f-body);background:#fff;display:flex;align-items:center;justify-content:center;padding:24px}
.pass{width:460px;height:240px;border-radius:14px;overflow:hidden;border:1px solid ${DEFAULTS.line};box-shadow:0 18px 40px -24px rgba(28,42,57,.5);display:flex}
.stripe{width:12px;background:${edu};flex-shrink:0}
.pb{flex:1;padding:18px 22px;display:flex;flex-direction:column}
.ptop{display:flex;align-items:center;justify-content:space-between}
.ptag{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:${edu};font-weight:700}
.psn{font-size:11px;color:${DEFAULTS.muted}}
.pttl{font-family:var(--f-display);font-weight:700;font-size:27px;color:${DEFAULTS.ink};margin:1px 0 12px}
.pnm{font-size:13px;color:${DEFAULTS.muted}}
.pnm b{font-family:var(--f-display);font-weight:600;font-size:20px;color:${DEFAULTS.ink};display:block}
.grid{margin-top:auto;display:flex;gap:30px}
.grid .k{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:${DEFAULTS.muted}}
.grid .v{font-size:15px;font-weight:600;color:${DEFAULTS.ink}}
</style></head><body>
<div class="pass">
  <div class="stripe"></div>
  <div class="pb">
    <div class="ptop"><span class="ptag">${esc(D.corridorPass)}</span><span class="psn">${school ? esc(school) : ""}</span></div>
    <div class="pttl">${esc(D.hallPass)}</div>
    <div class="pnm">${esc(D.permissionFor)}<b>${esc(v.student_name) || esc(D.studentName)}</b></div>
    <div class="grid">
      <div><div class="k">${esc(D.destination)}</div><div class="v">${esc(v.destination) || "—"}</div></div>
      <div><div class="k">${esc(D.timeOut)}</div><div class="v">${esc(v.time_out) || "—"}</div></div>
      <div><div class="k">${esc(D.date)}</div><div class="v">${esc(v.date) || "—"}</div></div>
      <div><div class="k">${esc(D.issuedBy)}</div><div class="v">${esc(v.teacher) || "—"}</div></div>
    </div>
  </div>
</div>
</body></html>`;
}

/* ---------- letters (attendance + enrollment) ---------- */

function letterHTML(
  title: string,
  bodyHtml: string,
  signLabel: string,
  signValue: string,
  v: FieldValues,
  opts: RenderOpts
): string {
  const edu = accentOf(opts.branding);
  return `<!doctype html><html${dirAttrs(opts)}><head><meta charset="utf-8">${docHead(edu, opts)}<style>
.body{margin-top:26px;font-size:14px;line-height:1.75;color:${DEFAULTS.ink}}
.body p{margin-bottom:14px}
.body .greet{margin-bottom:18px}
.facts{margin:18px 0;border:1px solid ${DEFAULTS.line};border-radius:8px;background:${DEFAULTS.paper};padding:14px 16px;display:flex;flex-wrap:wrap;gap:22px}
.facts .k{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:${DEFAULTS.muted}}
.facts .v{font-size:15px;font-weight:600}
</style></head><body>
${bhead(title, edu, opts, `${esc(v.date) || ""}`)}
<div class="body">${bodyHtml}</div>
${signBlock(signLabel, signValue, opts, edu)}
</body></html>`;
}

function attendanceLetterHTML(v: FieldValues, opts: RenderOpts): string {
  const D = docLabels(opts.lang ?? "en");
  const greet = v.guardian ? esc(D.dearName(v.guardian)) : esc(D.dearGuardian);
  const msg = esc(v.message) || esc(D.attMsg(v.student_name || D.theStudent));
  const body = `<p class="greet">${greet}</p>
  <div class="facts">
    <div><div class="k">${esc(D.student)}</div><div class="v">${esc(v.student_name) || "—"}</div></div>
    <div><div class="k">${esc(D.klass)}</div><div class="v">${esc(v.class_name) || "—"}</div></div>
    <div><div class="k">${esc(D.attendance)}</div><div class="v">${esc(v.attendance_pct) || "—"}</div></div>
    <div><div class="k">${esc(D.daysAbsent)}</div><div class="v">${esc(v.days_absent) || "—"}</div></div>
    <div><div class="k">${esc(D.period)}</div><div class="v">${esc(v.period) || "—"}</div></div>
  </div>
  <p>${msg}</p>
  <p>${esc(D.attClose)}</p>`;
  return letterHTML(D.attTitle, body, v.signatory ? "" : D.schoolAdmin, v.signatory, v, opts);
}

function enrollmentLetterHTML(v: FieldValues, opts: RenderOpts): string {
  const D = docLabels(opts.lang ?? "en");
  const status = esc(v.status) || esc(D.confirmedDefault);
  const body = `<p class="greet">${esc(D.toWhom)}</p>
  <p>${esc(D.enrBody(v.student_name || D.theStudent, status, v.academic_year || "—"))}</p>
  <div class="facts">
    <div><div class="k">${esc(D.student)}</div><div class="v">${esc(v.student_name) || "—"}</div></div>
    <div><div class="k">${esc(D.classGrade)}</div><div class="v">${esc(v.class_name) || "—"}</div></div>
    <div><div class="k">${esc(D.academicYear)}</div><div class="v">${esc(v.academic_year) || "—"}</div></div>
    <div><div class="k">${esc(D.admissionNo)}</div><div class="v">${esc(v.admission_no) || "—"}</div></div>
    <div><div class="k">${esc(D.statusLbl)}</div><div class="v">${status}</div></div>
  </div>
  <p>${esc(D.enrClose)}</p>`;
  return letterHTML(D.enrTitle, body, D.authSignatory, v.signatory, v, opts);
}

function permissionSlipHTML(v: FieldValues, opts: RenderOpts): string {
  const D = docLabels(opts.lang ?? "en");
  const greet = v.guardian ? esc(D.dearName(v.guardian)) : esc(D.dearGuardian);
  const body = `<p class="greet">${greet}</p>
  <p>${esc(D.permBody(v.student_name || D.theStudent, v.event || D.activityDefault))}</p>
  <div class="facts">
    <div><div class="k">${esc(D.activity)}</div><div class="v">${esc(v.event) || "—"}</div></div>
    <div><div class="k">${esc(D.date)}</div><div class="v">${esc(v.event_date) || "—"}</div></div>
    <div><div class="k">${esc(D.location)}</div><div class="v">${esc(v.location) || "—"}</div></div>
    <div><div class="k">${esc(D.cost)}</div><div class="v">${esc(v.cost) || "—"}</div></div>
  </div>
  <p>${esc(D.permClose)}</p>`;
  return letterHTML(D.permTitle, body, D.parentSig, "", v, opts);
}

function referenceLetterHTML(v: FieldValues, opts: RenderOpts): string {
  const D = docLabels(opts.lang ?? "en");
  const who = v.role
    ? `${v.student_name || D.theStudent}, ${v.role}`
    : `${v.student_name || D.theStudent}`;
  const body = `<p class="greet">${esc(D.toWhom)}</p>
  <p>${esc(v.body) || esc(D.refBody(who))}</p>
  <p>${esc(D.refClose)}</p>`;
  return letterHTML(D.refTitle, body, v.position || D.authSignatory, v.signatory, v, opts);
}

export function renderHTML(slug: string, v: FieldValues, opts: RenderOpts = {}): string {
  switch (slug) {
    case "progress-report":
      return progressReportHTML(v, opts);
    case "fee-receipt":
      return feeReceiptHTML(v, opts);
    case "student-id-card":
      return idCardHTML(v, opts);
    case "library-card":
      return libraryCardHTML(v, opts);
    case "hall-pass":
      return hallPassHTML(v, opts);
    case "attendance-letter":
      return attendanceLetterHTML(v, opts);
    case "enrollment-confirmation":
      return enrollmentLetterHTML(v, opts);
    case "permission-slip":
      return permissionSlipHTML(v, opts);
    case "reference-letter":
      return referenceLetterHTML(v, opts);
    default:
      return certificateHTML(v, opts);
  }
}
