import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const docs = resolve("docs");
const source = await readFile(resolve(docs, "app.js"), "utf8");
const chunkSize = 32_000;
const chunks = [];

for (let offset = 0; offset < source.length; offset += chunkSize) {
  chunks.push(source.slice(offset, offset + chunkSize));
}

await Promise.all(
  chunks.map((chunk, index) =>
    writeFile(
      resolve(docs, `app-part-${index + 1}.js`),
      `window.__LINGUADAY_BUNDLE__=window.__LINGUADAY_BUNDLE__||[];window.__LINGUADAY_BUNDLE__.push(${JSON.stringify(chunk)});\n`,
      "utf8",
    ),
  ),
);

await writeFile(
  resolve(docs, "app-loader.js"),
  `;(0,eval)((window.__LINGUADAY_BUNDLE__||[]).join(""));delete window.__LINGUADAY_BUNDLE__;\n`,
  "utf8",
);

console.log(`Split app.js into ${chunks.length} browser-safe parts.`);
