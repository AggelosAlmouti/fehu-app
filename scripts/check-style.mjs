// Design-system guard: `npm run check:style`. A grep-level check (not a
// linter) for the anti-patterns that let the UI drift apart. Fix a hit by
// using the shared piece (see CLAUDE.md, Styling), not by editing this list.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components", "lib"];
const LANDING = "app/(marketing)/page.tsx";
const PRIMITIVES = new Set([
  "components/button.tsx",
  "components/icon-button.tsx",
  "components/icon-toggle-group.tsx",
  "components/pill.tsx",
  "components/meter.tsx",
]);

// Arbitrary values that are genuinely one-off (no named equivalent).
const ARBITRARY_OK = [
  /^w-\[11ch\]$/, // amount input width
  /^h-\[1em\]$/, // wordmark glyph follows its text size
  /^pt-\[max\(/, // safe-area inset
  /^grid-cols-\[/, // hero grid
  /^transition-\[width\]$/, // meter animation
  /^max-h-\[80vh\]$/, // scrollable sheet cap
];

const rules = [
  {
    name: "font size — only text-base is allowed in markup (small/large come from text-label, text-caption, text-hero)",
    test: /(?<![\w-])(?:[a-z]+:)?text-(?:xs|sm|lg|xl|[2-9]xl)(?![\w-])/g,
    allow: (file, m) => file === LANDING && /text-(4xl|5xl)$/.test(m),
  },
  { name: "arbitrary font size", test: /text-\[[0-9.]+(?:px|rem)\]/g },
  {
    name: "border width — use border-2 (dividers count too)",
    test: /(?<![\w:-])border(?:-[btlrxy])?(?![\w/:-])/g,
  },
  { name: "font weight — only font-medium is used", test: /font-(?:thin|extralight|light|normal|semibold|bold|extrabold|black)(?![\w-])/g },
  { name: "raw hex color — use a theme token", test: /#[0-9a-fA-F]{3,8}\b/g, skip: (f) => f === "lib/theme.ts" },
  { name: "rounded-* — use rounded-full or rounded-card", test: /rounded-(?:xs|sm|md|lg|xl|2xl)(?![\w-])|rounded-\[/g },
  { name: "shadow — use the `floating` utility", test: /(?<![\w-])shadow-/g },
  { name: "overlay — use the `scrim` utility", test: /bg-black\/\d+/g },
  {
    name: "gold-outline button recipe — use <Button variant=\"outline\">",
    test: /border-accent\/40|hover:bg-accent\/10/g,
    skip: (f) => PRIMITIVES.has(f),
  },
  { name: "arbitrary icon size — use size-4/5/6", test: /size-\[/g },
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(tsx|ts)$/.test(name) ? [path] : [];
  });
}

const problems = [];
for (const file of ROOTS.flatMap(walk)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((raw, i) => {
    const line = raw.replace(/(^|\s)\/\/.*$/, "$1"); // ignore // comments
    for (const rule of rules) {
      if (rule.skip?.(file)) continue;
      for (const m of line.matchAll(rule.test)) {
        if (rule.allow?.(file, m[0])) continue;
        problems.push(`${file}:${i + 1}  ${rule.name}  (${m[0]})`);
      }
    }
    for (const m of line.matchAll(/[a-z:-]+-\[[^\]]+\]/g)) {
      if (/^(?:text|size|rounded)-\[/.test(m[0]) || ARBITRARY_OK.some((re) => re.test(m[0]))) continue;
      problems.push(`${file}:${i + 1}  arbitrary value — use a named utility  (${m[0]})`);
    }
  });
}

// lib/theme.ts must mirror --background in globals.css.
const css = readFileSync("app/globals.css", "utf8").match(/--background:\s*(#[0-9a-fA-F]+)/)?.[1];
const ts = readFileSync("lib/theme.ts", "utf8").match(/BACKGROUND_COLOR\s*=\s*"(#[0-9a-fA-F]+)"/)?.[1];
if (!css || !ts || css.toLowerCase() !== ts.toLowerCase()) {
  problems.push(`lib/theme.ts  BACKGROUND_COLOR (${ts}) must equal --background in app/globals.css (${css})`);
}

if (problems.length) {
  console.error(problems.join("\n") + `\n\n${problems.length} style problem(s). See CLAUDE.md → Styling.`);
  process.exit(1);
}
console.log("check:style — clean");
