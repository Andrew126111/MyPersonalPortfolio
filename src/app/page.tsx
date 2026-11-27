import { About } from "@/components/site/about";
import { Contact } from "@/components/site/contact";
import { Experience } from "@/components/site/experience";
import { Hero } from "@/components/site/hero";
import { Intro } from "@/components/site/intro";
import { Nav } from "@/components/site/nav";
import { Projects } from "@/components/site/projects";
import { Sky } from "@/components/site/sky";

export default function Home() {
  return (
    <>
      {/* "Signed, Andrew": opening intro on the first visit of a session */}
      <Intro />
      {/* one fixed sky behind the whole page: blue hour into night as you scroll */}
      <Sky />
      <Nav />
      <main className="flex-1">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Contact />
      </main>
    </>
  );
}
