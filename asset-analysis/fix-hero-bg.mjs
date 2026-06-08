import fs from 'fs';

const path = new URL('../styles.css', import.meta.url);
let css = fs.readFileSync(path, 'utf8');

css = css.replace(
  /background:\s*\n\s*(var\(--[^)]+\)|url\([^)]+\))\s+([^/;]+)\s*\/\s*cover\s+no-repeat;/g,
  (_, image, position) => {
    const pos = position.trim().replace(/\s+/g, ' ');
    return `--hero-bg-image: ${image};\n  --hero-bg-position: ${pos};`;
  }
);

css = css.replace(
  /\.page-energy \.company-hero\{([^}]*?)background:var\((--[^)]+)\)\s+([^/;]+)\/cover no-repeat/g,
  (_, rest, v, pos) =>
    `.page-energy .company-hero{${rest}--hero-bg-image:var(${v});--hero-bg-position:${pos.trim()}`
);

css = css.replace(
  /background-image: (url\(\.\/[^)]+\)|var\([^)]+\));\n  background-position: ([^;]+);\n  background-size: cover;\n/g,
  (_, image, position) =>
    `--hero-bg-image: ${image};\n  --hero-bg-position: ${position.trim()};\n`
);

fs.writeFileSync(path, css);
console.log('done');
