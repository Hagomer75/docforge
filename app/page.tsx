"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Field = { key: string; label: string; required: boolean };
type Template = {
  slug: string;
  name: string;
  description: string;
  fields: Field[];
  subjects?: boolean;
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
};

const BATCH_SIZE = 25;
const DEFAULT_ACCENT = "#2F6F6A";

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

export default function Home() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [subjectCols, setSubjectCols] = useState<string[]>([]);
  const [branding, setBranding] = useState<Branding>({
    schoolName: "",
    accent: DEFAULT_ACCENT,
    logoDataUrl: null,
    logoPos: "center",
  });
  const [previewHtml, setPreviewHtml] = useState("");
  const [uploadErr, setUploadErr] = useState("");
  const [logoErr, setLogoErr] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [genProgress, setGenProgress] = useState<{ done: number; total: number } | null>(null);
  const [genMsg, setGenMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  const requiredReady =
    selected != null && selected.fields.filter((f) => f.required).every((f) => mapping[f.key]);
  const nameMapped =
    selected != null && selected.fields.some((f) => f.required && mapping[f.key]);

  // Live preview of the first row, debounced. Reflects mapping, subjects, branding.
  useEffect(() => {
    if (!selected || !upload || !nameMapped) {
      setPreviewHtml("");
      return;
    }
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
            row: upload.rows[0],
          }),
        });
        const { html } = await r.json();
        setPreviewHtml(html ?? "");
      } catch {
        /* preview is best-effort */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [selected, upload, mapping, subjectCols, branding, nameMapped]);

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
      } catch {
        setUploadErr("Could not read that file.");
      }
    },
    [selected]
  );

  function handleLogo(file: File) {
    setLogoErr("");
    if (!/\.(png|jpe?g)$/i.test(file.name)) {
      setLogoErr("Logo must be a PNG or JPG.");
      return;
    }
    if (file.size > 600 * 1024) {
      setLogoErr("Logo must be under 600 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setBranding((b) => ({ ...b, logoDataUrl: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function chooseTemplate(t: Template) {
    setSelected(t);
    if (upload) setMapping(autoGuess(t, upload.columns));
    setSubjectCols([]);
  }

  function toggleSubject(col: string) {
    setSubjectCols((cur) =>
      cur.includes(col) ? cur.filter((c) => c !== col) : [...cur, col]
    );
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
          body: JSON.stringify({
            templateSlug: selected.slug,
            mapping,
            subjectColumns: subjectCols,
            branding: brandingPayload(branding),
            rows: batch,
            startIndex: start,
          }),
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

  // Columns still available to use as subjects (not already a mapped field).
  const mappedCols = new Set(Object.values(mapping).filter(Boolean));

  return (
    <div className="wrap">
      <header>
        <div className="logo">
          Doc<span>Forge</span>
        </div>
        <span className="tag">Batch documents</span>
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
          <div className="cards">
            {templates.map((t) => (
              <div
                key={t.slug}
                className={"tcard" + (selected?.slug === t.slug ? " sel" : "")}
                onClick={() => chooseTemplate(t)}
              >
                <h3>{t.name}</h3>
                <p>{t.description}</p>
              </div>
            ))}
          </div>
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
                        onChange={(e) =>
                          setMapping((m) => ({ ...m, [f.key]: e.target.value }))
                        }
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
                        <label
                          key={c}
                          className={"chip" + (subjectCols.includes(c) ? " on" : "")}
                        >
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
                  <div className="section-h">Branding (optional)</div>
                  <div className="maprow">
                    <label>School name</label>
                    <input
                      className="text"
                      type="text"
                      placeholder="Springfield Elementary"
                      value={branding.schoolName}
                      onChange={(e) =>
                        setBranding((b) => ({ ...b, schoolName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="maprow">
                    <label>Accent colour</label>
                    <input
                      type="color"
                      value={branding.accent}
                      onChange={(e) =>
                        setBranding((b) => ({ ...b, accent: e.target.value }))
                      }
                    />
                  </div>
                  <div className="maprow">
                    <label>Logo (PNG/JPG)</label>
                    <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        className="btn ghost small"
                        onClick={() => logoInput.current?.click()}
                      >
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
                          if (e.target.files?.[0]) handleLogo(e.target.files[0]);
                        }}
                      />
                    </div>
                  </div>
                  {logoErr && <div className="msg err">{logoErr}</div>}
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
          <div className="box" style={{ maxWidth: 520 }}>
            <div className="meta">
              Template: {selected.name} · Rows: {upload.rowCount} · Source: {upload.filename}
              {selected.subjects && ` · Subjects: ${subjectCols.length}`}
              {branding.schoolName && ` · ${branding.schoolName}`}
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
                  style={{
                    width: `${Math.round((genProgress.done / genProgress.total) * 100)}%`,
                  }}
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
  } = {};
  if (b.schoolName.trim()) out.schoolName = b.schoolName.trim();
  if (b.accent && b.accent.toLowerCase() !== DEFAULT_ACCENT.toLowerCase()) out.accent = b.accent;
  if (b.logoDataUrl) {
    out.logoDataUrl = b.logoDataUrl;
    out.logoPos = b.logoPos;
  }
  return out;
}
