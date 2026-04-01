const fs = require('fs');
const path = require('path');

function copyAsset(src, dest) {
    if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true });
        console.log(`Copied ${src} to ${dest}`);
    } else {
        console.warn(`Warning: Asset ${src} not found.`);
    }
}

// Ensure dist exists
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Copy data directory
copyAsset('data', 'dist/data');

// Copy individual files
const files = ['logo.png', 'linux.png', 'cpp.png', 'html.png', 'manifest.json', 'sw.js', 'browserconfig.xml'];
files.forEach(file => copyAsset(file, path.join('dist', file)));

console.log('Static assets copied successfully.');
