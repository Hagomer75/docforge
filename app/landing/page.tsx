import type { Metadata } from "next";
import s from "./landing.module.css";

export const metadata: Metadata = {
  title: "DocForge — batch documents for schools, in minutes",
  description:
    "Upload a class list, pick a template, and DocForge makes a polished PDF for every student — certificates, report cards, ID cards, letters. Bilingual English/Arabic. No install, no account.",
};

/* tiny icon helper */
const I = (p: React.ReactNode, sw = 1.7) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {p}
  </svg>
);
const IC = {
  sheet: I(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></>),
  doc: I(<><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>),
  arrow: I(<path d="M4 12h16M14 6l6 6-6 6" />),
  pick: I(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 12l3 3 5-6" /></>),
  upload: I(<><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></>),
  bolt: I(<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />),
  cert: I(<><circle cx="12" cy="9" r="5" /><path d="M9 13l-1.5 7L12 18l4.5 2L15 13" /></>),
  report: I(<><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>),
  receipt: I(<><path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3z" /><path d="M9.5 8h5M9.5 12h5" /></>),
  id: I(<><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M6 15.5c.7-1.2 3.3-1.2 4 0M14 10h4M14 13h3" /></>),
  book: I(<><path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2z" /><path d="M8 3v16" /></>),
  pass: I(<><rect x="4" y="3" width="9" height="18" rx="1" /><circle cx="10" cy="12" r="1" /><path d="M15 12h6M18 9l3 3-3 3" /></>),
  letter: I(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M4 7l8 6 8-6" /></>),
  badge: I(<><path d="M12 3l2.5 1.8 3-.2 1 2.9 2.4 1.7-1 2.8 1 2.8-2.4 1.7-1 2.9-3-.2L12 21l-2.5-1.8-3 .2-1-2.9L3.1 14l1-2.8-1-2.8 2.4-1.7 1-2.9 3 .2z" /><path d="M9 12l2 2 4-4" /></>),
  clipboard: I(<><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" /><path d="M9 13l2 2 4-4" /></>),
  star: I(<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8-4.3-4.1 5.9-.9z" />),
  palette: I(<><path d="M12 3a9 9 0 100 18c1.7 0 2-1.3 1.2-2.2-.8-.9-.3-2.1.8-2.1H17a4 4 0 004-4c0-5-4-7.7-9-7.7z" /><circle cx="7.5" cy="11" r="1" /><circle cx="11" cy="7.5" r="1" /><circle cx="15.5" cy="9" r="1" /></>),
  globe: I(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></>),
  qr: I(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v.01M14 21h.01M21 21v.01M18 18h.01" /></>),
  stack: I(<><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5M3 8v8M21 8v8" /></>),
  shield: I(<><path d="M12 3l8 3v6c0 5-3.4 7.7-8 9-4.6-1.3-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>),
  type: I(<><path d="M5 19L10 5l5 14" /><path d="M7.2 14h5.6" /></>),
};

const SHOTS = [
  { img: "certificate", t: "Award certificate", tag: "EN" },
  { img: "report", t: "Progress report", tag: "EN" },
  { img: "idcard", t: "Student ID card", tag: "EN" },
  { img: "receipt", t: "Fee receipt", tag: "EN" },
  { img: "permission", t: "Permission slip", tag: "EN" },
  { img: "certificate_ar", t: "Certificate", tag: "عربي" },
];

const STEPS = [
  { ic: IC.pick, t: "Choose a template", d: "Certificate, report card, fee receipt, ID card, hall pass or letter — 10 in all." },
  { ic: IC.upload, t: "Upload & map", d: "Drop a CSV or Excel class list. DocForge auto-matches your columns; tweak with a click." },
  { ic: IC.bolt, t: "Generate", d: "Every row becomes a finished PDF, bundled into one download. A whole class in seconds." },
];

const TEMPLATES = [
  { ic: IC.cert, t: "Certificate", g: "Award, A4" },
  { ic: IC.report, t: "Progress report", g: "Marks + comment" },
  { ic: IC.receipt, t: "Fee receipt", g: "Paid / balance" },
  { ic: IC.id, t: "Student ID card", g: "Photo + QR" },
  { ic: IC.book, t: "Library card", g: "Photo + QR" },
  { ic: IC.pass, t: "Hall pass", g: "Corridor pass" },
  { ic: IC.letter, t: "Attendance letter", g: "Notice home" },
  { ic: IC.badge, t: "Enrollment", g: "Confirmation" },
  { ic: IC.clipboard, t: "Permission slip", g: "Consent" },
  { ic: IC.star, t: "Reference letter", g: "Recommendation" },
];

const FEATURES = [
  { ic: IC.globe, t: "Truly bilingual", d: "Full English and Arabic — the interface and the documents, with correct right-to-left layout and properly shaped Arabic text in the PDFs.", wide: true },
  { ic: IC.palette, t: "Your branding", d: "Logo, accent colour, signature, school name and three font styles. Saved for next time." },
  { ic: IC.id, t: "Photos & QR codes", d: "ID and library cards carry a student photo and a scannable QR code built from their ID." },
  { ic: IC.stack, t: "Print sheets", d: "Tile 2, 4 or 10 cards per A4 page with cut guides — print a whole class set, then cut." },
  { ic: IC.type, t: "Custom wording", d: "Rewrite any printed label — titles, captions, signatures — per template and per language." },
  { ic: IC.shield, t: "Private by design", d: "No account, nothing stored. Your class list is used to build the PDFs, then it's gone." },
];

const FAQ = [
  { q: "Do I need an account or install?", a: "Neither. DocForge runs in your browser — open it and go. No sign-up, nothing to download." },
  { q: "What files can I upload?", a: "CSV (.csv) and Excel (.xlsx, .xls), up to 5 MB. A class list is tiny — well under that." },
  { q: "Does it really work in Arabic?", a: "Yes. The whole app and every document support Arabic with right-to-left layout and correctly joined, shaped Arabic text in the generated PDFs." },
  { q: "How many students at once?", a: "Hundreds. Documents are generated in small batches with a progress bar, so big year-groups never time out." },
  { q: "Is my students' data safe?", a: "Your file is sent only to build the PDFs, then handed straight back to your browser. It isn't kept after your documents are made." },
];

export default function Landing() {
  return (
    <div className={s.page} dir="ltr">
      {/* nav */}
      <header className={s.nav}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <a href="/landing" className={s.brand}>Doc<span>Forge</span></a>
          <nav className={s.navLinks}>
            <a href="#how">How it works</a>
            <a href="#templates">Templates</a>
            <a href="#features">Features</a>
            <a href="/help">Help</a>
          </nav>
          <a href="/" className={s.navCta}>Open the app</a>
        </div>
      </header>

      {/* hero */}
      <section className={s.wrap}>
        <div className={s.hero}>
          <div className={s.heroText}>
            <span className={s.eyebrow}>For schools <span className={s.ar}>· يعمل بالعربية</span></span>
            <h1 className={s.h1}>Turn a class list into a stack of <em>finished PDFs</em>.</h1>
            <p className={s.sub}>
              Upload your spreadsheet, pick a template, and DocForge makes a polished document for
              every student — certificates, report cards, ID cards, letters and more.
            </p>
            <div className={s.ctaRow}>
              <a href="/" className={s.btnPrimary}>Start making documents <span style={{ width: 18, height: 18 }}>{IC.arrow}</span></a>
              <a href="#how" className={s.btnGhost}>See how it works</a>
            </div>
            <div className={s.trust}>
              <span>No install</span><span className={s.dot} />
              <span>No account</span><span className={s.dot} />
              <span>Bilingual EN / AR</span><span className={s.dot} />
              <span>Free</span>
            </div>
          </div>

          <div className={s.visual} aria-hidden="true">
            <div className={s.csvCard}>
              <div className={s.csvHead}>{IC.sheet} class.csv</div>
              <div className={s.csvRow} /><div className={s.csvRow} /><div className={s.csvRow} />
              <div className={s.csvRow} /><div className={s.csvRow} />
            </div>
            <div className={s.arrow}>{IC.arrow}</div>
            <div className={s.docStack}>
              <div className={`${s.doc} ${s.doc1}`} />
              <div className={`${s.doc} ${s.doc2}`} />
              <div className={`${s.doc} ${s.doc3}`}>
                <div className={s.certTop} />
                <div className={s.certBody}>
                  <div className={s.certKick}>CERTIFICATE</div>
                  <div className={s.certTitle}>For Excellence</div>
                  <div className={s.certName}>Maya Thompson</div>
                  <div className={s.certQr} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* stats */}
      <section className={s.sectionAlt}>
        <div className={s.wrap}>
          <div className={s.stats}>
            <div className={`${s.stat} ${s.reveal}`}><span className={s.statNum}>10</span><span className={s.statLbl}>document templates</span></div>
            <div className={`${s.stat} ${s.reveal}`}><span className={s.statNum}>2</span><span className={s.statLbl}>languages · EN + AR</span></div>
            <div className={`${s.stat} ${s.reveal}`}><span className={s.statNum}>100s</span><span className={s.statLbl}>students per run</span></div>
            <div className={`${s.stat} ${s.reveal}`}><span className={s.statNum}>0</span><span className={s.statLbl}>logins or installs</span></div>
          </div>
        </div>
      </section>

      {/* showcase */}
      <section className={s.section}>
        <div className={s.wrap}>
          <div className={`${s.center} ${s.reveal}`}>
            <span className={s.kicker}>Examples</span>
            <h2 className={s.h2}>Real documents, made in seconds</h2>
            <p className={s.lead}>Every one below came straight out of DocForge — branded, print-ready, in English or Arabic.</p>
          </div>
          <div className={s.shots}>
            {SHOTS.map((sh, i) => (
              <div className={`${s.shot} ${s.reveal}`} key={i}>
                <div className={s.shotImg}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/samples/${sh.img}.png`} alt={`${sh.t} made with DocForge`} loading="lazy" />
                </div>
                <div className={s.shotCap}>
                  <b>{sh.t}</b>
                  <span className={s.shotTag}>{sh.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className={s.section}>
        <div className={s.wrap}>
          <div className={`${s.center} ${s.reveal}`}>
            <span className={s.kicker}>How it works</span>
            <h2 className={s.h2}>Three steps, start to finish</h2>
            <p className={s.lead}>No templates to design, no mail-merge gymnastics. Just your list and a few clicks.</p>
          </div>
          <div className={s.steps}>
            {STEPS.map((st, i) => (
              <div className={`${s.step} ${s.reveal}`} key={i}>
                <div className={s.stepN}>{i + 1}</div>
                <div className={s.stepIc}>{st.ic}</div>
                <h3>{st.t}</h3>
                <p>{st.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* templates */}
      <section id="templates" className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.wrap}>
          <div className={`${s.center} ${s.reveal}`}>
            <span className={s.kicker}>Templates</span>
            <h2 className={s.h2}>Ten ready-made documents</h2>
            <p className={s.lead}>Pick one and go — every template is branded, bilingual, and print-ready.</p>
          </div>
          <div className={s.tplGrid}>
            {TEMPLATES.map((t, i) => (
              <div className={`${s.tpl} ${s.reveal}`} key={i}>
                <div className={s.tplIc}>{t.ic}</div>
                <h4>{t.t}</h4>
                <p>{t.g}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className={s.section}>
        <div className={s.wrap}>
          <div className={`${s.center} ${s.reveal}`}>
            <span className={s.kicker}>Features</span>
            <h2 className={s.h2}>Everything a school office needs</h2>
            <p className={s.lead}>Powerful where it counts, simple everywhere else.</p>
          </div>
          <div className={s.bento}>
            {FEATURES.map((f, i) => (
              <div className={`${s.feat} ${s.reveal} ${f.wide ? s.featWide : ""}`} key={i}>
                <div className={s.featIc}>{f.ic}</div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* bilingual band */}
      <section className={`${s.section} ${s.sectionAlt}`}>
        <div className={s.wrap}>
          <div className={s.bi}>
            <div>
              <span className={s.kicker}>English & العربية</span>
              <h2 className={s.h2}>Real Arabic, not an afterthought</h2>
              <p className={s.lead}>
                Toggle the language and the whole app flips to right-to-left. The documents do too — with
                Arabic text that's correctly joined and shaped in the PDF, the way few tools manage.
                Mix English names with Arabic labels, or go fully Arabic.
              </p>
            </div>
            <div className={`${s.biCard} ${s.reveal}`}>
              <div className={s.biCert}>
                <div className="k">شهادة تقدير</div>
                <div className="t">للتميّز في الكتابة</div>
                <div className="small">تُمنح هذه الشهادة بكل فخر إلى</div>
                <div className="n">مايا أحمد</div>
                <div className="small">مدرسة النور · ٢٠٢٦</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* faq */}
      <section className={s.section}>
        <div className={s.wrap}>
          <div className={`${s.center} ${s.reveal}`}>
            <span className={s.kicker}>FAQ</span>
            <h2 className={s.h2}>Questions, answered</h2>
          </div>
          <div className={s.faq}>
            {FAQ.map((f, i) => (
              <details key={i}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* final cta */}
      <section className={s.wrap}>
        <div className={`${s.cta} ${s.reveal}`}>
          <h2>Make your first batch in two minutes</h2>
          <p>Free, in your browser, in English or Arabic. Nothing to install.</p>
          <a href="/" className={s.ctaBtn}>Open DocForge <span style={{ width: 18, height: 18 }}>{IC.arrow}</span></a>
        </div>
      </section>

      {/* footer */}
      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.footInner}`}>
          <div className={s.brand}>Doc<span>Forge</span></div>
          <div className={s.footLinks}>
            <a href="/">App</a>
            <a href="/help">Help</a>
            <a href="#templates">Templates</a>
            <a href="#features">Features</a>
          </div>
          <div className={s.footNote}>Batch documents for schools · EN / AR</div>
        </div>
      </footer>
    </div>
  );
}
