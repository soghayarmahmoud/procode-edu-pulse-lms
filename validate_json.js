const fs = require('fs');
try {
    const data = fs.readFileSync('data/lessons.json', 'utf8');
    JSON.parse(data);
    console.log('JSON is valid!');
} catch (e) {
    console.error('JSON is INVALID:', e.message);
    process.exit(1);
}
