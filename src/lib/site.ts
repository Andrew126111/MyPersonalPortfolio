// Single place for personal info, so copy changes don't mean hunting through components.
export const site = {
  name: "Andrew Nguyen",
  handle: "andrew.n",
  // Shown in the browser tab title and link previews. Change here only.
  role: "AI Product Engineer",
  school: "Queen's University",
  links: {
    github: "https://github.com/Andrew126111",
    linkedin: "https://www.linkedin.com/in/andrew-nguyenn18",
  },
  nav: [
    { label: "About", href: "#about" },
    { label: "Experience", href: "#experience" },
    { label: "Projects", href: "#projects" },
  ],
} as const;
