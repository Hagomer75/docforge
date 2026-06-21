"use client";

import { useEffect, useState } from "react";

/* ---------- tiny icon helper ---------- */
const I = (p: React.ReactNode, sw = 1.7) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {p}
  </svg>
);
const IC = {
  sheet: I(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></>),
  doc: I(<><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>),
  pick: I(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 12l3 3 5-6" /></>),
  upload: I(<><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></>),
  bolt: I(<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />),
  cert: I(<><circle cx="12" cy="9" r="5" /><path d="M9 13l-1.5 7L12 18l4.5 2L15 13" /></>),
  report: I(<><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>),
  receipt: I(<><path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3z" /><path d="M9.5 8h5M9.5 12h5" /></>),
  id: I(<><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M6 15.5c.7-1.2 3.3-1.2 4 0M14 10h4M14 13h3" /></>),
  letter: I(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M4 7l8 6 8-6" /></>),
  badge: I(<><path d="M12 3l2.5 1.8 3-.2 1 2.9 2.4 1.7-1 2.8 1 2.8-2.4 1.7-1 2.9-3-.2L12 21l-2.5-1.8-3 .2-1-2.9L3.1 14l1-2.8-1-2.8 2.4-1.7 1-2.9 3 .2z" /><path d="M9 12l2 2 4-4" /></>),
  book: I(<><path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2z" /><path d="M8 3v16" /></>),
  pass: I(<><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h6M7 14h4M17 9v6" /></>),
  palette: I(<><path d="M12 3a9 9 0 100 18c1.7 0 2-1.3 1.2-2.2-.8-.9-.3-2.1.8-2.1H17a4 4 0 004-4c0-5-4-7.7-9-7.7z" /><circle cx="7.5" cy="11" r="1" /><circle cx="11" cy="7.5" r="1" /><circle cx="15.5" cy="9" r="1" /></>),
  list: I(<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>),
  image: I(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5-5L5 21" /></>),
  pencil: I(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M14 6l4 4" /></>),
  stack: I(<><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5M3 8v8M21 8v8" /></>),
  tag: I(<><path d="M3 12V5a2 2 0 012-2h7l9 9-9 9z" /><circle cx="7.5" cy="7.5" r="1.2" /></>),
  shield: I(<><path d="M12 3l8 3v6c0 5-3.4 7.7-8 9-4.6-1.3-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>),
  qr: I(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v.01M14 21h.01M21 21v.01M18 18h.01M21 18h.01M18 21h.01" /></>),
  eye: I(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>),
  calendar: I(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /><path d="M8.5 15l2 2 4-4" /></>),
  door: I(<><rect x="4" y="3" width="9" height="18" rx="1" /><circle cx="10" cy="12" r="1" /><path d="M15 12h6M18 9l3 3-3 3" /></>),
  clipboard: I(<><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" /><path d="M9 13l2 2 4-4" /></>),
  refstar: I(<><path d="M7 3h7l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M14 3v4h4" /><path d="M11.5 11l.85 1.7 1.9.25-1.4 1.35.35 1.9-1.7-.9-1.7.9.35-1.9L8.75 13l1.9-.25z" /></>),
};

const STEPS = [
  { ic: IC.pick, t: "Choose a template", d: "Pick the document you want — certificate, report, receipt, ID card, letter." },
  { ic: IC.upload, t: "Upload & map", d: "Drop your CSV/Excel list. DocForge auto-matches columns to fields; tweak as needed and watch the live preview." },
  { ic: IC.bolt, t: "Generate", d: "Click generate. Every row becomes a PDF, bundled into one ZIP — one document per student." },
];

const TEMPLATES = [
  { g: "Certificates", ic: IC.cert, t: "Classic certificate", d: "Award certificate, A4 landscape" },
  { g: "Reports", ic: IC.report, t: "Progress report", d: "Per-subject marks + comment" },
  { g: "Finance", ic: IC.receipt, t: "Fee receipt", d: "Paid / balance receipt" },
  { g: "Cards", ic: IC.id, t: "Student ID card", d: "Photo + scannable QR" },
  { g: "Cards", ic: IC.book, t: "Library card", d: "Photo + QR member card" },
  { g: "Cards", ic: IC.door, t: "Hall pass", d: "Corridor pass, landscape" },
  { g: "Letters", ic: IC.calendar, t: "Attendance letter", d: "Attendance notice home" },
  { g: "Letters", ic: IC.badge, t: "Enrollment confirmation", d: "Admission confirmation" },
  { g: "Letters", ic: IC.clipboard, t: "Permission slip", d: "Consent + parent signature" },
  { g: "Letters", ic: IC.refstar, t: "Reference letter", d: "Recommendation letter" },
];

const FEATURES = [
  { ic: IC.list, t: "Smart column mapping", d: "Auto-matches your spreadsheet headers to the right fields. Adjust any with a dropdown." },
  { ic: IC.eye, t: "Live preview", d: "See the first record render as you map. Flip through every student with ◀ ▶." },
  { ic: IC.palette, t: "Your branding", d: "Add a logo, accent colour, signature and school name. Saved in your browser for next time." },
  { ic: IC.image, t: "Student photos", d: "Add a Photo URL column to put a photo on ID & library cards." },
  { ic: IC.report, t: "Flexible subjects", d: "On report cards, tick which columns are marks — each becomes a subject row." },
  { ic: IC.pencil, t: "Edit a record inline", d: "Fix a typo right in the preview without re-uploading. The change is included when you generate." },
  { ic: IC.tag, t: "Filename patterns", d: "Name files your way — {student_name}-{class_name}. Click tokens to insert them." },
  { ic: IC.shield, t: "Pre-flight checks", d: "Warns about blank required fields or duplicate names before you generate." },
  { ic: IC.stack, t: "Whole grades at once", d: "Hundreds of students handled in small batches with a progress bar — no timeouts." },
  { ic: IC.qr, t: "QR codes", d: "ID & library cards get a scannable QR code built from the ID automatically." },
];

const FAQ = [
  { q: "Do I need an account?", a: "No. There's nothing to install and no sign-up — just open it and go." },
  { q: "Is my class list stored anywhere?", a: "Your file is sent to the server only to build the PDFs, then handed back to your browser. It isn't kept after your documents are made." },
  { q: "What files can I upload?", a: "CSV (.csv) and Excel (.xlsx, .xls), up to 5 MB. A class list is tiny — well under that." },
  { q: "Can I use my school's logo and colours?", a: "Yes — the Branding panel takes a logo, accent colour, signature and school name. Click ‘Save as default’ to reuse them." },
  { q: "How many students at once?", a: "Hundreds are fine. DocForge generates in small batches with a progress bar, so big grades don't time out." },
  { q: "Can I download just one PDF?", a: "Yes. In the preview, use ‘Download this one’ to save only the current record." },
  { q: "How do photos on ID cards work?", a: "Add a column of direct image links (a public .png/.jpg URL per student) and map it to Photo URL." },
];

const FIXES = [
  { p: "Upload failed / can't read the file", f: "Check it's a .csv/.xlsx/.xls under 5 MB and has a header row on top." },
  { p: "Continue button is greyed out", f: "Map every required field — they're marked with a gold ★." },
  { p: "Preview is empty", f: "Map the name field; the preview needs it to render a record." },
  { p: "Logo or signature rejected", f: "Use a PNG or JPG under 600 KB." },
  { p: "Marks missing on the report", f: "Tick the subject columns in the Subjects section." },
  { p: "Photo not showing on the card", f: "Use a direct public PNG/JPG link (not a page that needs a login)." },
];

const NAV = [
  { id: "how", label: "How it works" },
  { id: "templates", label: "Templates" },
  { id: "features", label: "Features" },
  { id: "data", label: "Your spreadsheet" },
  { id: "faq", label: "FAQ" },
  { id: "fix", label: "Fixes" },
];

export default function HelpPage() {
  const [active, setActive] = useState("how");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-20% 0px -70% 0px" }
    );
    NAV.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="wrap">
      <div className="help-top">
        <div className="logo">
          Doc<span>Forge</span>
        </div>
        <a className="back" href="/">
          ← Back to app
        </a>
      </div>

      {/* hero */}
      <section className="ig-hero">
        <div className="ig-hero-tx">
          <h1>Turn a class list into a stack of PDFs.</h1>
          <p>
            Upload one spreadsheet, pick a document, and DocForge makes one PDF for every student —
            handed back as a single ZIP. No installs, no account.
          </p>
          <a className="btn" href="/">
            Start making documents
          </a>
        </div>
        <div className="ig-hero-vis" aria-hidden>
          <div className="hv-sheet">{IC.sheet}<span>class.csv</span></div>
          <div className="hv-arrow">{I(<path d="M4 12h16M14 6l6 6-6 6" />)}</div>
          <div className="hv-stack">
            <span className="hv-doc" /><span className="hv-doc" /><span className="hv-doc">{IC.doc}</span>
          </div>
        </div>
      </section>

      {/* sticky chip nav */}
      <nav className="chipnav">
        {NAV.map((n) => (
          <a key={n.id} href={`#${n.id}`} className={active === n.id ? "on" : ""}>
            {n.label}
          </a>
        ))}
      </nav>

      {/* how it works */}
      <section id="how" className="ig-sec">
        <h2 className="ig-h2">How it works</h2>
        <p className="ig-sub">Three steps, start to finish.</p>
        <div className="ig-steps">
          {STEPS.map((s, i) => (
            <div className="ig-step" key={s.t}>
              <div className="ig-step-n">{i + 1}</div>
              <div className="ig-step-ic">{s.ic}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* templates */}
      <section id="templates" className="ig-sec">
        <h2 className="ig-h2">Ten ready-made templates</h2>
        <p className="ig-sub">One document type per tile.</p>
        <div className="ig-tiles">
          {TEMPLATES.map((t) => (
            <div className="ig-tile" key={t.t}>
              <div className="ig-tile-ic">{t.ic}</div>
              <div className="ig-tile-tx">
                <span className="ig-tile-g">{t.g}</span>
                <h4>{t.t}</h4>
                <p>{t.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* features */}
      <section id="features" className="ig-sec">
        <h2 className="ig-h2">What it can do</h2>
        <p className="ig-sub">Everything is optional — use what you need.</p>
        <div className="ig-feats">
          {FEATURES.map((f) => (
            <div className="ig-feat" key={f.t}>
              <div className="ig-feat-ic">{f.ic}</div>
              <h4>{f.t}</h4>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* spreadsheet */}
      <section id="data" className="ig-sec">
        <h2 className="ig-h2">Preparing your spreadsheet</h2>
        <p className="ig-sub">One header row, one student per row. That's it.</p>
        <div className="ig-data">
          <div className="ig-mini">
            <table>
              <thead>
                <tr><th>Name</th><th>Award</th><th>Teacher</th></tr>
              </thead>
              <tbody>
                <tr><td>Maya Thompson</td><td>For Excellence</td><td>Ms. Rivera</td></tr>
                <tr><td>Aiden Park</td><td>Outstanding Effort</td><td>Ms. Rivera</td></tr>
              </tbody>
            </table>
            <span className="ig-cap">Each row → one PDF · each column → a field you map</span>
          </div>
          <ul className="ig-tips">
            <li><b>Formats:</b> .csv, .xlsx or .xls, up to 5 MB.</li>
            <li><b>Headers:</b> keep a clear header row on top — no merged cells.</li>
            <li><b>Values:</b> dates and marks as plain text work best.</li>
            <li><b>No file?</b> Grab the <a href="/sample-class.csv" download>sample class list</a>.</li>
          </ul>
        </div>
      </section>

      {/* faq */}
      <section id="faq" className="ig-sec">
        <h2 className="ig-h2">Questions</h2>
        <div className="ig-faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* fixes */}
      <section id="fix" className="ig-sec">
        <h2 className="ig-h2">If something's off</h2>
        <div className="ig-fixes">
          {FIXES.map((x) => (
            <div className="ig-fix" key={x.p}>
              <div className="ig-fix-p">{x.p}</div>
              <div className="ig-fix-f">{x.f}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="ig-cta">
        <h2>Ready?</h2>
        <a className="btn" href="/">Open DocForge</a>
      </div>
    </div>
  );
}
