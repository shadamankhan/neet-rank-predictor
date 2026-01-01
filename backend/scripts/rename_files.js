const fs = require('fs');
const path = require('path');

const DIRECTORY = 'c:\\Users\\asus\\neet-rank-predictor\\data\\chemistryPYQ';
console.log("Scanning directory:", DIRECTORY);

const fileMap = {
    'AMINES - 20 Years': 'AMINES',
    'ATOMIC STRUCTURE - 20 Years': 'ATOMIC STRUCTURE',
    'Alcohols,Phenols': 'Alcohols Phenols and Ethers',
    'Aldehydes': 'Aldehydes Ketones and Carboxylic Acids',
    'CHEMICAL BONDING - 20 Years': 'CHEMICAL BONDING',
    'CHEMICAL KINETICS': 'CHEMICAL KINETICS',
    'COORDINATION COMPOUNDS': 'COORDINATION COMPOUNDS',
    'Classification_of_Elements': 'Classification of Elements',
    'D AND F BLOCK': 'D AND F BLOCK ELEMENTS',
    'ELECTROCHEMISTRY': 'ELECTROCHEMISTRY',
    'EQUILIBRIUM': 'EQUILIBRIUM',
    'HALOALKANE': 'HALOALKANE AND HALOARENES',
    'HydroCarbon': 'HydroCarbon',
    'P - BLOCK': 'P BLOCK 11TH',
    'REDOX REACTION': 'REDOX REACTION',
    'SOLUTION': 'SOLUTION',
    'THERMODYNAMICS': 'THERMODYNAMICS'
};

fs.readdir(DIRECTORY, (err, files) => {
    if (err) throw err;

    files.forEach(file => {
        if (!file.match(/Garima|Goel/i)) return;

        let targetBase = null;
        for (const [key, val] of Object.entries(fileMap)) {
            // Case insensitive check if file starts with key (ignoring potential junk at start if any, but usually starts with it)
            if (file.toLowerCase().includes(key.toLowerCase())) {
                targetBase = val;
                break;
            }
        }

        if (!targetBase) {
            console.log("No partial match found for:", file);
            return;
        }

        // Determine extension/suffix
        let suffix = '.pdf';
        if (file.toLowerCase().includes('parsed.json')) suffix = '_parsed.json';
        else if (file.toLowerCase().includes('clean.pdf')) suffix = '_New_Clean.pdf';
        // Handle the .pdf.pdf case by just ignoring it, we reconstruct targetName completely.

        // Wait, if input is "Foo.pdf.pdf", and we output "Foo.pdf", that's fine.
        // If input is "Foo_parsed.json.pdf", we might want "Foo_parsed.json".

        // Special case handling
        if (file.includes('parsed.json.pdf')) suffix = '_parsed.json'; // weird file we saw

        let targetFile = targetBase + suffix;
        const oldPath = path.join(DIRECTORY, file);
        const newPath = path.join(DIRECTORY, targetFile);

        if (fs.existsSync(newPath)) {
            console.log(`Target ${targetFile} exists. Deleting ${file}`);
            try {
                fs.unlinkSync(oldPath);
            } catch (e) { console.error("Error deleting:", e); }
        } else {
            console.log(`Renaming ${file} -> ${targetFile}`);
            try {
                fs.renameSync(oldPath, newPath);
            } catch (e) { console.error("Error renaming:", e); }
        }
    });
});
