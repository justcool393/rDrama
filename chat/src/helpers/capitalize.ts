export function capitalize(word: string) {
  return [word[0].toUpperCase()].concat(word.slice(1)).join("");
}
