const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'generated');
const dest = path.join(__dirname, 'dist', 'generated');

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

if (fs.existsSync(src)) {
    copyDir(src, dest);
    console.log('Copied generated files to dist/generated');
} else {
    console.log('No generated files found to copy');
}
