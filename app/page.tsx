"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  onErr: (msg: string) => void
) {
  if (!/\.(png|jpe?g)$/i.test(file.name)) return onErr("Must be a PNG or JPG.");
  if (file.size > 600 * 1024) return onErr("Must be under 600 KB.");
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  "enrollment-confirmation": I(
    <>
      <path d="M12 3l2.5 1.8 3-.2 1 2.9 2.4 1.7-1 2.8 1 2.8-2.4 1.7-1 2.9-3-.2L12 21l-2.5-1.8-3 .2-1-2.9L3.1 14l1-2.8-1-2.8 2.4-1.7 1-2.9 3 .2z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
};
const DEFAULT_ICON = I(<rect x="4" y="4" width="16" height="16" rx="2" />);

export default function Home() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
  const [genProgress, setGenProgress] = useState<{ done: number; total: number } | null>(null);
  const [genMsg, setGenMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const sigInput = useRef<HTMLInputElement>(null);

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
  }, []);

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
          }),
        });
        const { html } = await r.json();
        setPreviewHtml(html ?? "");
      } catch {
        /* preview is best-effort */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [selected, upload, mapping, subjectCols, branding, nameMapped, previewIndex]);

  const handleFile = useCallback(
    async (file: File) => {
      setUploadErr("");
      const fd = new FormData();
      fd.append("file", file);
      try {
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await r.json();
        if (!r.ok) {
          setUploadErr(data.error || "Upload failed.");
          return;
        }
        setUpload(data);
        setMapping(selected ? autoGuess(selected, data.columns) : {});
        setSubjectCols([]);
        setPreviewIndex(0);
      } catch {
        setUploadErr("Could not read that file.");
      }
    },
    [selected]
  );

  function chooseTemplate(t: Template) {
    setSelected(t);
    if (upload) setMapping(autoGuess(t, upload.columns));
    setSubjectCols([]);
    setFilenamePattern("");
    setPreviewIndex(0);
  }

  function toggleSubject(col: string) {
    setSubjectCols((cur) =>
      cur.includes(col) ? cur.filter((c) => c !== col) : [...cur, col]
    );
  }

  function saveBrandingPreset() {
    try {
      localStorage.setItem(PRESET_KEY, JSON.stringify(branding));
      setPresetMsg("Saved as default.");
      setTimeout(() => setPresetMsg(""), 2500);
    } catch {
      setPresetMsg("Could not save.");
    }
  }
  function clearBrandingPreset() {
    try {
      localStorage.removeItem(PRESET_KEY);
    } catch {
      /* ignore */
    }
    setBranding(EMPTY_BRANDING);
    setPresetMsg("Cleared.");
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
    };
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
      setGenMsg({ text: `Done. ${upload.rowCount} PDFs downloaded as a ZIP.`, ok: true });
    } catch (err) {
      setGenMsg({ text: err instanceof Error ? err.message : "Generation failed.", ok: false });
    } finally {
      setGenBusy(false);
      setGenProgress(null);
    }
  }

  const stepClass = (n: number) =>
    "step" + (n === step ? " active" : "") + (n < step ? " done" : "");
  const mappedCols = new Set(Object.values(mapping).filter(Boolean));

  // Group template cards by their `group` label, preserving first-seen order.
  const grouped = useMemo(() => {
    const m = new Map<string, Template[]>();
    for (const t of templates) {
      const g = t.group ?? "Templates";
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(t);
    }
    return [...m.entries()];
  }, [templates]);

  const recordTotal = upload?.rowCount ?? 0;

  return (
    <div className="wrap">
      <header>
        <div className="logo">
          Doc<span>Forge</span>
        </div>
        <span className="tag">Batch documents</span>
        <a className="help-link" href="/help">
          Help &amp; how-to
        </a>
      </header>

      <div className="stepper">
        <div className={stepClass(1)}>
          <span className="dot">1</span> Choose template <span className="arrow">→</span>
        </div>
        <div className={stepClass(2)}>
          <span className="dot">2</span> Upload &amp; map <span className="arrow">→</span>
        </div>
        <div className={stepClass(3)}>
          <span className="dot">3</span> Generate
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2>Choose a template</h2>
          <p className="lede">Pick the document you want to make for each student.</p>
          {grouped.map(([g, ts]) => (
            <div key={g} style={{ marginBottom: 18 }}>
              <div className="group-h">{g}</div>
              <div className="cards">
                {ts.map((t) => (
                  <div
                    key={t.slug}
                    className={"tcard" + (selected?.slug === t.slug ? " sel" : "")}
                    onClick={() => chooseTemplate(t)}
                  >
                    <div className="tcard-ic">{TEMPLATE_ICONS[t.slug] ?? DEFAULT_ICON}</div>
                    <div className="tcard-tx">
                      <h3>{t.name}</h3>
                      <p>{t.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="bar">
            <span />
            <button className="btn" disabled={!selected} onClick={() => setStep(2)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && selected && (
        <div>
          <h2>Upload your list &amp; map the columns</h2>
          <p className="lede">
            Drop in a CSV or Excel file, then tell us which column feeds each field. The preview
            updates as you go.
          </p>
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
                  ? `${upload.filename} — ${upload.rowCount} rows detected`
                  : "Drop a CSV/Excel file here, or click to choose"}
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

              {upload && (
                <div style={{ marginTop: 6 }}>
                  {selected.fields.map((f) => (
                    <div className="maprow" key={f.key}>
                      <label>
                        {f.label}
                        {f.required && <span className="req">*</span>}
                      </label>
                      <select
                        value={mapping[f.key] ?? ""}
                        onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                      >
                        <option value="">— choose column —</option>
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

              {upload && (issues.blanks > 0 || issues.dups > 0) && (
                <div className="warn">
                  {issues.blanks > 0 && (
                    <div>⚠ {issues.blanks} row(s) have a blank required field.</div>
                  )}
                  {issues.dups > 0 && (
                    <div>⚠ {issues.dups} row(s) share a duplicate name — files will be auto-numbered.</div>
                  )}
                </div>
              )}

              {upload && selected.subjects && (
                <div className="section">
                  <div className="section-h">Subjects</div>
                  <p className="hint" style={{ marginTop: 0 }}>
                    Tick the columns that hold marks. Each becomes a row on the report.
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
                    Branding (optional)
                    <span className="section-act">
                      <button className="link" onClick={saveBrandingPreset}>
                        Save as default
                      </button>
                      <button className="link" onClick={clearBrandingPreset}>
                        Clear
                      </button>
                    </span>
                  </div>
                  <div className="maprow">
                    <label>School name</label>
                    <input
                      className="text"
                      type="text"
                      placeholder="Springfield Elementary"
                      value={branding.schoolName}
                      onChange={(e) => setBranding((b) => ({ ...b, schoolName: e.target.value }))}
                    />
                  </div>
                  <div className="maprow">
                    <label>Accent colour</label>
                    <input
                      type="color"
                      value={branding.accent}
                      onChange={(e) => setBranding((b) => ({ ...b, accent: e.target.value }))}
                    />
                  </div>
                  <div className="maprow">
                    <label>Logo (PNG/JPG)</label>
                    <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                      <button className="btn ghost small" onClick={() => logoInput.current?.click()}>
                        {branding.logoDataUrl ? "Change" : "Upload"}
                      </button>
                      {branding.logoDataUrl && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="logo-prev" src={branding.logoDataUrl} alt="logo" />
                          <button
                            className="btn ghost small"
                            onClick={() => setBranding((b) => ({ ...b, logoDataUrl: null }))}
                          >
                            Remove
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
                              setLogoErr
                            );
                        }}
                      />
                    </div>
                  </div>
                  {logoErr && <div className="msg err">{logoErr}</div>}
                  <div className="maprow">
                    <label>Signature (PNG/JPG)</label>
                    <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                      <button className="btn ghost small" onClick={() => sigInput.current?.click()}>
                        {branding.signatureDataUrl ? "Change" : "Upload"}
                      </button>
                      {branding.signatureDataUrl && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="logo-prev" src={branding.signatureDataUrl} alt="signature" />
                          <button
                            className="btn ghost small"
                            onClick={() => setBranding((b) => ({ ...b, signatureDataUrl: null }))}
                          >
                            Remove
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
                              setSigErr
                            );
                        }}
                      />
                    </div>
                  </div>
                  {sigErr && <div className="msg err">{sigErr}</div>}
                  {selected.slug === "certificate-classic" && (
                    <div className="maprow">
                      <label>Header position</label>
                      <div className="seg" style={{ flex: 1 }}>
                        {(["left", "center", "right"] as LogoPos[]).map((p) => (
                          <button
                            key={p}
                            className={"seg-btn" + (branding.logoPos === p ? " on" : "")}
                            onClick={() => setBranding((b) => ({ ...b, logoPos: p }))}
                          >
                            {p[0].toUpperCase() + p.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {presetMsg && <div className="msg ok">{presetMsg}</div>}
                </div>
              )}

              {uploadErr && <div className="msg err">{uploadErr}</div>}
              {!upload && (
                <div className="hint">
                  No file handy? Grab the{" "}
                  <a href="/sample-class.csv" download>
                    sample class list
                  </a>
                  .
                </div>
              )}
            </div>

            <div>
              {previewHtml && recordTotal > 1 && (
                <div className="pvbar">
                  <button
                    className="pvnav"
                    disabled={previewIndex === 0}
                    onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                  >
                    ◀
                  </button>
                  <span className="pvcount">
                    Record {previewIndex + 1} of {recordTotal}
                  </span>
                  <button
                    className="pvnav"
                    disabled={previewIndex >= recordTotal - 1}
                    onClick={() => setPreviewIndex((i) => Math.min(recordTotal - 1, i + 1))}
                  >
                    ▶
                  </button>
                  <button className="btn ghost small" disabled={singleBusy} onClick={downloadCurrent}>
                    {singleBusy ? "…" : "Download this one"}
                  </button>
                </div>
              )}
              <div className="preview-frame">
                {previewHtml ? (
                  <iframe title="preview" srcDoc={previewHtml} />
                ) : (
                  <div className="empty">
                    Upload a file and map the name field to see a live preview of the first record.
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bar">
            <button className="btn ghost" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn" disabled={!requiredReady} onClick={() => setStep(3)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && selected && upload && (
        <div>
          <h2>Generate the batch</h2>
          <p className="lede">
            Ready to make {upload.rowCount} {selected.name.toLowerCase()} document(s).
          </p>
          <div className="box" style={{ maxWidth: 560 }}>
            <div className="meta">
              Template: {selected.name} · Rows: {upload.rowCount} · Source: {upload.filename}
              {selected.subjects && ` · Subjects: ${subjectCols.length}`}
              {branding.schoolName && ` · ${branding.schoolName}`}
            </div>

            {(issues.blanks > 0 || issues.dups > 0) && (
              <div className="warn">
                {issues.blanks > 0 && <div>⚠ {issues.blanks} row(s) have a blank required field.</div>}
                {issues.dups > 0 && <div>⚠ {issues.dups} row(s) share a duplicate name (auto-numbered).</div>}
              </div>
            )}

            <div className="section" style={{ marginTop: 14 }}>
              <div className="section-h">Filename</div>
              <input
                className="text"
                type="text"
                style={{ width: "100%" }}
                placeholder={`{${nameKey ?? "name"}}`}
                value={filenamePattern}
                onChange={(e) => setFilenamePattern(e.target.value)}
              />
              <div className="hint" style={{ marginTop: 6 }}>
                Tokens:{" "}
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
              <button className="btn ghost" onClick={() => setStep(2)} disabled={genBusy}>
                Back
              </button>
              <button className="btn" disabled={genBusy} onClick={generate}>
                {genBusy && <span className="spin" />}
                {genBusy
                  ? genProgress
                    ? `Generating ${genProgress.done}/${genProgress.total}…`
                    : "Generating…"
                  : "Generate & download ZIP"}
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
  } = {};
  if (b.schoolName.trim()) out.schoolName = b.schoolName.trim();
  if (b.accent && b.accent.toLowerCase() !== DEFAULT_ACCENT.toLowerCase()) out.accent = b.accent;
  if (b.logoDataUrl) {
    out.logoDataUrl = b.logoDataUrl;
    out.logoPos = b.logoPos;
  }
  if (b.signatureDataUrl) out.signatureDataUrl = b.signatureDataUrl;
  return out;
}
