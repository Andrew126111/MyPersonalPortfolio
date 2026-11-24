// Single place for personal info, so copy changes don't mean hunting through components.
export const site = {
  name: "Andrew Nguyen",
  handle: "andrew.n",
  // Shown in the browser tab title and link previews. Change here only.
  role: "Software Engineer",
  school: "Queen's University",
  // Hero background video. Currently the 21st.dev prisma-hero demo clip (hosted by them,
  // ~16 MB). To use your own: put an .mp4 in /public (e.g. /public/hero.mp4) and set "/hero.mp4".
  heroVideo:
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4",
  links: {
    github: "https://github.com/Andrew126111",
    linkedin: "https://www.linkedin.com/in/andrew-nguyenn18",
  },
  nav: [
    { label: "About", href: "#about" },
    { label: "Experience", href: "#experience" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" },
  ],
} as const;
