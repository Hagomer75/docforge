"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n, LangToggle } from "./i18n";
import { FIELD_I18N, GROUP_I18N, TEMPLATE_I18N, fmt } from "@/lib/i18n";
import type { DocFont } from "@/lib/templates";
import { EDITABLE_LABELS, docLabels } from "@/lib/doclabels";

const FONTS: DocFont[] = ["classic", "modern", "typewriter"];
const CARD_SLUGS = new Set(["student-id-card", "library-card", "hall-pass"]);

type Field = { key: string; label: string; required: boolean };
type Template = {
  slug: string;
  name: string;
  description: string;
  fields: Field[];
  subjects?: boolean;
  qrField?: string;
  group?: string;
};
type Upload = {
  filename: string;
  columns: string[];
  rows: Record<string, string>[];
  rowCount: number;
};
type LogoPos = "left" | "center" | "right";
type Branding = {
  schoolName: string;
  accent: string;
  logoDataUrl: string | null;
  logoPos: LogoPos;
  signatureDataUrl: string | null;
  font: DocFont;
};

const BATCH_SIZE = 25;
const DEFAULT_ACCENT = "#2F6F6A";
const PRESET_KEY = "docforge:branding";
const EMPTY_BRANDING: Branding = {
  schoolName: "",
  accent: DEFAULT_ACCENT,
  logoDataUrl: null,
  logoPos: "center",
  signatureDataUrl: null,
  font: "classic",
};

function autoGuess(template: Template, columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const f of template.fields) {
    const head = f.key.split("_")[0];
    const labelWords = f.label.toLowerCase().split(/\s+/);
    const guess = columns.find((c) => {
      const lc = c.toLowerCase();
      return lc.includes(head) || labelWords.some((w) => w.length > 2 && lc.includes(w));
    });
    if (guess) mapping[f.key] = guess;
  }
  return mapping;
}

function b64toBlob(b64: string, type = "application/pdf"): Blob {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type });
}

function readImage(
  file: File,
  onOk: (dataUrl: string) => void,
  onErr: (msg: string) => void,
  msgs: { type: string; size: string }
) {
  if (!/\.(png|jpe?g)$/i.test(file.name)) return onErr(msgs.type);
  if (file.size > 600 * 1024) return onErr(msgs.size);
  const reader = new FileReader();
  reader.onload = () => onOk(reader.result as string);
  reader.readAsDataURL(file);
}

