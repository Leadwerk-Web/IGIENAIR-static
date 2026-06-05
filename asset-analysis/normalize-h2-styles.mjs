import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.join(__dirname, "..", "styles.css");

const H2_EXCEPTIONS = [/^\.footer-column\s+h2\b/, /^\.mobile-menu__group\s+h2\b/];

function isExceptionSelector(selector) {
  return selector
    .split(",")
    .map((part) => part.trim())
    .every((part) => H2_EXCEPTIONS.some((re) => re.test(part)));
}

function shouldStripTypography(selector) {
  if (isExceptionSelector(selector)) return false;
  if (/:\s*is\s*\(\s*h2\s*,\s*h3\s*\)/.test(selector)) return false;
  return /\bh2\b/.test(selector);
}

function normalizeSelectorText(selector) {
  return selector.replace(/:\s*is\s*\(\s*h2\s*,\s*h3\s*\)/g, "h3");
}

function processCss(css) {
  const lines = css.split("\n");
  const output = [];
  let depth = 0;
  let collectingH2 = false;
  let selectorParts = [];
  let activeSelector = "";
  let stripTypography = false;
  let h2RuleDepth = null;

  function beginRule(selectorLine) {
    const normalized = normalizeSelectorText(selectorLine);
    if (normalized.includes("{")) {
      const open = normalized.indexOf("{");
      const selector = [...selectorParts, normalized.slice(0, open).trim()]
        .filter(Boolean)
        .join(",\n");
      activeSelector = selector;
      stripTypography = shouldStripTypography(activeSelector);
      collectingH2 = false;
      selectorParts = [];

      const inlineBody = normalized.slice(open + 1).trim();
      if (inlineBody.includes("}")) {
        const body = inlineBody.slice(0, inlineBody.lastIndexOf("}")).trim();
        const kept = stripTypography
          ? body
              .split(";")
              .map((part) => part.trim())
              .filter(Boolean)
              .filter((part) => {
                const prop = part.split(":")[0]?.trim().toLowerCase();
                return prop !== "font-size" && prop !== "font-weight";
              })
              .join("; ")
          : body;
        if (kept || !stripTypography) {
          output.push(`${activeSelector} {${kept ? ` ${kept} ` : ""}}`);
        }
        activeSelector = "";
        stripTypography = false;
        return;
      }

      output.push(`${activeSelector} {`);
      depth += 1;
      h2RuleDepth = depth;
      return;
    }

    selectorParts.push(normalized.replace(/,$/, "").trim());
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (collectingH2) {
      beginRule(line);
      continue;
    }

    const startsH2Rule =
      trimmed &&
      !trimmed.startsWith("@") &&
      !trimmed.startsWith("/*") &&
      !trimmed.startsWith("*") &&
      !trimmed.startsWith("}") &&
      /^[\.#\[>~+:]/.test(trimmed) &&
      /\bh2\b/.test(trimmed);

    if (startsH2Rule) {
      collectingH2 = true;
      selectorParts = [];
      beginRule(line);
      continue;
    }

    if (trimmed.includes("{")) {
      depth += (trimmed.match(/\{/g) || []).length;
    }

    if (trimmed === "}" || trimmed === "};") {
      output.push(line);
      depth -= (trimmed.match(/\}/g) || []).length;
      if (h2RuleDepth !== null && depth < h2RuleDepth) {
        activeSelector = "";
        stripTypography = false;
        h2RuleDepth = null;
      }
      continue;
    }

    if (stripTypography && depth >= 1) {
      if (/^\s*font-size\s*:/.test(line) || /^\s*font-weight\s*:/.test(line)) {
        continue;
      }
    }

    output.push(line);
  }

  return output.join("\n");
}

function injectGlobalH2(css) {
  css = css.replace(
    /(:root \{\n)/,
    `$1  --h2-font-size: clamp(32px, 4vw, 48px);\n  --h2-font-weight: 500;\n\n`
  );

  css = css.replace(
    /(h3 \{\n  font-weight: 600;\n\})/,
    `$1\n\nh2 {\n  font-size: var(--h2-font-size);\n  font-weight: var(--h2-font-weight);\n}`
  );

  css = css.replace(
    /\.section-copy h2,\n\.sectors__copy h2,\n\.sectors__header h2,\n\.cta-band h2 \{\n  font-size: clamp\(32px, 4vw, 48px\);\n  line-height: 1\.14;\n  font-weight: 500;\n  color: var\(--color-primary\);\n\}/,
    `.section-copy h2,
.sectors__copy h2,
.sectors__header h2,
.cta-band h2 {
  line-height: 1.14;
  color: var(--color-primary);
}`
  );

  return css;
}

let css = fs.readFileSync(cssPath, "utf8");
css = processCss(css);
css = injectGlobalH2(css);
css = css.replace(/^[ \t]*[^\n{]+\bh2\b[^\n{]*\{\s*\}\s*\n?/gm, "");
fs.writeFileSync(cssPath, css);
console.log("h2 styles normalized");
