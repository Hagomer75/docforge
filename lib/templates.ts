// Template definitions: field schema + HTML rendering used for the live
// preview. PDF rendering for the same templates lives in ./pdf.ts and shares
// the same field keys so a single column mapping drives both.

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
    fields: [
      { key: "student_name", label: "Student name", required: true },
      { key: "class_name", label: "Class", required: false },
      { key: "term", label: "Term", required: false },
      { key: "math", label: "Mathematics mark", required: false },
      { key: "english", label: "English mark", required: false },
      { key: "science", label: "Science mark", required: false },
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

// Resolve a single data row into field values using the column mapping.
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

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BRAND = {
  ink: "#1C2A39",
  paper: "#FBFAF7",
  edu: "#2F6F6A",
  gold: "#C8923A",
  line: "#E7E3DB",
  muted: "#6B7785",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');`;

function certificateHTML(v: FieldValues): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{font-family:'Inter',sans-serif;color:${BRAND.ink};background:#fff;display:flex;align-items:center;justify-content:center;padding:18px}
.cert{width:100%;max-width:760px;aspect-ratio:1.414/1;border:3px solid ${BRAND.edu};padding:10px}
.inner{height:100%;border:1px solid ${BRAND.gold};padding:7% 9%;display:flex;flex-direction:column;align-items:center;text-align:center}
.kicker{font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:${BRAND.gold};font-weight:600}
.title{font-family:'Fraunces',serif;font-weight:700;font-size:30px;color:${BRAND.edu};margin:8px 0 18px}
.intro{font-size:13px;color:${BRAND.muted};letter-spacing:.04em}
.name{font-family:'Fraunces',serif;font-weight:600;font-size:34px;margin:10px 0;border-bottom:2px solid ${BRAND.line};padding-bottom:8px;min-width:60%}
.award{font-size:15px;font-weight:600;margin-top:14px}
.detail{font-size:13px;color:${BRAND.muted};font-style:italic;margin-top:6px;max-width:80%}
.foot{margin-top:auto;display:flex;justify-content:space-between;width:100%;padding-top:22px;font-size:12px;color:${BRAND.muted}}
.foot b{display:block;color:${BRAND.ink};font-weight:600;border-top:1px solid ${BRAND.line};padding-top:5px;min-width:120px}
</style></head><body>
<div class="cert"><div class="inner">
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

function progressReportHTML(v: FieldValues): string {
  const rows = [
    ["Mathematics", v.math],
    ["English", v.english],
    ["Science", v.science],
  ];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;color:${BRAND.ink};background:#fff;padding:34px 40px}
.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid ${BRAND.edu};padding-bottom:12px}
.head h1{font-family:'Fraunces',serif;font-weight:700;font-size:22px;color:${BRAND.edu}}
.head .meta{text-align:right;font-size:12px;color:${BRAND.muted}}
.who{margin:18px 0;display:flex;gap:26px;font-size:14px}
.who .lbl{color:${BRAND.muted};font-size:11px;text-transform:uppercase;letter-spacing:.1em}
.who b{font-size:16px;font-weight:600}
table{width:100%;border-collapse:collapse;margin-top:6px;font-size:14px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid ${BRAND.line}}
th{background:${BRAND.paper};color:${BRAND.muted};font-size:11px;text-transform:uppercase;letter-spacing:.08em}
td.mark{font-weight:600;text-align:right}
.comment{margin-top:20px;border:1px solid ${BRAND.line};border-radius:8px;padding:14px 16px;background:${BRAND.paper}}
.comment .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:${BRAND.gold};font-weight:600;margin-bottom:6px}
.comment p{font-size:13.5px;line-height:1.6}
.sign{margin-top:34px;display:flex;justify-content:space-between;font-size:12px;color:${BRAND.muted}}
.sign b{display:block;color:${BRAND.ink};border-top:1px solid ${BRAND.line};padding-top:5px;min-width:150px}
</style></head><body>
<div class="head">
  <h1>Progress Report</h1>
  <div class="meta">${esc(v.term) || ""}<br>${esc(v.date) || ""}</div>
</div>
<div class="who">
  <div><div class="lbl">Student</div><b>${esc(v.student_name) || "Student name"}</b></div>
  <div><div class="lbl">Class</div><b>${esc(v.class_name) || "—"}</b></div>
</div>
<table>
  <thead><tr><th>Subject</th><th style="text-align:right">Mark</th></tr></thead>
  <tbody>
    ${rows
      .map(
        ([s, m]) =>
          `<tr><td>${s}</td><td class="mark">${esc(m || "—")}</td></tr>`
      )
      .join("")}
  </tbody>
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

export function renderHTML(slug: string, v: FieldValues): string {
  if (slug === "progress-report") return progressReportHTML(v);
  return certificateHTML(v);
}
