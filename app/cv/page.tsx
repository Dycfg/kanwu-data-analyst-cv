"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "en" | "zh";

const copy = {
  en: {
    back: "Back home",
    toggle: "中文",
    eyebrow: "CV",
    title: "KanWu CV",
    body: "English mode displays the English CV. Switch language to preview or download the Chinese PDF.",
    download: "Download English CV",
    unavailable:
      "The English CV has not been uploaded yet. Use the admin page to add the PDF when it is ready.",
    admin: "Admin upload",
  },
  zh: {
    back: "返回首页",
    toggle: "EN",
    eyebrow: "CV",
    title: "吴侃 CV",
    body: "中文模式展示中文 CV。切换语言后可预览或下载英文 PDF。",
    download: "下载中文 CV",
    unavailable: "中文 CV 尚未上传。准备好 PDF 后可在后台页面添加。",
    admin: "后台上传",
  },
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
  const [loaded, setLoaded] = useState(false);
  const t = copy[lang];
  const cvUrl = useMemo(() => `/api/cv/${lang}`, [lang]);

  useEffect(() => {
    setLang(getInitialLang());
  }, []);

  useEffect(() => {
    setLoaded(false);
  }, [lang]);

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
          <div className="button-row">
            <a className="button primary" href={cvUrl} download>
              {t.download}
            </a>
            <a className="button secondary" href="/admin">
              {t.admin}
            </a>
          </div>
        </div>
        <div className="pdf-frame">
          {!loaded && <div className="pdf-placeholder">{t.unavailable}</div>}
          <iframe
            key={cvUrl}
            title={t.title}
            src={cvUrl}
            onLoad={() => setLoaded(true)}
          />
        </div>
      </section>
    </main>
  );
}
