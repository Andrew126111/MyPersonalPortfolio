/**
 * Projects shown in the Projects section. Content comes from the resume.
 *
 * `links` is optional: add a GitHub repo and/or live demo URL and a button appears automatically.
 * `visual` picks the illustrated mock-up drawn for the project (see project-visuals.tsx).
 */
export type Project = {
  name: string;
  date: string;
  tagline: string;
  points: string[];
  stack: string[];
  visual: "facade" | "heuristx";
  links?: { github?: string; demo?: string };
};

export const PROJECTS: Project[] = [
  {
    name: "Façade",
    date: "Feb 2026",
    tagline: "An autonomous AI influencer platform: create a persona, and it plans, generates, and posts its own content.",
    points: [
      "Create AI personas, schedule content, and auto-publish Reels and Stories through the Instagram Graph API.",
      "FastAPI + SQLite backend managing persona state, posting cadence, scheduling, and third-party API calls.",
      "Multimodal media pipeline: Veo 3 for reels, Gemini 2.5 Pro for persona imagery, GPT-4o for scripts and captions, assembled with MoviePy and PIL.",
    ],
    stack: ["Next.js", "React", "Tailwind", "FastAPI", "SQLite", "Instagram Graph API", "Veo 3", "Gemini", "GPT-4o", "MoviePy"],
    visual: "facade",
  },
  {
    name: "HeuristX",
    date: "Jan 2026",
    tagline: "A Chrome extension that watches your trading behaviour in real time and steps in before impulsive decisions.",
    points: [
      "Manifest V3 extension with a service-worker background and content scripts injected into trading platforms.",
      "Real-time behavioural monitoring with in-page HTML/CSS overlays, coordinated through message passing.",
      "Gemini API analyses trading inputs and generates context-aware interventions; session state lives in Chrome storage.",
    ],
    stack: ["JavaScript", "Manifest V3", "Gemini API", "Chrome Storage", "HTML", "CSS"],
    visual: "heuristx",
  },
];
