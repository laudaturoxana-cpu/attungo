import { ro } from "./ro";
import { en } from "./en";

export type Lang = "ro" | "en";

export function t(lang: Lang) {
  return lang === "en" ? en : ro;
}

export { ro, en };
