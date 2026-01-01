const fs = require("fs");
const path = require("path");

const outPath = path.resolve(__dirname, "distribution_2024.json");

// Simple synthetic distribution: scores 720 down to 0 with plausible counts
const distribution = [];
for (let s = 720; s >= 0; s--) {
  // shape: fewer at the top, more in mid-range
  const base = Math.max(1, Math.round(1000 * Math.exp(-((720 - s) / 200))));
  const noise = Math.round(Math.random() * Math.max(1, base * 0.5));
  distribution.push({ score: s, count: base + noise });
}

fs.writeFileSync(outPath, JSON.stringify(distribution, null, 2), "utf8");
console.log("Generated sample distribution at", outPath);
