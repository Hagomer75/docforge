// Template definitions: field schema + HTML rendering used for the live
// preview. PDF rendering for the same templates lives in ./pdf.ts and shares
// the same field keys + render options so one mapping drives both.

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
  // When true the UI lets the user pick spreadsheet columns to render as
  // subject/mark rows (flexible report cards).
  subjects?: boolean;
};

export const TEMPLATES: Template[] = [
  {
    slug: "certificate-classic",
    name: "Classic certificate",
    description: "Award certificate, A4 landscape",
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
];

export function getTemplate(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

export type FieldValues = Record<string, string>;
export type Subject = { label: string; mark: string };
export type LogoPos = "left" | "center" | "right";
export type Branding = {
  schoolName?: string;
  accent?: string; // hex, e.g. "#2F6F6A"
  logoDataUrl?: string; // data:image/...;base64,...
  logoPos?: LogoPos; // header alignment on the certificate
};
export type RenderOpts = { subjects?: Subject[]; branding?: Branding };

// Resolve a single data row into scalar field values using the column mapping.
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

// Resolve the chosen subject columns into label/mark pairs for one row.
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

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');`;

// Validate/normalise an accent so a bad value can't break rendering.
function accentOf(branding?: Branding): string {
  const a = branding?.accent;
  return a && /^#[0-9a-fA-F]{6}$/.test(a) ? a : DEFAULTS.edu;
}

function logoTag(branding: Branding | undefined, maxH: number): string {
  if (!branding?.logoDataUrl) return "";
  return `<img src="${branding.logoDataUrl}" style="max-height:${maxH}px;max-width:200px;object-fit:contain" alt="logo">`;
}

function certificateHTML(v: FieldValues, opts: RenderOpts): string {
  const edu = accentOf(opts.branding);
  const school = opts.branding?.schoolName?.trim();
  const logo = logoTag(opts.branding, 48);
  const pos = opts.branding?.logoPos ?? "center";
  const justify = pos === "left" ? "flex-start" : pos === "right" ? "flex-end" : "center";
  const hasHeader = !!(logo || school);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{font-family:'Inter',sans-serif;color:${DEFAULTS.ink};background:#fff;display:flex;align-items:center;justify-content:center;padding:18px}
.cert{width:100%;max-width:760px;aspect-ratio:1.414/1;border:3px solid ${edu};padding:10px}
.inner{height:100%;border:1px solid ${DEFAULTS.gold};padding:4.5% 8% 6%;display:flex;flex-direction:column;align-items:center;text-align:center}
/* Header is a fixed-height band so logo/name always reserve their own space. */
.head{height:62px;width:100%;display:flex;align-items:center;gap:12px;justify-content:${justify};flex-shrink:0;margin-bottom:10px}
.head img{max-height:48px;max-width:190px;object-fit:contain;display:block}
.head .sn{font-family:'Fraunces',serif;font-weight:600;font-size:15px;color:${edu};letter-spacing:.02em;white-space:nowrap}
.kicker{font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:${DEFAULTS.gold};font-weight:600}
.title{font-family:'Fraunces',serif;font-weight:700;font-size:27px;color:${edu};margin:6px 0 14px;line-height:1.12}
.intro{font-size:13px;color:${DEFAULTS.muted};letter-spacing:.04em}
.name{font-family:'Fraunces',serif;font-weight:600;font-size:31px;margin:8px 0;border-bottom:2px solid ${DEFAULTS.line};padding-bottom:8px;min-width:60%}
.detail{font-size:13px;color:${DEFAULTS.muted};font-style:italic;margin-top:6px;max-width:80%}
.foot{margin-top:auto;display:flex;justify-content:space-between;width:100%;padding-top:20px;font-size:12px;color:${DEFAULTS.muted}}
.foot b{display:block;color:${DEFAULTS.ink};font-weight:600;border-top:1px solid ${DEFAULTS.line};padding-top:5px;min-width:120px}
</style></head><body>
<div class="cert"><div class="inner">
  ${hasHeader ? `<div class="head">${logo}${school ? `<span class="sn">${esc(school)}</span>` : ""}</div>` : `<div class="head" style="height:24px"></div>`}
  <div class="kicker">Certificate of Achievement</div>
  <div class="title">${esc(v.award_title) || "Award"}</div>
  <div class="intro">This certificate is proudly presented to</div>
  <div class="name">${esc(v.recipient_name) || "Recipient name"}</div>
  ${v.detail ? `<div class="detail">${esc(v.detail)}</div>` : ""}
  <div class="foot">
    <span><b>${esc(v.teacher) || "&nbsp;"}</b>Teacher</span>
    <span><b>${esc(v.date) || "&nbsp;"}</b>Date</span>
    <span><b>${esc(v.school) || "&nbsp;"}</b>School</span>
  </div>
</div></div>
</body></html>`;
}

function progressReportHTML(v: FieldValues, opts: RenderOpts): string {
  const edu = accentOf(opts.branding);
  const school = opts.branding?.schoolName?.trim();
  const logo = logoTag(opts.branding, 40);
  const subjects = opts.subjects ?? [];
  const rowsHtml =
    subjects.length === 0
      ? `<tr><td colspan="2" style="color:${DEFAULTS.muted}">No subjects selected — pick subject columns to fill this table.</td></tr>`
      : subjects
          .map(
            (s) =>
              `<tr><td>${esc(s.label)}</td><td class="mark">${esc(s.mark || "—")}</td></tr>`
          )
          .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;color:${DEFAULTS.ink};background:#fff;padding:34px 40px}
.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid ${edu};padding-bottom:12px}
.head .l{display:flex;align-items:center;gap:12px}
.head h1{font-family:'Fraunces',serif;font-weight:700;font-size:22px;color:${edu}}
.head .sn{font-size:12px;color:${DEFAULTS.muted}}
.head .meta{text-align:right;font-size:12px;color:${DEFAULTS.muted}}
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
.sign{margin-top:34px;display:flex;justify-content:space-between;font-size:12px;color:${DEFAULTS.muted}}
.sign b{display:block;color:${DEFAULTS.ink};border-top:1px solid ${DEFAULTS.line};padding-top:5px;min-width:150px}
</style></head><body>
<div class="head">
  <div class="l">${logo}<div><h1>Progress Report</h1>${school ? `<div class="sn">${esc(school)}</div>` : ""}</div></div>
  <div class="meta">${esc(v.term) || ""}<br>${esc(v.date) || ""}</div>
</div>
<div class="who">
  <div><div class="lbl">Student</div><b>${esc(v.student_name) || "Student name"}</b></div>
  <div><div class="lbl">Class</div><b>${esc(v.class_name) || "—"}</b></div>
</div>
<table>
  <thead><tr><th>Subject</th><th style="text-align:right">Mark</th></tr></thead>
  <tbody>${rowsHtml}</tbody>
</table>
<div class="comment">
  <div class="lbl">Teacher's comment</div>
  <p>${esc(v.comment) || "—"}</p>
</div>
<div class="sign">
  <span><b>${esc(v.teacher) || "&nbsp;"}</b>Teacher</span>
  <span><b>&nbsp;</b>Signature</span>
</div>
</body></html>`;
}

export function renderHTML(slug: string, v: FieldValues, opts: RenderOpts = {}): string {
  if (slug === "progress-report") return progressReportHTML(v, opts);
  return certificateHTML(v, opts);
}
