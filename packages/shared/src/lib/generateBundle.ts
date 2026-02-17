import { build } from "esbuild";
import { existsSync } from "fs";
import path from "path";

export async function generateBundle(basePath?: string) {
  const entryFile = basePath
    ? path.join(basePath, "js", "init.js")
    : path.join(__dirname, "..", "public", "js", "init.js");
  if (!existsSync(entryFile)) {
    return `// Fichier JS non trouvé : ${entryFile}`;
  }

  const result = await build({
    entryPoints: [entryFile],
    bundle: true,
    minify: true,
    platform: "browser",
    format: "esm",
    write: false,
    banner: {
      js: "// JavaScript made by PlinkkCorp Dev",
      css: "/* CSS made by PlinkkCorp Dev */",
    },
    legalComments: "eof",
    drop: ["console"],
  });

  const js = result.outputFiles[0].text;
  return js
}