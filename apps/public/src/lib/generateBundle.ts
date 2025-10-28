import { build } from "esbuild";
import { existsSync } from "fs";
import path from "path";

export async function generateBundle() {
    const entryFile = path.join(__dirname, "..", "public", "js", "init.js");
        if (!existsSync(entryFile)) {
          return "// Fichier JS non trouvé";
          return;
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