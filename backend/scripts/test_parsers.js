const path = require('path');
const { parseUP, parseKerala, parseTN } = require('../src/utils/stateParsers');

// Correct relative paths from backend/scripts/
const upPath = path.join(__dirname, '../../data/utterpardashprivate2025.csv');
const keralaPath = path.join(__dirname, '../../data/keralaprivate2025r1r2.csv');
const tnPath = path.join(__dirname, '../../data/tamilnaduPRIVATER1r22025.csv');

console.log("Testing Parsers...");

const upData = parseUP(upPath);
console.log(`UP Data: ${upData.length} colleges found.`);
if (upData.length > 0) console.log("Sample UP:", upData[0]);

const keralaData = parseKerala(keralaPath);
console.log(`Kerala Data: ${keralaData.length} colleges found.`);
if (keralaData.length > 0) console.log("Sample Kerala:", keralaData[0]);

const tnData = parseTN(tnPath);
console.log(`TN Data: ${tnData.length} colleges found.`);
if (tnData.length > 0) console.log("Sample TN:", tnData[0]);
