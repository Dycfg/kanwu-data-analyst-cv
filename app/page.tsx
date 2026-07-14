"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { defaultSiteContent, type Lang, type SiteContent } from "./site-content";

function GitHubMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.19-3.37-1.19a2.65 2.65 0 0 0-1.11-1.46c-.91-.62.07-.61.07-.61a2.1 2.1 0 0 1 1.53 1.03 2.13 2.13 0 0 0 2.91.83 2.13 2.13 0 0 1 .64-1.34c-2.22-.25-4.55-1.11-4.55-4.94a3.87 3.87 0 0 1 1.03-2.68 3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.49 9.49 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64a3.86 3.86 0 0 1 1.03 2.68c0 3.84-2.34 4.69-4.57 4.94a2.39 2.39 0 0 1 .68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function displayTitle(text: string) {
  return text.replace(/[.。]+$/g, "");
}

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <p className="section-label indexed-label">
      <span className="section-index">{index}</span>
      <span>{label}</span>
    </p>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent);
  const [copied, setCopied] = useState(false);
  const t = siteContent[lang];
  const contact = siteContent.contact;
  const cvHref = useMemo(() => `/cv?lang=${lang}`, [lang]);
  const roleLines = lang === "en" ? t.role.split(" ") : ["数据", "分析师"];
  const cvPreview = lang === "en" ? "/cv-preview-en.png" : "/cv-preview-cn.png";
  const workflowSteps =
    lang === "en"
      ? [
          ["01", "Question", "Frame the business metric"],
          ["02", "Data", "Clean and structure records"],
          ["03", "Analysis", "Model patterns and drivers"],
          ["04", "Decision", "Report clear next steps"],
        ]
      : [
          ["01", "问题", "明确业务指标"],
          ["02", "数据", "清洗并结构化记录"],
          ["03", "分析", "建模识别关键因素"],
          ["04", "决策", "输出清晰行动建议"],
        ];
  const signalMetrics =
    lang === "en"
      ? [
          ["20+", "reports"],
          ["5,000+", "records"],
          ["15+", "visuals"],
        ]
      : [
          ["20+", "报告"],
          ["5,000+", "数据"],
          ["15+", "图表"],
        ];
  const experienceSignals =
    lang === "en"
      ? [
          ["Market research", "5,000+ records", "15+ visuals"],
          ["Backend support", "3,000+ records", "GIS data"],
          ["Statistics", "LMM", "GIS analysis"],
        ]
      : [
          ["市场研究", "5,000+ 数据", "15+ 图表"],
          ["后端支持", "3,000+ 数据", "GIS 数据"],
          ["统计建模", "线性混合模型", "空间分析"],
        ];

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("lang") === "zh") {
      setLang("zh");
    }
  }, []);

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { content?: SiteContent } | null) => {
        if (payload?.content) {
          setSiteContent(payload.content);
        }
      })
      .catch(() => {
        setSiteContent(defaultSiteContent);
      });
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

  async function copyWechat() {
    await navigator.clipboard.writeText(contact.wechat);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function renderContactIcons() {
    return (
      <>
        <a
          className="icon-link"
          href={`mailto:${contact.email}`}
          aria-label={t.links.email}
          data-label={t.links.email}
        >
          <Mail aria-hidden="true" size={21} strokeWidth={1.8} />
        </a>
        <a
          className="icon-link"
          href={contact.github}
          target="_blank"
          rel="noreferrer"
          aria-label={t.links.github}
          data-label={t.links.github}
        >
          <GitHubMark />
        </a>
        <button
          className="icon-link"
          type="button"
          onClick={copyWechat}
          aria-label={t.links.wechat}
          data-label={t.links.wechat}
        >
          <MessageCircle aria-hidden="true" size={21} strokeWidth={1.8} />
        </button>
        <span className={`copy-status ${copied ? "is-visible" : ""}`} aria-live="polite">
          {t.copied}
        </span>
      </>
    );
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brandmark" href="#top" aria-label="KanWu home">
          KW
        </a>
        <nav className="main-nav" aria-label="Primary navigation">
          {t.nav.map((item, index) => (
            <a key={item} href={`#${t.navTargets[index]}`}>
              {item}
            </a>
          ))}
        </nav>
        <button
          className="language-toggle"
          type="button"
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
        >
          {t.languageLabel}
        </button>
      </header>

      <section className="hero section-grid" id="top">
        <div className="hero-copy reveal">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className={`hero-title ${lang === "zh" ? "is-zh" : "is-en"}`}>
            {roleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className="hero-tagline">{displayTitle(t.tagline)}</p>
          <p className="hero-intro">{t.intro}</p>
          <div className="button-row">
            <a className="button primary" href={cvHref}>
              {t.primaryCta}
            </a>
            <a className="button secondary" href="#contact">
              {t.secondaryCta}
            </a>
          </div>
        </div>
        <aside className="signature-panel reveal" aria-label="Analytical workflow">
          <p className="section-label">{lang === "en" ? "Workflow" : "工作流"}</p>
          <div className="workflow-board" aria-label={lang === "en" ? "Analytical workflow" : "分析工作流"}>
            {workflowSteps.map(([step, title, body]) => (
              <div className="workflow-step" key={step}>
                <span>{step}</span>
                <strong>{title}</strong>
                <p>{body}</p>
              </div>
            ))}
          </div>
          <div className="signal-metrics" aria-label={lang === "en" ? "Selected metrics" : "精选数据"}>
            {signalMetrics.map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <dl>
            {t.snapshot.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      <section className="content-section section-grid" id="about">
        <div>
          <SectionLabel index="01" label={t.aboutTitle} />
          <h2>{displayTitle(t.aboutKicker)}</h2>
        </div>
        <div className="prose-stack">
          {t.aboutBody.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="content-section" id="experience">
        <div className="section-heading">
          <SectionLabel index="02" label={t.experienceTitle} />
          <h2>{displayTitle(t.experienceKicker)}</h2>
          <p>{t.experienceNote}</p>
        </div>
        <div className="experience-grid">
          {t.experienceCards.map((item, index) => (
            <article className="line-card" key={item.title}>
              <p>{item.label}</p>
              <h3>{item.title}</h3>
              <div className="impact-list" aria-label={lang === "en" ? "Experience focus" : "经历重点"}>
                {experienceSignals[index]?.map((signal) => (
                  <span key={signal}>{signal}</span>
                ))}
              </div>
              <span>{item.body}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section section-grid" id="skills">
        <div>
          <SectionLabel index="03" label={t.skillsTitle} />
          <h2>{displayTitle(t.skillsHeading)}</h2>
        </div>
        <div className="skills-list">
          {t.skills.map(([group, ...items]) => (
            <div className="skill-row" key={group}>
              <strong>{group}</strong>
              <span>{items.join(" / ")}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section" id="projects">
        <div className="section-heading">
          <SectionLabel index="04" label={t.projectsTitle} />
          <h2>{displayTitle(t.projectsKicker)}</h2>
        </div>
        <div className="project-grid">
          {t.projects.map((project) => (
            <article className="project-card" key={project.title}>
              <span>{project.meta}</span>
              <h3>{project.title}</h3>
              <p>{project.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section section-grid cv-band" id="cv">
        <div>
          <SectionLabel index="05" label={t.cvTitle} />
          <h2>{displayTitle(t.cvBody)}</h2>
        </div>
        <div className="cv-action-stack">
          <a className="cv-mini-preview" href={cvHref} aria-label={t.cvButton}>
            <span>{lang === "en" ? "Current PDF" : "当前 PDF"}</span>
            <img src={cvPreview} alt="" />
          </a>
          <a className="button primary" href={cvHref}>
            {t.cvButton}
          </a>
        </div>
      </section>

      <section className="content-section section-grid contact-band" id="contact">
        <div>
          <SectionLabel index="06" label={t.contactTitle} />
          <h2>{displayTitle(t.contactBody)}</h2>
        </div>
        <div className="contact-list contact-icons">
          {renderContactIcons()}
        </div>
      </section>
    </main>
  );
}
