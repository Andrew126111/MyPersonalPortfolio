/**
 * Roles shown in the Experience section. Content comes from the resume.
 * `visual` picks the scroll-driven illustration drawn next to the role (experience-visuals.tsx).
 */
export type Stat = { value: number; prefix?: string; suffix?: string; label: string };

export type Role = {
  company: string;
  via?: string;
  title: string;
  dates: string;
  location: string;
  summary: string;
  points: string[];
  stats: Stat[];
  stack: string[];
  visual: "flight" | "pipeline";
};

export const ROLES: Role[] = [
  {
    company: "CoTriplyy",
    title: "AI Product Engineering Intern",
    dates: "Jan 2026 – Mar 2026",
    location: "Toronto, ON",
    summary: "Helped launch an AI-powered travel concierge MVP, from flight search to checkout.",
    points: [
      "Integrated the Duffel Flights API for real-time search across 300+ airlines and the first beta booking flows.",
      "Built a CAD/USD multi-currency checkout on the Stripe API, validating 50+ sandbox transactions with 100% successful payments before release.",
      "Ran 20+ structured QA scenarios and fixed bugs across conversational logic, booking workflows, and Resend email notifications.",
    ],
    stats: [
      { value: 300, suffix: "+", label: "airlines searchable" },
      { value: 100, suffix: "%", label: "payment success in testing" },
      { value: 20, suffix: "+", label: "QA scenarios run" },
    ],
    stack: ["Duffel API", "Stripe API", "Resend", "Conversational AI"],
    visual: "flight",
  },
  {
    company: "Wayfair",
    via: "via Extern",
    title: "AI Automation Extern",
    dates: "Jan 2026 – Mar 2026",
    location: "Toronto, ON",
    summary: "Built AI pipelines that turn messy market and competitor data into ready-to-use intelligence.",
    points: [
      "Built 4 containerized AI automation workflows in n8n (Docker), orchestrating Google Gemini and Mistral across multi-model pipelines.",
      "Combined Amazon scraping, social trend APIs, and HuggingFace image generation, with custom JavaScript parsing, regex validation, and conditional routing.",
      "Created a Dashboard Builder Agent that merges multi-source LLM output into HTML reports and live Google Sheets/Slides, cutting insight time from hours to under a minute.",
      "Benchmarked pricing and positioning across 6 monthly competitor releases with LLM-driven extraction.",
    ],
    stats: [
      { value: 4, label: "AI workflows shipped" },
      { value: 1, prefix: "<", suffix: " min", label: "insight time (was hours)" },
      { value: 6, label: "competitor releases / month" },
    ],
    stack: ["n8n", "Docker", "Gemini", "Mistral", "HuggingFace", "JavaScript", "Google Sheets/Slides"],
    visual: "pipeline",
  },
];
