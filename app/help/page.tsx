"use client";

import { useEffect, useState } from "react";
import { useI18n, LangToggle } from "../i18n";

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
  badge: I(<><path d="M12 3l2.5 1.8 3-.2 1 2.9 2.4 1.7-1 2.8 1 2.8-2.4 1.7-1 2.9-3-.2L12 21l-2.5-1.8-3 .2-1-2.9L3.1 14l1-2.8-1-2.8 2.4-1.7 1-2.9 3 .2z" /><path d="M9 12l2 2 4-4" /></>),
  book: I(<><path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2z" /><path d="M8 3v16" /></>),
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
  type: I(<><path d="M5 19L10 5l5 14" /><path d="M7.2 14h5.6" /><path d="M16.5 19h3" /></>),
  grid4: I(<><rect x="3" y="3" width="7.5" height="7.5" rx="1" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1" /></>),
  tedit: I(<><path d="M5 6h10M10 6v12" /><path d="M16 13l4 4-1.2 3.2-3.2-1.2z" /></>),
};

type Lang = "en" | "ar";
const pick = <T,>(o: { en: T; ar: T }, lang: Lang) => o[lang] ?? o.en;

const L: Record<Lang, Record<string, string>> = {
  en: {
    hero1: "Turn a class list into a stack of PDFs.",
    herop: "Upload one spreadsheet, pick a document, and DocForge makes one PDF for every student — handed back as a single ZIP. No installs, no account.",
    cta: "Start making documents",
    howH: "How it works", howSub: "Three steps, start to finish.",
    tplH: "Ten ready-made templates", tplSub: "One document type per tile.",
    featH: "What it can do", featSub: "Everything is optional — use what you need.",
    dataH: "Preparing your spreadsheet", dataSub: "One header row, one student per row. That's it.",
    qH: "Questions", fixH: "If something's off",
    ctaH: "Ready?", ctaBtn: "Open DocForge",
    cName: "Name", cAward: "Award", cTeacher: "Teacher",
    cap: "Each row → one PDF · each column → a field you map",
    t1: "Formats: .csv, .xlsx or .xls, up to 5 MB.",
    t2: "Headers: keep a clear header row on top — no merged cells.",
    t3: "Values: dates and marks as plain text work best.",
    t4: "No file? Grab the",
    sample: "sample class list",
    back: "← Back to app",
  },
  ar: {
    hero1: "حوّل قائمة الفصل إلى مجموعة ملفات PDF.",
    herop: "ارفع جدولاً واحداً، اختر مستنداً، وينشئ DocForge ملف PDF لكل طالب — في ملف ZIP واحد. بدون تثبيت، بدون حساب.",
    cta: "ابدأ إنشاء المستندات",
    howH: "كيف يعمل", howSub: "ثلاث خطوات من البداية للنهاية.",
    tplH: "عشرة قوالب جاهزة", tplSub: "نوع مستند واحد لكل بطاقة.",
    featH: "ماذا يمكنه أن يفعل", featSub: "كل شيء اختياري — استخدم ما تحتاجه.",
    dataH: "تجهيز جدولك", dataSub: "صف ترويسة واحد، وطالب واحد لكل صف. هذا كل شيء.",
    qH: "أسئلة", fixH: "إذا حدث خطأ",
    ctaH: "جاهز؟", ctaBtn: "افتح DocForge",
    cName: "الاسم", cAward: "الجائزة", cTeacher: "المعلم",
    cap: "كل صف ← ملف PDF · كل عمود ← حقل تربطه",
    t1: "الصيغ: ‎.csv‎ أو ‎.xlsx‎ أو ‎.xls‎، حتى 5 ميجابايت.",
    t2: "الترويسة: أبقِ صف ترويسة واضحاً في الأعلى — بدون خلايا مدمجة.",
    t3: "القيم: التواريخ والدرجات كنص عادي أفضل.",
    t4: "لا يوجد ملف؟ احصل على",
    sample: "قائمة فصل نموذجية",
    back: "→ العودة للتطبيق",
  },
};

const NAV = [
  { id: "how", en: "How it works", ar: "كيف يعمل" },
  { id: "templates", en: "Templates", ar: "القوالب" },
  { id: "features", en: "Features", ar: "المزايا" },
  { id: "data", en: "Your spreadsheet", ar: "جدولك" },
  { id: "faq", en: "FAQ", ar: "الأسئلة" },
  { id: "fix", en: "Fixes", ar: "حلول" },
];

const STEPS = [
  { ic: IC.pick, en: { t: "Choose a template", d: "Pick the document you want — certificate, report, receipt, ID card, letter." }, ar: { t: "اختر قالباً", d: "اختر المستند الذي تريده — شهادة، تقرير، إيصال، بطاقة هوية، خطاب." } },
  { ic: IC.upload, en: { t: "Upload & map", d: "Drop your CSV/Excel list. DocForge auto-matches columns to fields; tweak as needed and watch the live preview." }, ar: { t: "ارفع واربط", d: "أفلت قائمة CSV/Excel. يطابق DocForge الأعمدة بالحقول تلقائياً؛ عدّل كما تريد وشاهد المعاينة الحية." } },
  { ic: IC.bolt, en: { t: "Generate", d: "Click generate. Every row becomes a PDF, bundled into one ZIP — one document per student." }, ar: { t: "الإنشاء", d: "انقر إنشاء. يصبح كل صف ملف PDF، مجمّعة في ملف ZIP واحد — مستند لكل طالب." } },
];

const TEMPLATES = [
  { g: { en: "Certificates", ar: "شهادات" }, ic: IC.cert, en: { t: "Classic certificate", d: "Award certificate, A4 landscape" }, ar: { t: "شهادة كلاسيكية", d: "شهادة تقدير، A4 أفقي" } },
  { g: { en: "Reports", ar: "تقارير" }, ic: IC.report, en: { t: "Progress report", d: "Per-subject marks + comment" }, ar: { t: "تقرير الأداء", d: "درجات المواد + ملاحظة" } },
  { g: { en: "Finance", ar: "مالية" }, ic: IC.receipt, en: { t: "Fee receipt", d: "Paid / balance receipt" }, ar: { t: "إيصال رسوم", d: "إيصال المدفوع / الرصيد" } },
  { g: { en: "Cards", ar: "بطاقات" }, ic: IC.id, en: { t: "Student ID card", d: "Photo + scannable QR" }, ar: { t: "بطاقة هوية الطالب", d: "صورة + رمز QR" } },
  { g: { en: "Cards", ar: "بطاقات" }, ic: IC.book, en: { t: "Library card", d: "Photo + QR member card" }, ar: { t: "بطاقة المكتبة", d: "بطاقة عضوية بصورة + QR" } },
  { g: { en: "Cards", ar: "بطاقات" }, ic: IC.door, en: { t: "Hall pass", d: "Corridor pass, landscape" }, ar: { t: "تصريح مرور", d: "تصريح ممرات، أفقي" } },
  { g: { en: "Letters", ar: "خطابات" }, ic: IC.calendar, en: { t: "Attendance letter", d: "Attendance notice home" }, ar: { t: "خطاب الحضور", d: "إشعار حضور للأهل" } },
  { g: { en: "Letters", ar: "خطابات" }, ic: IC.badge, en: { t: "Enrollment confirmation", d: "Admission confirmation" }, ar: { t: "تأكيد التسجيل", d: "تأكيد قبول" } },
  { g: { en: "Letters", ar: "خطابات" }, ic: IC.clipboard, en: { t: "Permission slip", d: "Consent + parent signature" }, ar: { t: "إذن مشاركة", d: "موافقة + توقيع ولي الأمر" } },
  { g: { en: "Letters", ar: "خطابات" }, ic: IC.refstar, en: { t: "Reference letter", d: "Recommendation letter" }, ar: { t: "خطاب توصية", d: "خطاب توصية" } },
];

const FEATURES = [
  { ic: IC.list, en: { t: "Smart column mapping", d: "Auto-matches your spreadsheet headers to the right fields. Adjust any with a dropdown." }, ar: { t: "ربط الأعمدة الذكي", d: "يطابق ترويسات جدولك بالحقول الصحيحة تلقائياً. عدّل أياً منها من القائمة." } },
  { ic: IC.eye, en: { t: "Live preview", d: "See the first record render as you map. Flip through every student with ◀ ▶." }, ar: { t: "معاينة حية", d: "شاهد أول سجل أثناء الربط. تنقّل بين الطلاب بـ ◀ ▶." } },
  { ic: IC.palette, en: { t: "Your branding", d: "Add a logo, accent colour, signature and school name. Saved in your browser for next time." }, ar: { t: "هويتك", d: "أضف شعاراً ولوناً مميزاً وتوقيعاً واسم المدرسة. محفوظة في متصفحك للمرة القادمة." } },
  { ic: IC.image, en: { t: "Student photos", d: "Add a Photo URL column to put a photo on ID & library cards." }, ar: { t: "صور الطلاب", d: "أضف عمود رابط الصورة لوضع صورة على بطاقات الهوية والمكتبة." } },
  { ic: IC.report, en: { t: "Flexible subjects", d: "On report cards, tick which columns are marks — each becomes a subject row." }, ar: { t: "مواد مرنة", d: "في التقارير، حدّد أعمدة الدرجات — يصبح كل منها صف مادة." } },
  { ic: IC.pencil, en: { t: "Edit a record inline", d: "Fix a typo right in the preview without re-uploading. The change is included when you generate." }, ar: { t: "تعديل سجل مباشرة", d: "صحّح خطأً مطبعياً في المعاينة دون إعادة رفع. يُدرج التعديل عند الإنشاء." } },
  { ic: IC.tag, en: { t: "Filename patterns", d: "Name files your way — {student_name}-{class_name}. Click tokens to insert them." }, ar: { t: "أنماط أسماء الملفات", d: "سمِّ الملفات كما تريد — ‎{student_name}-{class_name}‎. انقر الرموز لإدراجها." } },
  { ic: IC.shield, en: { t: "Pre-flight checks", d: "Warns about blank required fields or duplicate names before you generate." }, ar: { t: "فحص مسبق", d: "ينبّه للحقول المطلوبة الفارغة أو الأسماء المكررة قبل الإنشاء." } },
  { ic: IC.stack, en: { t: "Whole grades at once", d: "Hundreds of students handled in small batches with a progress bar — no timeouts." }, ar: { t: "صفوف كاملة دفعة واحدة", d: "مئات الطلاب على دفعات صغيرة مع شريط تقدّم — بدون انقطاع." } },
  { ic: IC.qr, en: { t: "QR codes", d: "ID & library cards get a scannable QR code built from the ID automatically." }, ar: { t: "رموز QR", d: "تحصل بطاقات الهوية والمكتبة على رمز QR قابل للمسح من الرقم تلقائياً." } },
  { ic: IC.type, en: { t: "Document fonts", d: "Pick Classic, Modern or Typewriter to match your school's look. Arabic always uses its own font." }, ar: { t: "خطوط المستند", d: "اختر كلاسيكي أو حديث أو آلة كاتبة لتناسب هوية مدرستك. العربية تستخدم خطها الخاص دائماً." } },
  { ic: IC.grid4, en: { t: "Print sheets", d: "For cards, print 2, 4 or 10 per A4 page with cut guides — a whole class set in one PDF." }, ar: { t: "أوراق الطباعة", d: "للبطاقات، اطبع 2 أو 4 أو 10 لكل ورقة A4 مع علامات القص — فصل كامل في ملف PDF واحد." } },
  { ic: IC.tedit, en: { t: "Custom wording", d: "Rewrite the fixed text printed on any document — titles, captions, signature labels." }, ar: { t: "صياغة مخصصة", d: "أعد كتابة النص الثابت المطبوع على أي مستند — العناوين والتسميات وعناوين التوقيع." } },
];

const FAQ = [
  { en: { q: "Do I need an account?", a: "No. There's nothing to install and no sign-up — just open it and go." }, ar: { q: "هل أحتاج حساباً؟", a: "لا. لا يوجد ما يُثبَّت ولا تسجيل — فقط افتحه وابدأ." } },
  { en: { q: "Is my class list stored anywhere?", a: "Your file is sent to the server only to build the PDFs, then handed back to your browser. It isn't kept after your documents are made." }, ar: { q: "هل تُحفظ قائمة فصلي في مكان ما؟", a: "يُرسَل ملفك إلى الخادم فقط لإنشاء ملفات PDF ثم يُعاد إلى متصفحك. لا يُحتفظ به بعد إنشاء مستنداتك." } },
  { en: { q: "What files can I upload?", a: "CSV (.csv) and Excel (.xlsx, .xls), up to 5 MB. A class list is tiny — well under that." }, ar: { q: "ما الملفات التي يمكنني رفعها؟", a: "CSV و Excel‏ (‎.csv، .xlsx، .xls)، حتى 5 ميجابايت. قائمة الفصل صغيرة جداً — أقل بكثير." } },
  { en: { q: "Can I use my school's logo and colours?", a: "Yes — the Branding panel takes a logo, accent colour, signature and school name. Click ‘Save as default’ to reuse them." }, ar: { q: "هل يمكنني استخدام شعار مدرستي وألوانها؟", a: "نعم — لوحة الهوية تأخذ شعاراً ولوناً مميزاً وتوقيعاً واسم المدرسة. انقر ’حفظ كافتراضي‘ لإعادة استخدامها." } },
  { en: { q: "How many students at once?", a: "Hundreds are fine. DocForge generates in small batches with a progress bar, so big grades don't time out." }, ar: { q: "كم طالباً دفعة واحدة؟", a: "المئات لا مشكلة. يُنشئ DocForge على دفعات صغيرة مع شريط تقدّم، فلا تنقطع الصفوف الكبيرة." } },
  { en: { q: "Can I download just one PDF?", a: "Yes. In the preview, use ‘Download this one’ to save only the current record." }, ar: { q: "هل يمكنني تنزيل ملف PDF واحد فقط؟", a: "نعم. في المعاينة، استخدم ’تنزيل هذا فقط‘ لحفظ السجل الحالي فقط." } },
  { en: { q: "How do photos on ID cards work?", a: "Add a column of direct image links (a public .png/.jpg URL per student) and map it to Photo URL." }, ar: { q: "كيف تعمل الصور على بطاقات الهوية؟", a: "أضف عموداً بروابط صور مباشرة (رابط ‎.png/.jpg‎ عام لكل طالب) واربطه بحقل رابط الصورة." } },
  { en: { q: "Can I print many cards on one page?", a: "Yes — for ID, library and hall-pass cards, choose 2, 4 or 10 per page under ‘Cards per page’. You get one PDF with cut guides to print and trim." }, ar: { q: "هل يمكنني طباعة عدة بطاقات في صفحة واحدة؟", a: "نعم — لبطاقات الهوية والمكتبة وتصاريح المرور، اختر 2 أو 4 أو 10 لكل صفحة من ’بطاقات لكل صفحة‘. تحصل على ملف PDF واحد مع علامات قص للطباعة والقص." } },
  { en: { q: "Can I change the fonts or wording?", a: "Yes. Pick a font under Branding (Classic / Modern / Typewriter), and use the Wording panel to rewrite any printed label — per template and per language." }, ar: { q: "هل يمكنني تغيير الخطوط أو الصياغة؟", a: "نعم. اختر خطاً من قسم الهوية (كلاسيكي / حديث / آلة كاتبة)، واستخدم لوحة الصياغة لإعادة كتابة أي نص مطبوع — لكل قالب ولكل لغة." } },
];

const FIXES = [
  { en: { p: "Upload failed / can't read the file", f: "Check it's a .csv/.xlsx/.xls under 5 MB and has a header row on top." }, ar: { p: "فشل الرفع / تعذّرت قراءة الملف", f: "تأكد أنه ‎.csv/.xlsx/.xls‎ أقل من 5 ميجابايت وبه صف ترويسة في الأعلى." } },
  { en: { p: "Continue button is greyed out", f: "Map every required field — they're marked with a gold ★." }, ar: { p: "زر المتابعة معطّل", f: "اربط كل حقل مطلوب — مميّز بنجمة ذهبية ★." } },
  { en: { p: "Preview is empty", f: "Map the name field; the preview needs it to render a record." }, ar: { p: "المعاينة فارغة", f: "اربط حقل الاسم؛ تحتاجه المعاينة لعرض السجل." } },
  { en: { p: "Logo or signature rejected", f: "Use a PNG or JPG under 600 KB." }, ar: { p: "رُفض الشعار أو التوقيع", f: "استخدم PNG أو JPG أقل من 600 كيلوبايت." } },
  { en: { p: "Marks missing on the report", f: "Tick the subject columns in the Subjects section." }, ar: { p: "الدرجات مفقودة في التقرير", f: "حدّد أعمدة المواد في قسم المواد." } },
  { en: { p: "Photo not showing on the card", f: "Use a direct public PNG/JPG link (not a page that needs a login)." }, ar: { p: "الصورة لا تظهر على البطاقة", f: "استخدم رابط ‎PNG/JPG‎ عاماً مباشراً (وليس صفحة تتطلب تسجيل دخول)." } },
];

export default function HelpPage() {
  const { lang } = useI18n();
  const s = L[lang];
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
        <div className="hdr-actions">
          <LangToggle />
          <a className="back" href="/">
            {s.back}
          </a>
        </div>
      </div>

      <section className="ig-hero">
        <div className="ig-hero-tx">
          <h1>{s.hero1}</h1>
          <p>{s.herop}</p>
          <a className="btn" href="/">
            {s.cta}
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

      <nav className="chipnav">
        {NAV.map((n) => (
          <a key={n.id} href={`#${n.id}`} className={active === n.id ? "on" : ""}>
            {pick(n, lang)}
          </a>
        ))}
      </nav>

      <section id="how" className="ig-sec">
        <h2 className="ig-h2">{s.howH}</h2>
        <p className="ig-sub">{s.howSub}</p>
        <div className="ig-steps">
          {STEPS.map((st, i) => {
            const c = pick(st, lang);
            return (
              <div className="ig-step" key={i}>
                <div className="ig-step-n">{i + 1}</div>
                <div className="ig-step-ic">{st.ic}</div>
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="templates" className="ig-sec">
        <h2 className="ig-h2">{s.tplH}</h2>
        <p className="ig-sub">{s.tplSub}</p>
        <div className="ig-tiles">
          {TEMPLATES.map((tp, i) => {
            const c = pick(tp, lang);
            return (
              <div className="ig-tile" key={i}>
                <div className="ig-tile-ic">{tp.ic}</div>
                <div className="ig-tile-tx">
                  <span className="ig-tile-g">{pick(tp.g, lang)}</span>
                  <h4>{c.t}</h4>
                  <p>{c.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="features" className="ig-sec">
        <h2 className="ig-h2">{s.featH}</h2>
        <p className="ig-sub">{s.featSub}</p>
        <div className="ig-feats">
          {FEATURES.map((f, i) => {
            const c = pick(f, lang);
            return (
              <div className="ig-feat" key={i}>
                <div className="ig-feat-ic">{f.ic}</div>
                <h4>{c.t}</h4>
                <p>{c.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="data" className="ig-sec">
        <h2 className="ig-h2">{s.dataH}</h2>
        <p className="ig-sub">{s.dataSub}</p>
        <div className="ig-data">
          <div className="ig-mini">
            <table>
              <thead>
                <tr><th>{s.cName}</th><th>{s.cAward}</th><th>{s.cTeacher}</th></tr>
              </thead>
              <tbody>
                <tr><td>Maya Thompson</td><td>For Excellence</td><td>Ms. Rivera</td></tr>
                <tr><td>Aiden Park</td><td>Outstanding Effort</td><td>Ms. Rivera</td></tr>
              </tbody>
            </table>
            <span className="ig-cap">{s.cap}</span>
          </div>
          <ul className="ig-tips">
            <li>{s.t1}</li>
            <li>{s.t2}</li>
            <li>{s.t3}</li>
            <li>
              {s.t4} <a href="/sample-class.csv" download>{s.sample}</a>.
            </li>
          </ul>
        </div>
      </section>

      <section id="faq" className="ig-sec">
        <h2 className="ig-h2">{s.qH}</h2>
        <div className="ig-faq">
          {FAQ.map((f, i) => {
            const c = pick(f, lang);
            return (
              <details key={i}>
                <summary>{c.q}</summary>
                <p>{c.a}</p>
              </details>
            );
          })}
        </div>
      </section>

      <section id="fix" className="ig-sec">
        <h2 className="ig-h2">{s.fixH}</h2>
        <div className="ig-fixes">
          {FIXES.map((x, i) => {
            const c = pick(x, lang);
            return (
              <div className="ig-fix" key={i}>
                <div className="ig-fix-p">{c.p}</div>
                <div className="ig-fix-f">{c.f}</div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="ig-cta">
        <h2>{s.ctaH}</h2>
        <a className="btn" href="/">{s.ctaBtn}</a>
      </div>
    </div>
  );
}
