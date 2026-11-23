"use client";

import { AsciiField } from "./ascii-field";
import { DotSpotlight } from "./dot-spotlight";
import { ShaderField } from "./shader-field";

export const HERO_BACKGROUNDS = ["spotlight", "ascii", "ink", "topo"] as const;
export type HeroBackgroundName = (typeof HERO_BACKGROUNDS)[number];

export function HeroBackground({ name }: { name: HeroBackgroundName }) {
  switch (name) {
    case "spotlight":
      return <DotSpotlight />;
    case "ascii":
      return <AsciiField />;
    case "ink":
    case "topo":
      return <ShaderField key={name} shader={name} />;
  }
}
