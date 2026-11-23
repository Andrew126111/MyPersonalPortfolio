"use client";

import { AsciiField } from "./ascii-field";
import { DotSpotlight } from "./dot-spotlight";
import { ShaderField } from "./shader-field";
import { WaterField } from "./water-field";

export const HERO_BACKGROUNDS = [
  "spotlight",
  "water",
  "caustics",
  "topo",
  "ink",
  "ascii",
] as const;
export type HeroBackgroundName = (typeof HERO_BACKGROUNDS)[number];

export function HeroBackground({ name }: { name: HeroBackgroundName }) {
  switch (name) {
    case "spotlight":
      return <DotSpotlight />;
    case "water":
      return <WaterField />;
    case "ascii":
      return <AsciiField />;
    case "ink":
    case "topo":
    case "caustics":
      return <ShaderField key={name} shader={name} />;
  }
}
