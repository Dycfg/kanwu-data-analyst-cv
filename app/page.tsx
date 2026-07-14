"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "en" | "zh";

const content = {
  en: {
    nav: ["About", "Experience", "Skills", "Projects", "CV", "Contact"],
    navTargets: ["about", "experience", "skills", "projects", "cv", "contact"],
    languageLabel: "中文",
    eyebrow: "KanWu / Wu Kan",
    role: "Data Analyst",
    tagline:
      "Data Analyst with a focus on business insight, reporting, and data-driven decision making.",
    intro:
      "I translate messy operational and business data into clear reporting, practical analysis, and decisions that teams can act on. My work sits between analytics execution and business communication: SQL, Python, dashboards, careful interpretation, and concise storytelling.",
    primaryCta: "View CV",
    secondaryCta: "Contact me",
    links: {
      github: "GitHub",
      linkedin: "LinkedIn soon",
      email: "Email",
      wechat: "Copy WeChat",
    },
    copied: "Copied",
    aboutTitle: "About",
    aboutKicker: "Analytical work, business language.",
    aboutBody: [
      "I am building my career around data analysis for business insight, reporting, and decision support.",
      "My focus is on understanding the question behind a metric, cleaning and structuring the data, then presenting findings in a way that helps teams move.",
      "The detailed experience section will be refined from the English and Chinese CV files once they are uploaded.",
    ],
    experienceTitle: "Experience",
    experienceKicker: "Work and internship history will be the core of the site.",
    experienceNote:
      "The first version keeps the structure ready for your CV. Once the PDFs are provided, I will extract company names, roles, dates, and 3-5 achievement bullets for each experience.",
    experienceCards: [
      {
        label: "Reporting",
        title: "Business reporting and dashboard work",
        body: "Build recurring reports, track business metrics, and turn raw data into readable summaries for stakeholders.",
      },
      {
        label: "Analysis",
        title: "Operational and user insight",
        body: "Investigate trends, segment users or transactions, and identify practical drivers behind movement in key indicators.",
      },
      {
        label: "Communication",
        title: "Decision-ready presentation",
        body: "Explain methods, assumptions, findings, and next steps in concise language for non-technical audiences.",
      },
    ],
    skillsTitle: "Skills",
    skills: [
      ["Data analysis", "SQL", "Python", "Excel", "Statistical analysis"],
      ["Visualization", "Tableau", "Power BI", "Looker", "Matplotlib"],
      ["Data processing", "Pandas", "NumPy", "ETL", "Data cleaning"],
      ["Business focus", "User analysis", "Growth analysis", "Reporting", "Operations analysis"],
    ],
    projectsTitle: "Projects",
    projectsKicker: "Selected projects will be refined from CV evidence.",
    projects: [
      {
        title: "Reporting workflow",
        meta: "Structure ready",
        body: "A project slot for dashboards, recurring reporting, or automation work, with room for background, method, tools, and result.",
      },
      {
        title: "Business insight case",
        meta: "Structure ready",
        body: "A concise case format for explaining a business question, the analysis path, and the decision or recommendation it supported.",
      },
    ],
    cvTitle: "CV",
    cvBody:
      "The CV page will display the English PDF in English mode and the Chinese PDF in Chinese mode. Uploads can be replaced from the admin page.",
    cvButton: "Open CV page",
    contactTitle: "Contact",
    contactBody:
      "Open to data analyst opportunities, internship conversations, and analytics-focused roles.",
    adminLink: "Admin",
  },
  zh: {
    nav: ["关于我", "经历", "技能", "项目", "CV", "联系"],
    navTargets: ["about", "experience", "skills", "projects", "cv", "contact"],
    languageLabel: "EN",
    eyebrow: "KanWu / 吴侃",
    role: "数据分析师",
    tagline: "专注于业务洞察、数据报告与数据驱动决策的数据分析师。",
    intro:
      "我将复杂的业务与运营数据转化为清晰的报告、可执行的分析结论和能够支持团队决策的信息。我的工作连接数据分析执行与业务沟通：SQL、Python、仪表盘、严谨解释，以及简洁表达。",
    primaryCta: "查看 CV",
    secondaryCta: "联系我",
    links: {
      github: "GitHub",
      linkedin: "LinkedIn 暂未添加",
      email: "邮箱",
      wechat: "复制微信号",
    },
    copied: "已复制",
    aboutTitle: "关于我",
    aboutKicker: "用分析能力理解业务问题。",
    aboutBody: [
      "我正在围绕业务洞察、数据报告和数据驱动决策建立自己的数据分析职业方向。",
      "我关注指标背后的真实问题，重视数据清洗、结构化处理和分析结论的业务表达。",
      "等你上传中英文 CV 后，我会根据简历内容进一步细化这里的经历、技能和项目描述。",
    ],
    experienceTitle: "经历",
    experienceKicker: "工作与实习经历会是网站重点。",
    experienceNote:
      "第一版先保留清晰结构。上传 PDF 后，我会从 CV 中提取公司、岗位、时间，并为每段经历整理 3 到 5 条成果描述。",
    experienceCards: [
      {
        label: "报告",
        title: "业务报告与仪表盘",
        body: "搭建周期性报告，追踪核心业务指标，将原始数据整理成利益相关方易读的分析摘要。",
      },
      {
        label: "分析",
        title: "运营与用户洞察",
        body: "分析趋势、用户或交易分层，识别关键指标变化背后的实际驱动因素。",
      },
      {
        label: "沟通",
        title: "面向决策的表达",
        body: "用简洁语言说明方法、假设、发现和下一步建议，让非技术受众也能快速理解。",
      },
    ],
    skillsTitle: "技能",
    skills: [
      ["数据分析", "SQL", "Python", "Excel", "统计分析"],
      ["可视化", "Tableau", "Power BI", "Looker", "Matplotlib"],
      ["数据处理", "Pandas", "NumPy", "ETL", "数据清洗"],
      ["业务方向", "用户分析", "增长分析", "报告搭建", "运营分析"],
    ],
    projectsTitle: "项目",
    projectsKicker: "精选项目会根据 CV 内容继续完善。",
    projects: [
      {
        title: "报告流程项目",
        meta: "结构预留",
        body: "适合放置仪表盘、周期报告或自动化分析相关项目，包含背景、方法、工具与结果。",
      },
      {
        title: "业务洞察案例",
        meta: "结构预留",
        body: "用于展示一个业务问题、分析路径，以及最终支持的决策或建议。",
      },
    ],
    cvTitle: "CV",
    cvBody:
      "CV 页面会在英文模式展示英文 PDF，在中文模式展示中文 PDF。之后可以在后台替换上传。",
    cvButton: "打开 CV 页面",
    contactTitle: "联系",
    contactBody: "欢迎数据分析师岗位、实习机会以及数据分析相关方向的沟通。",
    adminLink: "后台",
  },
};

