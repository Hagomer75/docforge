"use client";

import { useEffect, useMemo, useState } from "react";
import { HELP_SECTIONS } from "./help-content";

export default function HelpPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(HELP_SECTIONS[0]?.id ?? "");
  const query = q.trim().toLowerCase();

  const shown = useMemo(() => {
    if (!query) return HELP_SECTIONS;
    return HELP_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.keywords.some((k) => k.toLowerCase().includes(query)) ||
        s.html.toLowerCase().includes(query)
    );
  }, [query]);

  // Highlight the nav entry for the section currently near the top.
  useEffect(() => {
    if (query) return; // scroll-spy only matters in the full, unfiltered view
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-12% 0px -80% 0px" }
    );
    shown.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [shown, query]);

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

      <h1 className="help-title">Help &amp; how-to</h1>
      <p className="help-lede">
        Everything you need to turn a class list into finished PDFs — step by step, with a
        reference for every template.
      </p>

      <input
        className="help-search"
        type="search"
        placeholder="Search help… (e.g. logo, marks, filename, upload)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="help-grid">
        <nav className="help-nav">
          {shown.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={!query && active === s.id ? "on" : ""}
            >
              {s.title}
            </a>
          ))}
        </nav>

        <div>
          {shown.length === 0 && (
            <div className="help-empty">
              No help topics match “{q}”. Try a different word.
            </div>
          )}
          {shown.map((s) => (
            <section key={s.id} id={s.id} className="help-sec">
              <h2>{s.title}</h2>
              <div className="help-body" dangerouslySetInnerHTML={{ __html: s.html }} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
