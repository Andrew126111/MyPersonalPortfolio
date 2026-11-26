/**
 * Photos for the "life outside the terminal" gallery in the About section.
 *
 * To add or swap a photo:
 *   1. Put the image in /public/life/ (portrait 3:4 crops best; ~900px tall is plenty).
 *      Strip location metadata first. Phone photos often carry GPS coordinates.
 *   2. Add an entry below: src "/life/name.jpg", a short title, a one-line caption,
 *      and alt text describing what's in the photo (for screen readers).
 *   3. Optional `focus` sets which part stays in frame when the photo is cropped
 *      (CSS object-position, e.g. "50% 70%" keeps the lower middle). Default is centre.
 *
 * Order matters: the first photo leads the tunnel next to "HI, I'M ANDREW."
 * 8–12 photos feels best.
 */
export type LifePhoto = {
  src: string;
  title: string;
  caption: string;
  alt: string;
  focus?: string;
};

export const LIFE: LifePhoto[] = [
  {
    src: "/life/half-marathon.jpg",
    title: "Toronto Half Marathon",
    caption: "Finished strong in 2:07:47. The knee brace did some heavy lifting.",
    alt: "Andrew on a finish-line podium holding a Toronto Half Marathon medal, with a 2:07:47 clock behind him",
    focus: "50% 40%",
  },
  {
    src: "/life/vietnam-stream.jpg",
    title: "Fairy Stream, Vietnam",
    caption: "Barefoot through a red sand canyon. Shoes were optional, sunscreen was not.",
    alt: "People wading up a shallow orange stream beside red sand cliffs and palm trees",
  },
  {
    src: "/life/volleyball-champs.jpg",
    title: "Intramural champs",
    caption: "Queen's intramural volleyball. We came for the games, stayed for the free shirts.",
    alt: "Four teammates in a gym holding up intramural champion shirts in front of a volleyball net",
    focus: "50% 45%",
  },
  {
    src: "/life/study-setup.jpg",
    title: "8am at Common Ground",
    caption: "Overnight oats, a SQL project and a to-do list. The usual setup.",
    alt: "A laptop with SQL code open, an iPad to-do list, overnight oats and a shaker bottle on a cafe table",
  },
  {
    src: "/life/gorge-hike.jpg",
    title: "Gorge day",
    caption: "Wading the river while someone slacklines way, way overhead.",
    alt: "People wading a shallow river below tall tree-covered cliffs, with a slackliner high above and a bridge in the distance",
  },
  {
    src: "/life/ultimate.jpg",
    title: "Ultimate",
    caption: "Pivoting past the mark. Ultimate frisbee is the most fun cardio there is.",
    alt: "Two players on a grass field, one crouching low to throw a frisbee past a defender",
    focus: "50% 75%",
  },
  {
    src: "/life/tacos.jpg",
    title: "Taco night",
    caption: "End-of-week tradition. Birria tacos and a grapefruit something.",
    alt: "Two trays of tacos topped with cheese and pico de gallo next to colourful drinks",
    focus: "50% 60%",
  },
  {
    src: "/life/concert.jpg",
    title: "Live music",
    caption: "Nosebleed seats, front-row energy.",
    alt: "A concert stage glowing green and pink, with the crowd in silhouette",
  },
  {
    src: "/life/post-race.jpg",
    title: "Recovery mode",
    caption: "Medal on, shades on, legs off.",
    alt: "A selfie in a library lounge chair wearing sport sunglasses and holding a race medal, a friend on their phone nearby",
    focus: "35% 50%",
  },
  {
    src: "/life/homecoming.jpg",
    title: "The crew",
    caption: "Queen's colours, a sunny fall day and my favourite people.",
    alt: "A group of friends in Queen's shirts squeezed together for a sunny selfie",
    focus: "45% 50%",
  },
];
