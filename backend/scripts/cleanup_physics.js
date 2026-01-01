const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../../data/physisPYQ');
if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        if (file.endsWith('_parsed.json')) {
            fs.unlinkSync(path.join(dir, file));
            console.log(`Deleted ${file}`);
        }
    });
} else {
    console.log("Directory not found");
}
