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
    caption: "This is me at my first half marathon. Running is how I clear my head, and crossing that finish line proved I can do hard things one kilometre at a time.",
    alt: "Andrew on a finish-line podium holding a Toronto Half Marathon medal, with a 2:07:47 clock behind him",
    focus: "50% 40%",
  },
  {
    src: "/life/vietnam-stream.jpg",
    title: "Vietnam",
    caption: "One of my favourite places I've ever travelled to. The food, the people, wading barefoot through red sand canyons. I'd go back in a heartbeat.",
    alt: "People wading up a shallow orange stream beside red sand cliffs and palm trees in Vietnam",
  },
  {
    src: "/life/volleyball-champs.jpg",
    title: "Volleyball",
    caption: "I play volleyball any chance I get. Nothing beats a close game with a team that has your back.",
    alt: "Four teammates in a gym holding up intramural champion shirts in front of a volleyball net",
    focus: "50% 45%",
  },
  {
    src: "/life/study-setup.jpg",
    title: "Early mornings at CoGro",
    caption: "I try to get up early and knock out my tasks before the day gets busy. This is me at CoGro, a coffee spot on campus, with overnight oats and a to-do list.",
    alt: "A laptop with SQL code open, an iPad to-do list, overnight oats and a shaker bottle on a table at CoGro, a campus coffee spot",
  },
  {
    src: "/life/gorge-hike.jpg",
    title: "Outdoors",
    caption: "I'm happiest outside. Give me a trail, a river or a cliff to stare up at and I'm set for the day.",
    alt: "People wading a shallow river below tall tree-covered cliffs, with a slackliner high above and a bridge in the distance",
  },
  {
    src: "/life/ultimate.jpg",
    title: "Ultimate",
    caption: "I've played ultimate frisbee since high school and I still play now. It's competitive, but it's all about the spirit of the game.",
    alt: "Two players on a grass field, one crouching low to throw a frisbee past a defender",
    focus: "50% 75%",
  },
  {
    src: "/life/tacos.jpg",
    title: "Food",
    caption: "I'm a big foodie, and eating is easily my favourite thing to do. These were from an authentic Mexican spot on Dupont St in Toronto.",
    alt: "Two trays of tacos topped with cheese and pico de gallo next to colourful drinks at a Mexican restaurant",
    focus: "50% 60%",
  },
  {
    src: "/life/concert.jpg",
    title: "Joji",
    caption: "One of four concerts I went to in the summer of 2026. Live music hits different, and I'll always say yes, no matter how far back the seats are.",
    alt: "Joji performing on a stage glowing green and pink, with the crowd in silhouette",
  },
  {
    src: "/life/post-race.jpg",
    title: "Mississauga Marathon",
    caption: "The full marathon was way, way harder than the half. Every kilometre after 30 was a negotiation with my legs, but I finished it.",
    alt: "Andrew resting in a library lounge chair after the Mississauga Marathon, wearing sport sunglasses and holding his medal, a friend nearby",
    focus: "35% 50%",
  },
  {
    src: "/life/homecoming.jpg",
    title: "Friends",
    caption: "My friends are a huge part of my life. They keep me grounded, push me to be better and make everything more fun.",
    alt: "A group of friends in Queen's shirts squeezed together for a sunny selfie",
    focus: "45% 50%",
  },
];
