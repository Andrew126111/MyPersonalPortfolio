/**
 * Photos for the "life outside the terminal" gallery in the About section.
 *
 * To use your own photos:
 *   1. Put the image files in /public/life/ (e.g. /public/life/hiking.jpg). Portrait (3:4) crops best.
 *   2. Replace each entry below: src "/life/hiking.jpg", a short title, a one-line caption,
 *      and alt text describing what's in the photo (for screen readers).
 *
 * Any number of photos works; 8–12 feels best.
 * The placeholders below are stock images from the 21st.dev demo.
 */
export type LifePhoto = {
  src: string;
  title: string;
  caption: string;
  alt: string;
};

const CDN = "https://cdn.21st.dev/assets/mirror";

export const LIFE: LifePhoto[] = [
  `${CDN}/4d/4d1bff4ea8b9f400dff7ae405f92e15bd39ec76e9285c7d96017e64ba1de3ae1.jpg`,
  `${CDN}/ee/ee36e332fe99d7611c43b90511db08a4f84e4545caa78e7b52e9ccffe273864b.jpg`,
  `${CDN}/dd/dddeaa4e6132c65bf7ff99d197f792a30937b5cbfe97a2b1ee54a793684df52e.jpg`,
  `${CDN}/48/487977107b5011b5e1c25289f6e4393ef555e1a92daee554788e9363b233ca14.jpg`,
  `${CDN}/a1/a12509688be6c9d3b2cb26d2ea1cfce48b8a8dbf2653e17be8a3fc31bd69f162.jpg`,
  `${CDN}/05/051f9e565b5b0b221384d9c27a0760febc3fb48d190c046adfda579f3614c958.jpg`,
  `${CDN}/87/87d4f60a4465d19d14b8acefa46275df4ccd767ccea6d7f234ea5bad99cfec56.jpg`,
  `${CDN}/06/0610989e0675a12c02d35aa5464e2644bf77913214b748b73a894808d2d79877.jpg`,
  `${CDN}/fe/fe90b90751e671a9526134c4743e2fcbf6c1a24991aba273ad7418c88fc9c701.jpg`,
  `${CDN}/2e/2e0452c1994fcc2130a1b8ef68e34b5ea52d1b35b80dde09b99349ad1de54598.jpg`,
].map((src, i) => ({
  src,
  title: `Placeholder ${String(i + 1).padStart(2, "0")}`,
  caption: "Swap in your own photo and a one-line story about it.",
  alt: "Placeholder stock photo",
}));
