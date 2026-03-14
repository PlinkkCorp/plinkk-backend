import crypto from "node:crypto";

async function computeSri(url: string) {
  try {
    console.log(`Fetching ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const hash = crypto
      .createHash("sha384")
      .update(Buffer.from(buffer))
      .digest("base64");
    
    const sri = `sha384-${hash}`;
    console.log(`\nSRI Hash for ${url}:`);
    console.log(sri);
    console.log(`\nUsage in HTML:`);
    console.log(`<link rel="stylesheet" href="${url}" integrity="${sri}" crossorigin="anonymous">`);
  } catch (error) {
    console.error("Error computing SRI:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const url = process.argv[2];
if (!url) {
  console.log("Usage: bun scripts/compute-sri.ts <url>");
  process.exit(1);
}

computeSri(url);
