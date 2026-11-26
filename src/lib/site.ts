// Single place for personal info, so copy changes don't mean hunting through components.
export const site = {
  name: "Andrew Nguyen",
  handle: "andrew.n",
  // Shown in the browser tab title and link previews. Change here only.
  role: "Software Engineer",
  // Footer copyright year (static, so the page can be prerendered).
  year: 2026,
  school: "Queen's University",
  // Hero background: me on a hilltop above the Toronto skyline at sunset. Two photos
  // composited (clean skyline shot + me cut out of a second one, hair matted by hand),
  // sharpened, lightly graded. A still (sharp, ~480 KB); the hero adds a slow camera drift.
  // Must stay same-origin: the WebGL ripple uses it as a texture.
  heroMedia: "/hero.webp",
  // Contact extras. Leave empty to hide the card. Both get published on the public site
  // and repo, so only fill them in if you're happy for them to be public.
  //   email:  e.g. "you@example.com" (shown with a copy button)
  //   resume: e.g. "/resume.pdf" after putting the PDF in /public
  email: "ng.andrew2006@gmail.com",
  resume: "",
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
