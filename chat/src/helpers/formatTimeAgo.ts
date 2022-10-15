import humanizeDuration from "humanize-duration";

type FormatTimeAgoOptions = {
  timestamp: number;
  edited: false | number;
  showTimestamp?: boolean;
};

export function formatTimeAgo(options: FormatTimeAgoOptions) {
  const showTimestamp = options.showTimestamp ?? true;
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
    units: ["h", "m"],
    largest: 2,
    spacer: "",
    delimiter: "",
  });
  const now = new Date().getTime();
  const toFormat: string[] = [];

  if (showTimestamp) {
    const humanizedTimeAgo = `${shortEnglishHumanizer(
      options.timestamp * 1000 - now
    )} ago`;
    const finalTimeAgo =
      humanizedTimeAgo === "0m ago" ? "recently" : humanizedTimeAgo;

    toFormat.push(finalTimeAgo);
  }

  if (options.edited) {
    const humanizedEdited = `(edited ${shortEnglishHumanizer(
      options.edited * 1000 - now
    )} ago)`;
    const finalEdited =
      humanizedEdited === "0m ago" ? "recently" : humanizedEdited;

    toFormat.push(finalEdited);
  }

  return toFormat.join(" ");
}
