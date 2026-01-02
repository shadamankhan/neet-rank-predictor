const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const DATA_PATH = path.join(__dirname, '../../data/2020to2025total.csv');

router.get('/exam-overview', (req, res) => {
    try {
        console.log(`[Stats] Checking path: ${DATA_PATH}`);
        if (!fs.existsSync(DATA_PATH)) {
            console.error(`[Stats] File NOT found at ${DATA_PATH}`);
            return res.status(404).json({ error: 'Stats data file not found' });
        }


        const fileContent = fs.readFileSync(DATA_PATH, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Clean keys if necessary, but serving raw might be fine
        // "Exam Year", "Gen Marks", etc.
        // Let's just return as is, maybe parsing numbers.
        const transformed = records.map(record => {
            const newRec = { ...record };
            // Convert numeric fields from strings to numbers where possible
            Object.keys(newRec).forEach(key => {
                // Try to parse number if it looks like one (ignore Year string like "NEET 2020")
                if (key !== "Exam Year") {
                    const val = parseFloat(newRec[key]);
                    if (!isNaN(val)) {
                        newRec[key] = val;
                    }
                }
            });
            return newRec;
        });

        res.json(transformed);
    } catch (err) {
        console.error('Error reading exam stats:', err);
        res.status(500).json({ error: 'Failed to fetch exam stats' });
    }
});

module.exports = router;
