import humanizeDuration from "humanize-duration";

export function formatTimeAgo(time: number) {
  const shortEnglishHumanizer = humanizeDuration.humanizer({
    language: "shortEn",
    languages: {
      shortEn: {
        y: () => "y",
        mo: () => "mo",
        w: () => "w",
        d: () => "d",
        h: () => "h",
        m: () => "m",
        s: () => "s",
        ms: () => "ms",
      },
    },
    round: true,
    units: ["h", "m", "s"],
    largest: 2,
    spacer: "",
    delimiter: ", ",
  });
  const now = new Date().getTime();
  const humanized = `${shortEnglishHumanizer(time * 1000 - now)} ago`;

  return humanized === "0s ago" ? "just now" : humanized;
}
