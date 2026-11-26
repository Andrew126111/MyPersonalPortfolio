// Single place for personal info, so copy changes don't mean hunting through components.
export const site = {
  name: "Andrew Nguyen",
  handle: "andrew.n",
  // Shown in the browser tab title and link previews. Change here only.
  role: "Software Engineer",
  // Footer copyright year (static, so the page can be prerendered).
  year: 2026,
  school: "Queen's University",
  // Hero background video, self-hosted in /public: me on a hilltop above the
  // Toronto skyline at sunset, composited from two shots and turned into a 12 s two-layer
  // parallax loop (skyline + me as separate layers), lightly graded, ~1.1 MB.
  // Must stay same-origin: the WebGL ripple uses it as a texture.
  heroVideo: "/hero.mp4",
  heroPoster: "/hero-poster.jpg",
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
