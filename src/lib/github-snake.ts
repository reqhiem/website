import { GITHUB_REVALIDATE_SECONDS } from "./github";

const SNAKE_SCOPE = ".snake-scope";

// The snake is rendered into the profile-README repo ({user}/{user}), so both
// path segments come from the same username.
const snakeUrl = (username: string) =>
  `https://raw.githubusercontent.com/${username}/${username}/output/snake.svg`;

// Rewrites the SVG's embedded <style> so its `.c` / `.s` / `.u` class selectors
// don't leak to the rest of the page when inlined, and drops the `:root{...}`
// block so our wrapper controls the CSS variables (theme-aware).
const scopeSvgStyles = (css: string, scope: string): string => {
  let out = "";
  let i = 0;
  const n = css.length;
  while (i < n) {
    while (i < n && /\s/.test(css[i])) {
      out += css[i];
      i++;
    }
    if (i >= n) break;

    if (css[i] === "@") {
      // Pass at-rules (incl. @keyframes with nested braces) through untouched.
      const start = i;
      while (i < n && css[i] !== "{") i++;
      let depth = 0;
      while (i < n) {
        if (css[i] === "{") depth++;
        else if (css[i] === "}") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        i++;
      }
      out += css.slice(start, i);
      continue;
    }

    const selStart = i;
    while (i < n && css[i] !== "{") i++;
    const selectorList = css.slice(selStart, i).trim();

    const ruleStart = i;
    let depth = 0;
    while (i < n) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
      i++;
    }
    const rules = css.slice(ruleStart, i);

    if (selectorList === ":root") continue;

    const prefixed = selectorList
      .split(",")
      .map((s) => `${scope} ${s.trim()}`)
      .join(",");
    out += `${prefixed}${rules}`;
  }
  return out;
};

export const loadSnakeSvg = async (username: string): Promise<string | null> => {
  try {
    const res = await fetch(snakeUrl(username), {
      next: { revalidate: GITHUB_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    let svg = await res.text();
    svg = svg.replace(
      /<style>([\s\S]*?)<\/style>/,
      (_match, css: string) => `<style>${scopeSvgStyles(css, SNAKE_SCOPE)}</style>`,
    );
    // Drop hardcoded width/height so the SVG scales via its viewBox.
    svg = svg.replace(/<svg\b([^>]*?)\s+width="[^"]*"/, "<svg$1");
    svg = svg.replace(/<svg\b([^>]*?)\s+height="[^"]*"/, "<svg$1");
    return svg;
  } catch {
    return null;
  }
};
