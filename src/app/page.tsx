import { About } from "@/components/site/about";
import { CloudTransition } from "@/components/site/cloud-transition";
import { Hero } from "@/components/site/hero";
import { Nav } from "@/components/site/nav";
import { Projects } from "@/components/site/projects";

// Placeholder for sections not built yet, so the nav links still work.
function Placeholder({ id, title }: { id: string; title: string }) {
  return (
    <section
      id={id}
      className="mx-auto flex min-h-[60svh] w-full max-w-[1200px] scroll-mt-16 flex-col justify-center border-t border-border px-4 py-20 sm:px-6 sm:py-32"
    >
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
        Coming next
      </p>
      <h2 className="mt-3 text-3xl font-bold sm:text-[44px]">{title}</h2>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        {/* fixed overlay: clouds roll in as the hero leaves, then part to reveal About */}
        <CloudTransition />
        <About />
        <Placeholder id="experience" title="Experience" />
        <Projects />
        <Placeholder id="contact" title="Contact" />
      </main>
    </>
  );
}