const contact = {
  github: "https://github.com/Dycfg",
  email: "wuka@tcd.ie",
  wechat: "W956994000",
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [copied, setCopied] = useState(false);
  const t = content[lang];
  const cvHref = useMemo(() => `/cv?lang=${lang}`, [lang]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("lang") === "zh") {
      setLang("zh");
    }
  }, []);

  async function copyWechat() {
    await navigator.clipboard.writeText(contact.wechat);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
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
          <h1>{t.role}</h1>
          <p className="hero-tagline">{t.tagline}</p>
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
        <aside className="analysis-card reveal" aria-label="Profile summary">
          <div className="axis-line" />
          <dl>
            <div>
              <dt>Focus</dt>
              <dd>Insight / Reporting</dd>
            </div>
            <div>
              <dt>Tools</dt>
              <dd>SQL / Python / BI</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>Decision support</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="social-strip" aria-label="Profile links">
        <a href={contact.github} target="_blank" rel="noreferrer">
          {t.links.github}
        </a>
        <span aria-disabled="true">{t.links.linkedin}</span>
        <a href={`mailto:${contact.email}`}>{t.links.email}</a>
        <button type="button" onClick={copyWechat}>
          {copied ? t.copied : t.links.wechat}
        </button>
      </section>

      <section className="content-section section-grid" id="about">
        <div>
          <p className="section-label">{t.aboutTitle}</p>
          <h2>{t.aboutKicker}</h2>
        </div>
        <div className="prose-stack">
          {t.aboutBody.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="content-section" id="experience">
        <div className="section-heading">
          <p className="section-label">{t.experienceTitle}</p>
          <h2>{t.experienceKicker}</h2>
          <p>{t.experienceNote}</p>
        </div>
        <div className="experience-grid">
          {t.experienceCards.map((item) => (
            <article className="line-card" key={item.title}>
              <p>{item.label}</p>
              <h3>{item.title}</h3>
              <span>{item.body}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section section-grid" id="skills">
        <div>
          <p className="section-label">{t.skillsTitle}</p>
          <h2>SQL, Python, BI, and business context.</h2>
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
          <p className="section-label">{t.projectsTitle}</p>
          <h2>{t.projectsKicker}</h2>
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
          <p className="section-label">{t.cvTitle}</p>
          <h2>{t.cvBody}</h2>
        </div>
        <a className="button primary" href={cvHref}>
          {t.cvButton}
        </a>
      </section>

      <section className="content-section section-grid contact-band" id="contact">
        <div>
          <p className="section-label">{t.contactTitle}</p>
          <h2>{t.contactBody}</h2>
        </div>
        <div className="contact-list">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={contact.github} target="_blank" rel="noreferrer">
            github.com/Dycfg
          </a>
          <button type="button" onClick={copyWechat}>
            {copied ? t.copied : t.links.wechat}
          </button>
          <a href="/admin">{t.adminLink}</a>
        </div>
      </section>
    </main>
  );
}
