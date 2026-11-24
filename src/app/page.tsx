import { About } from "@/components/site/about";
import { Hero } from "@/components/site/hero";
import { Nav } from "@/components/site/nav";

// Placeholder sections so the nav links can be tested.
// Each gets replaced with its real component as we build it.
const UPCOMING = [
  { id: "experience", title: "Experience" },
  { id: "projects", title: "Projects" },
  { id: "contact", title: "Contact" },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <About />
        {UPCOMING.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="mx-auto flex min-h-[60svh] w-full max-w-[1200px] scroll-mt-16 flex-col justify-center border-t border-border px-4 py-20 sm:px-6 sm:py-32"
          >
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Coming next
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-[44px]">{s.title}</h2>
          </section>
        ))}
      </main>
    </>
  );
}
