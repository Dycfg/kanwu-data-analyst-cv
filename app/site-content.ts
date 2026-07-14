export type Lang = "en" | "zh";

export type ExperienceCard = {
  label: string;
  title: string;
  body: string;
};

export type ProjectCard = {
  title: string;
  meta: string;
  body: string;
};

export type LanguageContent = {
  nav: string[];
  navTargets: string[];
  languageLabel: string;
  eyebrow: string;
  role: string;
  tagline: string;
  intro: string;
  primaryCta: string;
  secondaryCta: string;
  links: {
    github: string;
    email: string;
    wechat: string;
  };
  copied: string;
  aboutTitle: string;
  aboutKicker: string;
  aboutBody: string[];
  experienceTitle: string;
  experienceKicker: string;
  experienceNote: string;
  experienceCards: ExperienceCard[];
  skillsTitle: string;
  skillsHeading: string;
  skills: string[][];
  projectsTitle: string;
  projectsKicker: string;
  projects: ProjectCard[];
  cvTitle: string;
  cvBody: string;
  cvButton: string;
  contactTitle: string;
  contactBody: string;
  snapshot: string[][];
};

export type SiteContent = {
  contact: {
    github: string;
    email: string;
    wechat: string;
  };
  en: LanguageContent;
  zh: LanguageContent;
};

