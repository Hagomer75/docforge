"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Field = { key: string; label: string; required: boolean };
type Template = { slug: string; name: string; description: string; fields: Field[] };
type Upload = {
  filename: string;
  columns: string[];
  rows: Record<string, string>[];
  rowCount: number;
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

export default function Home() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState("");
  const [uploadErr, setUploadErr] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [genMsg, setGenMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

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

  // Live preview of the first row, debounced.
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
            row: upload.rows[0],
          }),
        });
        const { html } = await r.json();
        setPreviewHtml(html ?? "");
      } catch {
        /* preview is best-effort */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [selected, upload, mapping, nameMapped]);

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
      } catch {
        setUploadErr("Could not read that file.");
      }
    },
    [selected]
  );

  function chooseTemplate(t: Template) {
    setSelected(t);
    if (upload) setMapping(autoGuess(t, upload.columns));
  }

  async function generate() {
    if (!selected || !upload) return;
    setGenBusy(true);
    setGenMsg(null);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateSlug: selected.slug, mapping, rows: upload.rows }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error || "Generation failed.");
      }
      const blob = await r.blob();
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
    }
  }

  const stepClass = (n: number) =>
    "step" + (n === step ? " active" : "") + (n < step ? " done" : "");

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
            </div>
            <div className="bar">
              <button className="btn ghost" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="btn" disabled={genBusy} onClick={generate}>
                {genBusy && <span className="spin" />}
                {genBusy ? "Generating…" : "Generate & download ZIP"}
              </button>
            </div>
            {genMsg && <div className={"msg " + (genMsg.ok ? "ok" : "err")}>{genMsg.text}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
