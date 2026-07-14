"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "en" | "zh";

const copy = {
  en: {
    back: "Back home",
    toggle: "中文",
    eyebrow: "CV",
    title: "KanWu CV",
    body: "A focused preview of the English CV. Open the full PDF for reading, saving, or sharing.",
    download: "Download English CV",
    open: "Open full PDF",
    hint: "Click the paper preview to open the full CV.",
    meta: ["2 pages", "A4 format", "Updated CV"],
  },
  zh: {
    back: "返回首页",
    toggle: "EN",
    eyebrow: "CV",
    title: "吴侃 CV",
    body: "中文 CV 的重点预览。打开完整 PDF 后可阅读、保存或分享。",
    download: "下载中文 CV",
    open: "打开完整 PDF",
    hint: "点击纸张预览即可打开完整 CV。",
    meta: ["2 页", "A4 格式", "已接入新版 CV"],
  },
};

const previewByLang = {
  en: "/cv-preview-en.png",
  zh: "/cv-preview-cn.png",
};

function getInitialLang(): Lang {
  if (typeof window === "undefined") {
    return "en";
  }

  return new URLSearchParams(window.location.search).get("lang") === "zh"
    ? "zh"
    : "en";
}

export default function CvPage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = copy[lang];
  const cvUrl = useMemo(() => `/api/cv/${lang}`, [lang]);

  useEffect(() => {
    setLang(getInitialLang());
  }, []);

  useEffect(() => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        path: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer,
      }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  return (
    <main className="cv-page">
      <header className="subpage-header">
        <a href={`/?lang=${lang}`}>{t.back}</a>
        <button
          className="language-toggle"
          type="button"
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
        >
          {t.toggle}
        </button>
      </header>

      <section className="cv-layout">
        <div className="cv-copy">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.body}</p>
          <ul className="cv-meta" aria-label="CV details">
            {t.meta.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="button-row">
            <a className="button primary" href={cvUrl} target="_blank" rel="noreferrer">
              {t.open}
            </a>
            <a className="button secondary" href={cvUrl} download>
              {t.download}
            </a>
          </div>
          <p className="cv-hint">{t.hint}</p>
        </div>
        <a className="paper-preview" href={cvUrl} target="_blank" rel="noreferrer" aria-label={t.open}>
          <span className="paper-toolbar">
            <span>{lang === "en" ? "Preview" : "预览"}</span>
            <span>{lang === "en" ? "Open PDF" : "打开 PDF"}</span>
          </span>
          <img key={lang} src={previewByLang[lang]} alt={`${t.title} preview`} />
        </a>
      </section>
    </main>
  );
}