export const defaultSiteContent: SiteContent = {
  contact: {
    github: "https://github.com/Dycfg",
    email: "wuka@tcd.ie",
    wechat: "W956994000",
  },
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
      email: "Email",
      wechat: "Copy WeChat",
    },
    copied: "Copied",
    aboutTitle: "About",
    aboutKicker: "Analytical work, business language.",
    aboutBody: [
      "I am an MSc Statistics & Sustainability student at Trinity College Dublin with a B.Eng. background in Data Science and Big Data Technology.",
      "My work combines Python-based data processing, statistical modeling, market research, data visualization, and backend system support.",
      "I enjoy turning scattered business or operational data into clean analysis, readable reporting, and practical recommendations for teams.",
    ],
    experienceTitle: "Experience",
    experienceKicker: "Internship experience across data analysis, backend support, and operational data workflows.",
    experienceNote:
      "The experience below is summarized from my CV, with emphasis on measurable data work, workflow support, and business-facing analysis.",
    experienceCards: [
      {
        label: "Wuhan Jingmao Kunhang Construction Engineering Co., Ltd. / 01.2023 - 06.2023",
        title: "Data Analyst Intern",
        body: "Researched the construction engineering market by reviewing 20+ reports and datasets, then processed 5,000+ market and competitor records with Python and Excel. Built 15+ visualizations with Matplotlib and Seaborn to explain market dynamics, competitor positioning, pricing patterns, and growth opportunities.",
      },
      {
        label: "Wuhan Geoyuan Tech Co., Ltd. / 06.2021 - 08.2021",
        title: "Back-end Developer Intern",
        body: "Supported backend development and environment setup for internal business applications, while organizing 3,000+ structured project and business records. Assisted with geospatial datasets and coordinate-based project information, applying basic GIS concepts to support mapping and spatial visualization tasks.",
      },
      {
        label: "Trinity College Dublin / 2024 - 2025",
        title: "MSc Statistics & Sustainability",
        body: "Applied statistics, data analytics, advanced linear models, and GIS-based spatial analysis in postgraduate study. Dissertation work used five-year grassland experiment data and linear mixed-effects modeling to build a reproducible statistical framework for sustainable management decisions.",
      },
    ],
    skillsTitle: "Skills",
    skillsHeading: "SQL, Python, BI, and business context.",
    skills: [
      ["Data analysis", "Python", "SQL", "Excel", "Statistical modeling", "Market research"],
      ["Visualization", "Matplotlib", "Seaborn", "Data visualization", "GIS basics"],
      ["Data processing", "Pandas", "NumPy", "MySQL", "MongoDB", "Data cleaning"],
      ["Development support", "Backend support", "Java", "C", "C#", "Linux", "Workflow automation"],
    ],
    projectsTitle: "Projects",
    projectsKicker: "Selected academic and technical projects with data, modeling, and system-building components.",
    projects: [
      {
        title: "Grassland yield and sustainability dissertation",
        meta: "Statistics / Linear mixed-effects modeling",
        body: "Analyzed five years of Dutch grassland experimental data to study how diverse sward mixtures and intensive management affect dry matter yield. The work connected statistical modeling with soil quality and biodiversity factors to support sustainable grassland management.",
      },
      {
        title: "Hair sample analysis for baldness experiment",
        meta: "Machine learning / Predictive analysis",
        body: "Collected and analyzed hair sample data using statistical and machine learning methods to explore potential relationships between sample indicators and baldness risk. Built an early predictive model to support more personalized treatment thinking.",
      },
      {
        title: "Online shopping system",
        meta: "JavaEE / Recommendation logic / Backend development",
        body: "Led and contributed to an online shopping system project, designing database schema and backend logic, implementing core business functions, and improving system performance. Related project work also used user behavior and classification data to build personalized recommendation logic.",
      },
    ],
    cvTitle: "CV",
    cvBody:
      "The CV page displays the English PDF in English mode and the Chinese PDF in Chinese mode, with a clear preview and download path.",
    cvButton: "Open CV page",
    contactTitle: "Contact",
    contactBody:
      "Open to data analyst opportunities, internship conversations, and analytics-focused roles.",
    snapshot: [
      ["Seeking", "Data analyst roles"],
      ["Strength", "Python, reporting, statistics"],
      ["Working style", "Structured, analytical, business-facing"],
    ],
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
      email: "邮箱",
      wechat: "复制微信号",
    },
    copied: "已复制",
    aboutTitle: "关于我",
    aboutKicker: "用分析能力理解业务问题。",
    aboutBody: [
      "我目前就读于都柏林圣三一学院统计与可持续发展硕士，本科背景为数据科学与大数据技术。",
      "我的经历覆盖 Python 数据处理、统计建模、市场研究、数据可视化、后端系统支持和工作流优化。",
      "我擅长把分散的业务或运营数据整理成清晰分析、可读报告和能够支持决策的结论。",
    ],
    experienceTitle: "经历",
    experienceKicker: "围绕数据分析、后端支持和运营数据流程的实习与学术经历。",
    experienceNote:
      "以下内容根据 CV 整理，重点突出可量化的数据处理、分析表达和业务支持能力。",
    experienceCards: [
      {
        label: "武汉菁茂焜航建设工程有限公司 / 2023.01 - 2023.06",
        title: "数据分析师实习生",
        body: "围绕建筑工程行业开展市场研究和行业分析，阅读 20+ 行业报告与数据集，并使用 Python 和 Excel 清洗处理 5,000+ 条市场与竞品数据。使用 Matplotlib 和 Seaborn 构建 15+ 个可视化图表，分析市场动态、竞品定位、定价策略和增长机会。",
      },
      {
        label: "武汉地源科技有限公司 / 2021.06 - 2021.08",
        title: "后端开发实习生",
        body: "协助内部业务应用的后端开发、系统搭建和测试环境配置，同时整理 3,000+ 条结构化项目与业务数据，支持内部数据管理和流程效率。参与地理空间数据与坐标项目信息整理，运用基础 GIS 概念辅助空间可视化与制图任务。",
      },
      {
        label: "都柏林圣三一学院 / 2024 - 2025",
        title: "统计与可持续发展理学硕士",
        body: "研究生阶段学习统计学、数据分析、高级线性模型和基于 GIS 的空间分析。论文使用 2019-2023 年荷兰草地实验数据和线性混合效应模型，构建可重复统计框架，为可持续草地管理决策提供分析支持。",
      },
    ],
    skillsTitle: "技能",
    skillsHeading: "SQL、Python、BI 与业务理解。",
    skills: [
      ["数据分析", "Python", "SQL", "Excel", "统计建模", "市场研究"],
      ["可视化", "Matplotlib", "Seaborn", "数据可视化", "GIS 基础"],
      ["数据处理", "Pandas", "NumPy", "MySQL", "MongoDB", "数据清洗"],
      ["开发支持", "后端支持", "Java", "C", "C#", "Linux", "工作流自动化"],
    ],
    projectsTitle: "项目",
    projectsKicker: "结合统计建模、机器学习和系统开发的精选项目经历。",
    projects: [
      {
        title: "草地产量与可持续管理论文研究",
        meta: "统计建模 / 线性混合效应模型",
        body: "基于 5 年荷兰草地实验数据，分析不同草种混合和集约化管理对干物质产量的影响，并结合土壤质量和生物多样性因素，形成可重复的统计分析框架，支持可持续草地管理实践。",
      },
      {
        title: "毛发样本与秃顶风险分析",
        meta: "机器学习 / 预测分析",
        body: "参与毛发样本数据采集与分析，使用统计和机器学习方法探索样本指标与秃顶风险之间的潜在关系，并建立初步预测模型，为个性化治疗思路提供数据依据。",
      },
      {
        title: "网上购物系统开发",
        meta: "JavaEE / 推荐逻辑 / 后端开发",
        body: "担任项目组组长并参与系统研究，设计数据库结构和后端逻辑，实现核心业务功能并优化系统性能。相关项目中也基于用户历史行为和分类数据设计推荐算法逻辑，提高个性化推荐能力。",
      },
    ],
    cvTitle: "CV",
    cvBody: "CV 页面会在英文模式展示英文 PDF，在中文模式展示中文 PDF，并提供清晰的预览与下载入口。",
    cvButton: "打开 CV 页面",
    contactTitle: "联系",
    contactBody: "欢迎数据分析师岗位、实习机会以及数据分析相关方向的沟通。",
    snapshot: [
      ["求职方向", "数据分析师岗位"],
      ["核心能力", "Python、报告与统计分析"],
      ["工作方式", "结构化、重分析、面向业务"],
    ],
  },
};