const I = (paths: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  "certificate-classic": I(
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13l-1.5 7L12 18l4.5 2L15 13" />
    </>
  ),
  "progress-report": I(
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  "fee-receipt": I(
    <>
      <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3z" />
      <path d="M9.5 8h5M9.5 12h5" />
    </>
  ),
  "student-id-card": I(
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="8" cy="11" r="2" />
      <path d="M6 15.5c.7-1.2 3.3-1.2 4 0M14 10h4M14 13h3" />
    </>
  ),
  "attendance-letter": I(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
      <path d="M8.5 15l2 2 4-4" />
    </>
  ),
  "enrollment-confirmation": I(
    <>
      <path d="M12 3l2.5 1.8 3-.2 1 2.9 2.4 1.7-1 2.8 1 2.8-2.4 1.7-1 2.9-3-.2L12 21l-2.5-1.8-3 .2-1-2.9L3.1 14l1-2.8-1-2.8 2.4-1.7 1-2.9 3 .2z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  "library-card": I(
    <>
      <path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2z" />
      <path d="M8 3v16" />
    </>
  ),
  "hall-pass": I(
    <>
      <rect x="4" y="3" width="9" height="18" rx="1" />
      <circle cx="10" cy="12" r="1" />
      <path d="M15 12h6M18 9l3 3-3 3" />
    </>
  ),
  "permission-slip": I(
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
      <path d="M9 13l2 2 4-4" />
    </>
  ),
  "reference-letter": I(
    <>
      <path d="M7 3h7l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M14 3v4h4" />
      <path d="M11.5 11l.85 1.7 1.9.25-1.4 1.35.35 1.9-1.7-.9-1.7.9.35-1.9L8.75 13l1.9-.25z" />
    </>
  ),
};
const DEFAULT_ICON = I(<rect x="4" y="4" width="16" height="16" rx="2" />);

export default function Home() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [open, setOpen] = useState<1 | 2 | 3>(1);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [subjectCols, setSubjectCols] = useState<string[]>([]);
  const [branding, setBranding] = useState<Branding>(EMPTY_BRANDING);
  const [filenamePattern, setFilenamePattern] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [uploadErr, setUploadErr] = useState("");
  const [logoErr, setLogoErr] = useState("");
  const [sigErr, setSigErr] = useState("");
  const [presetMsg, setPresetMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [singleBusy, setSingleBusy] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState<1 | 2 | 4 | 10>(1);
  const [cutGuides, setCutGuides] = useState(true);
  const [labelOverrides, setLabelOverrides] = useState<{
    en: Record<string, string>;
    ar: Record<string, string>;
  }>({ en: {}, ar: {} });
  const [genProgress, setGenProgress] = useState<{ done: number; total: number } | null>(null);
  const [genMsg, setGenMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const sigInput = useRef<HTMLInputElement>(null);
  const { t, lang } = useI18n();

  // Localised labels for server-driven template/field data.
  const tn = (tp: Template) => (lang === "ar" ? TEMPLATE_I18N[tp.slug]?.ar.name ?? tp.name : tp.name);
  const td = (tp: Template) =>
    lang === "ar" ? TEMPLATE_I18N[tp.slug]?.ar.description ?? tp.description : tp.description;
  const tg = (g: string) => (lang === "ar" ? GROUP_I18N[g] ?? g : g);
  const tf = (f: Field) => (lang === "ar" ? FIELD_I18N[f.key] ?? f.label : f.label);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => setTemplates([]));
    // Restore a saved branding preset.
    try {
      const raw = localStorage.getItem(PRESET_KEY);
      if (raw) setBranding({ ...EMPTY_BRANDING, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    // Restore saved wording overrides.
    try {
      const raw = localStorage.getItem("docforge:labels");
      if (raw) {
        const p = JSON.parse(raw);
        setLabelOverrides({ en: p.en ?? {}, ar: p.ar ?? {} });
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist wording overrides as they change.
  useEffect(() => {
    try {
      localStorage.setItem("docforge:labels", JSON.stringify(labelOverrides));
    } catch {
      /* ignore */
    }
  }, [labelOverrides]);

  const nameKey = selected?.fields.find((f) => f.required)?.key ?? selected?.fields[0]?.key;
  const requiredReady =
    selected != null && selected.fields.filter((f) => f.required).every((f) => mapping[f.key]);
  const nameMapped =
    selected != null && selected.fields.some((f) => f.required && mapping[f.key]);

  // Pre-flight validation: blank required cells + duplicate name values.
  const issues = useMemo(() => {
    if (!selected || !upload) return { blanks: 0, dups: 0 };
    const reqFields = selected.fields.filter((f) => f.required && mapping[f.key]);
    let blanks = 0;
    for (const row of upload.rows) {
      if (reqFields.some((f) => !String(row[mapping[f.key]] ?? "").trim())) blanks++;
    }
    let dups = 0;
    if (nameKey && mapping[nameKey]) {
      const seen = new Map<string, number>();
      for (const row of upload.rows) {
        const k = String(row[mapping[nameKey]] ?? "").trim().toLowerCase();
        if (k) seen.set(k, (seen.get(k) ?? 0) + 1);
      }
      dups = [...seen.values()].filter((n) => n > 1).reduce((a, n) => a + n, 0);
    }
    return { blanks, dups };
  }, [selected, upload, mapping, nameKey]);

  // Template fields that have no column to map to (structural gap, not row data).
  const unmapped = useMemo(() => {
    const required: Field[] = [];
    const optional: Field[] = [];
    if (selected && upload) {
      for (const f of selected.fields) {
        if (!mapping[f.key]) (f.required ? required : optional).push(f);
      }
    }
    return { required, optional };
  }, [selected, upload, mapping]);

  // Live preview of the current record, debounced.
  useEffect(() => {
    if (!selected || !upload || !nameMapped) {
      setPreviewHtml("");
      return;
    }
    const idx = Math.min(previewIndex, upload.rows.length - 1);
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateSlug: selected.slug,
            mapping,
            subjectColumns: subjectCols,
            branding: brandingPayload(branding),
            row: upload.rows[idx],
            lang,
            labels: labelOverrides[lang],
          }),
        });
        const { html } = await r.json();
        setPreviewHtml(html ?? "");
      } catch {
        /* preview is best-effort */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [selected, upload, mapping, subjectCols, branding, nameMapped, previewIndex, lang, labelOverrides]);

  const handleFile = useCallback(
    async (file: File) => {
      setUploadErr("");
      const fd = new FormData();
      fd.append("file", file);
      try {
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await r.json();
        if (!r.ok) {
          setUploadErr(data.error || t("uploadFailed"));
          return;
        }
        setUpload(data);
        setMapping(selected ? autoGuess(selected, data.columns) : {});
        setSubjectCols([]);
        setPreviewIndex(0);
      } catch {
        setUploadErr(t("cantRead"));
      }
    },
    [selected]
  );

  // One-click: load the bundled sample through the same upload path.
  async function loadSample() {
    if (sampleBusy) return;
    setSampleBusy(true);
    try {
      const txt = await (await fetch("/sample-class.csv")).text();
      await handleFile(new File([txt], "sample-class.csv", { type: "text/csv" }));
    } catch {
      setUploadErr(t("cantRead"));
    } finally {
      setSampleBusy(false);
    }
  }

  function chooseTemplate(t: Template) {
    setSelected(t);
    if (upload) setMapping(autoGuess(t, upload.columns));
    setSubjectCols([]);
    setFilenamePattern("");
    setPreviewIndex(0);
    setCardsPerPage(1); // reset sheet mode when switching templates
    setOpen(2); // picking a template collapses panel 1 and opens upload & map
  }

  // Inline edit: overwrite the mapped cell of the current record only.
  function editCell(fieldKey: string, val: string) {
    if (!upload) return;
    const col = mapping[fieldKey];
    if (!col) return;
    const rows = upload.rows.map((r, i) =>
      i === previewIndex ? { ...r, [col]: val } : r
    );
    setUpload({ ...upload, rows });
  }

  function toggleSubject(col: string) {
    setSubjectCols((cur) =>
      cur.includes(col) ? cur.filter((c) => c !== col) : [...cur, col]
    );
  }

  function saveBrandingPreset() {
    try {
      localStorage.setItem(PRESET_KEY, JSON.stringify(branding));
      setPresetMsg(t("savedDefault"));
      setTimeout(() => setPresetMsg(""), 2500);
    } catch {
      setPresetMsg(t("couldNotSave"));
    }
  }
  function clearBrandingPreset() {
    try {
      localStorage.removeItem(PRESET_KEY);
    } catch {
      /* ignore */
    }
    setBranding(EMPTY_BRANDING);
    setPresetMsg(t("cleared"));
    setTimeout(() => setPresetMsg(""), 2500);
  }

  function buildBody(rows: Record<string, string>[], startIndex: number) {
    return {
      templateSlug: selected!.slug,
      mapping,
      subjectColumns: subjectCols,
      branding: brandingPayload(branding),
      filenamePattern,
      rows,
      startIndex,
      lang,
      cardsPerPage,
      cutGuides,
      labels: labelOverrides[lang],
    };
  }

  function setLabel(key: string, val: string) {
    setLabelOverrides((o) => ({ ...o, [lang]: { ...o[lang], [key]: val } }));
  }

  async function downloadCurrent() {
    if (!selected || !upload) return;
    setSingleBusy(true);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody([upload.rows[previewIndex]], previewIndex)),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed.");
      const { files } = (await r.json()) as { files: { name: string; data: string }[] };
      const f = files[0];
      const url = URL.createObjectURL(b64toBlob(f.data));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${f.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* surfaced via the batch flow normally; keep single-download quiet */
    } finally {
      setSingleBusy(false);
    }
  }

  async function generate() {
    if (!selected || !upload) return;
    setGenBusy(true);
    setGenMsg(null);
    setGenProgress({ done: 0, total: upload.rowCount });
    try {
      // Card sheet mode → one combined PDF (not a ZIP).
      if (isCard && cardsPerPage > 1) {
        if (upload.rowCount > 100) {
          setGenMsg({ text: t("sheetCap"), ok: false });
          return;
        }
        const r = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildBody(upload.rows, 0)),
        });
        if (!r.ok) throw new Error((await r.json()).error || t("genFailed"));
        const { files } = (await r.json()) as { files: { name: string; data: string }[] };
        const url = URL.createObjectURL(b64toBlob(files[0].data));
        const a = document.createElement("a");
        a.href = url;
        a.download = `docforge-${selected.slug}-sheet.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setGenMsg({ text: t("sheetDone"), ok: true });
        return;
      }

      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const used = new Map<string, number>();
      const rows = upload.rows;

      for (let start = 0; start < rows.length; start += BATCH_SIZE) {
        const batch = rows.slice(start, start + BATCH_SIZE);
        const r = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildBody(batch, start)),
        });
        if (!r.ok) {
          const e = await r.json();
          throw new Error(e.error || "Generation failed.");
        }
        const { files } = (await r.json()) as { files: { name: string; data: string }[] };
        for (const f of files) {
          let name = f.name;
          const n = used.get(name) ?? 0;
          used.set(name, n + 1);
          if (n > 0) name = `${name}-${n + 1}`;
          zip.file(`${selected.slug}/${name}.pdf`, f.data, { base64: true });
        }
        setGenProgress({ done: Math.min(start + batch.length, rows.length), total: rows.length });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `docforge-${selected.slug}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setGenMsg({ text: t("doneMsg", { n: upload.rowCount }), ok: true });
    } catch (err) {
      setGenMsg({ text: err instanceof Error ? err.message : t("genFailed"), ok: false });
    } finally {
      setGenBusy(false);
      setGenProgress(null);
    }
  }

  const mappedCols = new Set(Object.values(mapping).filter(Boolean));
  const recordTotal = upload?.rowCount ?? 0;
  const isCard = !!selected && CARD_SLUGS.has(selected.slug);
  const perPageOptions: (1 | 2 | 4 | 10)[] =
    selected?.slug === "hall-pass" ? [1, 2, 4] : [1, 2, 4, 10];
  const wordingKeys = selected ? EDITABLE_LABELS[selected.slug] ?? [] : [];
  const labelDefaults = docLabels(lang) as unknown as Record<string, string>;

  // Accordion: only one panel is expanded; the others collapse to a summary
  // header. A panel is reachable only once its prerequisites are met.
  function go(panel: 1 | 2 | 3) {
    if (panel === 2 && !selected) return;
    if (panel === 3 && !requiredReady) return;
    setOpen(panel);
  }

  return (
    <div className="wrap">
      <header>
        <div className="logo">
          Doc<span>Forge</span>
        </div>
        <span className="tag">{t("tagline")}</span>
        <div className="hdr-actions">
          <LangToggle />
          <a className="help-link" href="/help">
            {t("help")}
          </a>
        </div>
      </header>

      <div className="acc">
        {/* Panel 1 — choose template */}
        <div className={"panel" + (open === 1 ? " open" : "")}>
          <button className="phead" onClick={() => setOpen(1)}>
            <span className={"pnum" + (selected ? " done" : "")}>1</span>
            <span className="ptitle">{t("s1")}</span>
            {selected && open !== 1 && <span className="psum">{tn(selected)}</span>}
          </button>
          {open === 1 && (
            <div className="pbody">
              <p className="lede" style={{ marginTop: 0 }}>
                {t("pickLede")}
              </p>
              <div className="cards cards-grid">
                {templates.map((tp) => (
                  <div
                    key={tp.slug}
                    className={"tcard" + (selected?.slug === tp.slug ? " sel" : "")}
                    onClick={() => chooseTemplate(tp)}
                  >
                    <div className="tcard-ic">{TEMPLATE_ICONS[tp.slug] ?? DEFAULT_ICON}</div>
                    <div className="tcard-tx">
                      {tp.group && <span className="tcard-grp">{tg(tp.group)}</span>}
                      <h3>{tn(tp)}</h3>
                      <p>{td(tp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel 2 — upload & map */}
        <div className={"panel" + (open === 2 ? " open" : "") + (!selected ? " disabled" : "")}>
          <button className="phead" onClick={() => go(2)} disabled={!selected}>
            <span className={"pnum" + (requiredReady ? " done" : "")}>2</span>
            <span className="ptitle">{t("s2")}</span>
            {upload && open !== 2 && (
              <span className="psum">
                {upload.filename} · {upload.rowCount} {t("rowsDetected")}
              </span>
            )}
          </button>
          {open === 2 && selected && (
            <div className="pbody">
              <div className="two">
            <div className="box">
              <div
                className={"drop" + (upload || dragOver ? " has" : "")}
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                }}
              >
                {upload
                  ? `${upload.filename} — ${upload.rowCount} ${t("rowsDetected")}`
                  : t("dropHint")}
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  hidden
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  }}
                />
              </div>

              {!upload && (
                <button
                  className="btn"
                  style={{ width: "100%", marginTop: 8 }}
                  disabled={sampleBusy}
                  onClick={loadSample}
                >
                  {sampleBusy ? t("trySampleLoading") : t("trySample")}
                </button>
              )}

              {upload && (
                <div style={{ marginTop: 6 }}>
                  {selected.fields.map((f) => (
                    <div className="maprow" key={f.key}>
                      <label>
                        {tf(f)}
                        {f.required && <span className="req">*</span>}
                      </label>
                      <select
                        value={mapping[f.key] ?? ""}
                        onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                      >
                        <option value="">{t("chooseColumn")}</option>
                        {upload.columns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {upload && (unmapped.required.length > 0 || unmapped.optional.length > 0) && (
                <div className="nudge">
                  <div className="nudge-h">{t("nudgeTitle")}</div>
                  {unmapped.required.length > 0 && (
                    <div className="nudge-req">
                      {fmt(t("nudgeRequired"), {
                        fields: unmapped.required.map((f) => tf(f)).join(lang === "ar" ? "، " : ", "),
                      })}
                    </div>
                  )}
                  {unmapped.optional.length > 0 && (
                    <div className="nudge-opt">
                      {fmt(t("nudgeOptional"), {
                        fields: unmapped.optional.map((f) => tf(f)).join(lang === "ar" ? "، " : ", "),
                      })}
                    </div>
                  )}
                  <div className="nudge-hint">{t("nudgeHint")}</div>
                </div>
              )}

              {upload && (issues.blanks > 0 || issues.dups > 0) && (
                <div className="warn">
                  {issues.blanks > 0 && (
                    <div>⚠ {issues.blanks} {t("warnBlank")}</div>
                  )}
                  {issues.dups > 0 && (
                    <div>⚠ {issues.dups} {t("warnDup")}</div>
                  )}
                </div>
              )}

              {upload && selected.subjects && (
                <div className="section">
                  <div className="section-h">{t("subjects")}</div>
                  <p className="hint" style={{ marginTop: 0 }}>
                    {t("subjectsHint")}
                  </p>
                  <div className="chips">
                    {upload.columns
                      .filter((c) => !mappedCols.has(c))
                      .map((c) => (
                        <label key={c} className={"chip" + (subjectCols.includes(c) ? " on" : "")}>
                          <input
                            type="checkbox"
                            checked={subjectCols.includes(c)}
                            onChange={() => toggleSubject(c)}
                          />
                          {c}
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {upload && (
                <div className="section">
                  <div className="section-h">
                    {t("branding")}
                    <span className="section-act">
                      <button className="link" onClick={saveBrandingPreset}>
                        {t("saveDefault")}
                      </button>
                      <button className="link" onClick={clearBrandingPreset}>
                        {t("clear")}
                      </button>
                    </span>
                  </div>
                  <div className="maprow">
                    <label>{t("schoolName")}</label>
                    <input
                      className="text"
                      type="text"
                      placeholder="Springfield Elementary"
                      value={branding.schoolName}
                      onChange={(e) => setBranding((b) => ({ ...b, schoolName: e.target.value }))}
                    />
                  </div>
                  <div className="maprow">
                    <label>{t("accent")}</label>
                    <input
                      type="color"
                      value={branding.accent}
                      onChange={(e) => setBranding((b) => ({ ...b, accent: e.target.value }))}
                    />
                  </div>
                  <div className="maprow">
                    <label>{t("logo")}</label>
                    <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                      <button className="btn ghost small" onClick={() => logoInput.current?.click()}>
                        {branding.logoDataUrl ? t("change") : t("upload")}
                      </button>
                      {branding.logoDataUrl && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="logo-prev" src={branding.logoDataUrl} alt="logo" />
                          <button
                            className="btn ghost small"
                            onClick={() => setBranding((b) => ({ ...b, logoDataUrl: null }))}
                          >
                            {t("remove")}
                          </button>
                        </>
                      )}
                      <input
                        ref={logoInput}
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        hidden
                        onChange={(e) => {
                          if (e.target.files?.[0])
                            readImage(
                              e.target.files[0],
                              (d) => {
                                setLogoErr("");
                                setBranding((b) => ({ ...b, logoDataUrl: d }));
                              },
                              setLogoErr,
                              { type: t("imgErr"), size: t("imgBig") }
                            );
                        }}
                      />
                    </div>
                  </div>
                  {logoErr && <div className="msg err">{logoErr}</div>}
                  <div className="maprow">
                    <label>{t("signature")}</label>
                    <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                      <button className="btn ghost small" onClick={() => sigInput.current?.click()}>
                        {branding.signatureDataUrl ? t("change") : t("upload")}
                      </button>
                      {branding.signatureDataUrl && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="logo-prev" src={branding.signatureDataUrl} alt="signature" />
                          <button
                            className="btn ghost small"
                            onClick={() => setBranding((b) => ({ ...b, signatureDataUrl: null }))}
                          >
                            {t("remove")}
                          </button>
                        </>
                      )}
                      <input
                        ref={sigInput}
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        hidden
                        onChange={(e) => {
                          if (e.target.files?.[0])
                            readImage(
                              e.target.files[0],
                              (d) => {
                                setSigErr("");
                                setBranding((b) => ({ ...b, signatureDataUrl: d }));
                              },
                              setSigErr,
                              { type: t("imgErr"), size: t("imgBig") }
                            );
                        }}
                      />
                    </div>
                  </div>
                  {sigErr && <div className="msg err">{sigErr}</div>}
                  <div className="maprow">
                    <label>{t("fontStyle")}</label>
                    <div className="seg" style={{ flex: 1 }}>
                      {FONTS.map((f) => (
                        <button
                          key={f}
                          className={"seg-btn" + (branding.font === f ? " on" : "")}
                          onClick={() => setBranding((b) => ({ ...b, font: f }))}
                        >
                          {t(("font_" + f) as Parameters<typeof t>[0])}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="hint" style={{ marginTop: 0 }}>
                    {t("fontHint")}
                  </p>
                  {selected.slug === "certificate-classic" && (
                    <div className="maprow">
                      <label>{t("headerPos")}</label>
                      <div className="seg" style={{ flex: 1 }}>
                        {(["left", "center", "right"] as LogoPos[]).map((p) => (
                          <button
                            key={p}
                            className={"seg-btn" + (branding.logoPos === p ? " on" : "")}
                            onClick={() => setBranding((b) => ({ ...b, logoPos: p }))}
                          >
                            {p === "left" ? t("posLeft") : p === "center" ? t("posCenter") : t("posRight")}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {presetMsg && <div className="msg ok">{presetMsg}</div>}
                </div>
              )}

              {upload && isCard && (
                <div className="section">
                  <div className="section-h">{t("cardsPerPage")}</div>
                  <p className="hint" style={{ marginTop: 0, marginBottom: 8 }}>
                    {t("cardsHint")}
                  </p>
                  <div className="seg" style={{ maxWidth: 280 }}>
                    {perPageOptions.map((n) => (
                      <button
                        key={n}
                        className={"seg-btn" + (cardsPerPage === n ? " on" : "")}
                        onClick={() => setCardsPerPage(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {cardsPerPage > 1 && (
                    <label className="chip" style={{ marginTop: 12 }}>
                      <input
                        type="checkbox"
                        checked={cutGuides}
                        onChange={(e) => setCutGuides(e.target.checked)}
                      />
                      {t("cutGuides")}
                    </label>
                  )}
                  <p className="hint" style={{ marginTop: 8 }}>
                    {t("sheetHint")}
                  </p>
                </div>
              )}

              {upload && wordingKeys.length > 0 && (
                <div className="section">
                  <div className="section-h">
                    {t("wording")}
                    <span className="section-act">
                      <button
                        className="link"
                        onClick={() => setLabelOverrides((o) => ({ ...o, [lang]: {} }))}
                      >
                        {t("wordingReset")}
                      </button>
                    </span>
                  </div>
                  <p className="hint" style={{ marginTop: 0 }}>
                    {t("wordingHint")}
                  </p>
                  {wordingKeys.map((k) => (
                    <div className="maprow" key={k}>
                      <label className="wlabel">{labelDefaults[k]}</label>
                      <input
                        className="text"
                        type="text"
                        placeholder={labelDefaults[k]}
                        value={labelOverrides[lang][k] ?? ""}
                        onChange={(e) => setLabel(k, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {uploadErr && <div className="msg err">{uploadErr}</div>}
              {!upload && (
                <div className="hint">
                  {t("noFile")}{" "}
                  <a href="/sample-class.csv" download>
                    {t("sampleList")}
                  </a>{" "}
                  {t("orTry")}{" "}
                  <button className="link" disabled={sampleBusy} onClick={loadSample}>
                    {sampleBusy ? t("trySampleLoading") : t("trySample")}
                  </button>
                  .
                </div>
              )}
            </div>

            <div>
              {previewHtml && (
                <div className="pvbar">
                  {recordTotal > 1 && (
                    <>
                      <button
                        className="pvnav"
                        disabled={previewIndex === 0}
                        onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                      >
                        ◀
                      </button>
                      <span className="pvcount">
                        {t("recordOf", { i: previewIndex + 1, n: recordTotal })}
                      </span>
                      <button
                        className="pvnav"
                        disabled={previewIndex >= recordTotal - 1}
                        onClick={() => setPreviewIndex((i) => Math.min(recordTotal - 1, i + 1))}
                      >
                        ▶
                      </button>
                    </>
                  )}
                  <div className="pvactions">
                    <button
                      className={"btn ghost small" + (editing ? " on" : "")}
                      onClick={() => setEditing((e) => !e)}
                    >
                      {editing ? t("doneEditing") : t("editFields")}
                    </button>
                    <button className="btn ghost small" disabled={singleBusy} onClick={downloadCurrent}>
                      {singleBusy ? "…" : t("downloadOne")}
                    </button>
                  </div>
                </div>
              )}
              <div className="preview-frame">
                {previewHtml ? (
                  <iframe title="preview" srcDoc={previewHtml} />
                ) : (
                  <div className="empty">{t("previewEmpty")}</div>
                )}
              </div>
              {editing && previewHtml && upload && (
                <div className="editbox">
                  <div className="section-h">{t("editRecord")}</div>
                  {selected.fields
                    .filter((f) => mapping[f.key])
                    .map((f) => (
                      <div className="maprow" key={f.key}>
                        <label>{tf(f)}</label>
                        <input
                          className="text"
                          type="text"
                          value={upload.rows[previewIndex]?.[mapping[f.key]] ?? ""}
                          onChange={(e) => editCell(f.key, e.target.value)}
                        />
                      </div>
                    ))}
                  <p className="hint" style={{ marginTop: 8 }}>
                    {t("editNote")}
                  </p>
                </div>
              )}
            </div>
          </div>
              <div className="bar">
                <button className="btn ghost" onClick={() => setOpen(1)}>
                  {t("back")}
                </button>
                <button className="btn" disabled={!requiredReady} onClick={() => go(3)}>
                  {t("cont")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panel 3 — generate */}
        <div className={"panel" + (open === 3 ? " open" : "") + (!requiredReady ? " disabled" : "")}>
          <button className="phead" onClick={() => go(3)} disabled={!requiredReady}>
            <span className="pnum">3</span>
            <span className="ptitle">{t("s3")}</span>
          </button>
          {open === 3 && selected && upload && (
            <div className="pbody">
              <p className="lede" style={{ marginTop: 0 }}>
                {t("readyTo", { n: upload.rowCount, name: tn(selected) })}
              </p>
              <div className="box" style={{ maxWidth: 560 }}>
            <div className="meta">
              {t("template")}: {tn(selected)} · {t("rows")}: {upload.rowCount} · {t("source")}: {upload.filename}
              {selected.subjects && ` · ${t("subjects")}: ${subjectCols.length}`}
              {branding.schoolName && ` · ${branding.schoolName}`}
            </div>
            {isCard && cardsPerPage > 1 && (
              <div className="msg ok" style={{ marginTop: 0 }}>
                {t("sheetSummary", { n: cardsPerPage })}
              </div>
            )}

            {(issues.blanks > 0 || issues.dups > 0) && (
              <div className="warn">
                {issues.blanks > 0 && <div>⚠ {issues.blanks} {t("warnBlank")}</div>}
                {issues.dups > 0 && <div>⚠ {issues.dups} {t("warnDup")}</div>}
              </div>
            )}

            <div className="section" style={{ marginTop: 14 }}>
              <div className="section-h">{t("filename")}</div>
              <input
                className="text"
                type="text"
                style={{ width: "100%" }}
                placeholder={`{${nameKey ?? "name"}}`}
                value={filenamePattern}
                onChange={(e) => setFilenamePattern(e.target.value)}
              />
              <div className="hint" style={{ marginTop: 6 }}>
                {t("tokens")}{" "}
                {selected.fields.map((f) => (
                  <button
                    key={f.key}
                    className="token"
                    onClick={() => setFilenamePattern((p) => p + `{${f.key}}`)}
                  >
                    {`{${f.key}}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="bar">
              <button className="btn ghost" onClick={() => setOpen(2)} disabled={genBusy}>
                {t("back")}
              </button>
              <button className="btn" disabled={genBusy} onClick={generate}>
                {genBusy && <span className="spin" />}
                {genBusy
                  ? genProgress
                    ? `${t("generating")} ${genProgress.done}/${genProgress.total}…`
                    : t("geningDots")
                  : t("genBtn")}
              </button>
            </div>
            {genProgress && (
              <div className="progress">
                <div
                  className="progress-bar"
                  style={{ width: `${Math.round((genProgress.done / genProgress.total) * 100)}%` }}
                />
              </div>
            )}
                {genMsg && <div className={"msg " + (genMsg.ok ? "ok" : "err")}>{genMsg.text}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Only send branding fields that are actually set.
function brandingPayload(b: Branding) {
  const out: {
    schoolName?: string;
    accent?: string;
    logoDataUrl?: string;
    logoPos?: LogoPos;
    signatureDataUrl?: string;
    font?: DocFont;
  } = {};
  if (b.schoolName.trim()) out.schoolName = b.schoolName.trim();
  if (b.accent && b.accent.toLowerCase() !== DEFAULT_ACCENT.toLowerCase()) out.accent = b.accent;
  if (b.logoDataUrl) {
    out.logoDataUrl = b.logoDataUrl;
    out.logoPos = b.logoPos;
  }
  if (b.signatureDataUrl) out.signatureDataUrl = b.signatureDataUrl;
  if (b.font && b.font !== "classic") out.font = b.font;
  return out;
}
