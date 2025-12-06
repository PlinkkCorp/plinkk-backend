
const { generateBundle } = require('./generateBundle');

async function test() {
    try {
        const js = await generateBundle();
        console.log("Bundle generated, length:", js.length);
        console.log("First 100 chars:", js.substring(0, 100));
    } catch (e) {
        console.error("Error generating bundle:", e);
    }
}

test();
