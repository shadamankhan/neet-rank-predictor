const fs = require('fs');
const path = require('path');

// Use absolute path to be certain
const QUIZZES_DIR = 'C:\\Users\\asus\\neet-rank-predictor\\backend\\data\\quizzes';
const SUBJECTS = ['items', 'Chemistry', 'Botany', 'Zoology', 'Physics']; // Added 'items' just in case, but sticking to 4 main

const logStream = fs.createWriteStream('mv_log.txt', { flags: 'a' });
const log = (msg) => {
    console.log(msg);
    logStream.write(msg + '\n');
};

log('Starting organization script...');
log(`Target Directory: ${QUIZZES_DIR}`);

if (!fs.existsSync(QUIZZES_DIR)) {
    log('CRITICAL: Quizzes directory does not exist!');
    process.exit(1);
}

// Create directories
['Physics', 'Chemistry', 'Botany', 'Zoology'].forEach(sub => {
    const dir = path.join(QUIZZES_DIR, sub.toLowerCase());
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            log(`Created directory: ${dir}`);
        } else {
            log(`Directory already exists: ${dir}`);
        }
    } catch (e) {
        log(`Error creating directory ${dir}: ${e.message}`);
    }
});

// Classification Rules
const classifyFile = (filename) => {
    const lower = filename.toLowerCase();

    // Explicit prefixes/keywords
    if (lower.startsWith('b ') || lower.startsWith('botany')) return 'botany';
    if (lower.startsWith('z ') || lower.startsWith('zoology')) return 'zoology';
    if (lower.startsWith('physics') || lower.includes('kinematics') || lower.includes('optics') || lower.includes('motion') || lower.includes('electric') || lower.includes('thermodynamics') || lower.includes('magnetism') || lower.includes('waves') || lower.includes('work') || lower.includes('current') || lower.includes('atoms') || lower.includes('nuclei')) return 'physics';
    if (lower.startsWith('chemistry') || lower.includes('bonding') || lower.includes('atomic') || lower.includes('periodicity') || lower.includes('solution') || lower.includes('equilibrium') || lower.includes('hydrocarbon') || lower.includes('organic') || lower.includes('inorganic') || lower.includes('halo') || lower.includes('amine') || lower.includes('alcohol') || lower.includes('aldehyde') || lower.includes('redox') || lower.includes('structure of atom')) return 'chemistry';

    return null;
};

// Process Files
try {
    const files = fs.readdirSync(QUIZZES_DIR);
    log(`Found ${files.length} files.`);

    files.forEach(file => {
        const fullPath = path.join(QUIZZES_DIR, file);
        if (fs.statSync(fullPath).isDirectory()) return;
        if (!file.endsWith('.json') && !file.endsWith('.pdf')) return;

        const category = classifyFile(file);
        if (category) {
            const destDir = path.join(QUIZZES_DIR, category);
            const destPath = path.join(destDir, file);

            try {
                fs.renameSync(fullPath, destPath);
                log(`Moved: ${file} -> ${category}/${file}`);
            } catch (err) {
                log(`Failed to move ${file}: ${err.message}`);
            }
        } else {
            log(`Skipped (Unclassified): ${file}`);
        }
    });

} catch (err) {
    log(`Error reading directory: ${err.message}`);
}
log('Done.');
