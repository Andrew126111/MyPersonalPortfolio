import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const description = "Computing (AI) student at Queen's University building full-stack AI products.";

export const metadata: Metadata = {
  // Until site.url is set (at deploy), previews resolve against localhost.
  metadataBase: new URL(site.url || "http://localhost:3000"),
  title: `${site.name} — ${site.role}`,
  description,
  openGraph: {
    type: "website",
    title: `${site.name} — ${site.role}`,
    description,
    siteName: site.name,
  },
  twitter: { card: "summary_large_image", title: `${site.name} — ${site.role}`, description },
};

// Runs before first paint: decides whether the opening intro plays (first visit in this session,
// no deep link, motion allowed) so return visitors never see it flash. See components/site/intro.tsx.
// Inline (not in globals.css) so it applies on the very first paint, before any stylesheet loads:
// hide the intro when skipped or done, keep the nav logo hidden until the hand-off, and a failsafe
// that hides the overlay after 7 s even if its script never runs.
const INTRO_CSS = `html[data-intro=skip] #intro,html[data-intro=done] #intro{display:none}html[data-intro=play] [data-logo]{opacity:0}#intro{animation:intro-failsafe 0s linear 7s forwards}@keyframes intro-failsafe{to{visibility:hidden;opacity:0;pointer-events:none}}`;

const INTRO_SCRIPT = `(function(){var d=document.documentElement;try{var skip=sessionStorage.getItem('intro-seen')||location.hash.length>1||matchMedia('(prefers-reduced-motion: reduce)').matches;d.dataset.intro=skip?'skip':'play'}catch(e){d.dataset.intro='skip'}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-intro="play"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: INTRO_CSS }} />
        <noscript>
          <style>{`#intro{display:none}`}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
