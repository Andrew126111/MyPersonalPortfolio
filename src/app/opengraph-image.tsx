import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SIGNATURE_INK, SIGNATURE_VIEWBOX } from "@/components/signature-paths";
import { site } from "@/lib/site";

/*
 * Link-preview card (LinkedIn, iMessage, Slack…), generated once at build time:
 * the skyline hero photo, darkened on the left, with my name, role and signature.
 * Background: assets/og-background.jpg (cropped from the hero composite).
 */

export const alt = `${site.name}, ${site.role}. Portfolio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (w: 500 | 700) =>
  readFile(join(process.cwd(), `node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-${w}-normal.woff`));

export default async function Image() {
  const [bold, medium, bg] = await Promise.all([
    font(700),
    font(500),
    readFile(join(process.cwd(), "assets/og-background.jpg")),
  ]);
  const bgSrc = `data:image/jpeg;base64,${bg.toString("base64")}`;
  const [, , vw, vh] = SIGNATURE_VIEWBOX.split(" ").map(Number);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "Space Grotesk" }}>
        <img src={bgSrc} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0 }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            padding: "72px 80px 0",
          }}
        >
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: "#5ee0ff", fontWeight: 500 }}>
            SOFTWARE ENGINEER · QUEEN&apos;S &apos;28
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: 104,
              lineHeight: 0.95,
              fontWeight: 700,
              letterSpacing: -4,
              color: "#fbf9ef",
              textShadow: "0 4px 30px rgba(0,0,0,0.5)",
            }}
          >
            Andrew Nguyen
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 30, color: "#c3d0df", fontWeight: 500, maxWidth: 640 }}>
            Building AI products that actually ship.
          </div>
        </div>
        {/* signature, bottom left over the dark field */}
        <svg
          width={340}
          height={(340 * vh) / vw}
          viewBox={SIGNATURE_VIEWBOX}
          style={{ position: "absolute", left: 70, bottom: 36 }}
        >
          {SIGNATURE_INK.map((l) => (
            <path key={l.w} d={l.d} fill="none" stroke="#fbf9ef" strokeWidth={l.w} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Space Grotesk", data: bold, weight: 700, style: "normal" },
        { name: "Space Grotesk", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
