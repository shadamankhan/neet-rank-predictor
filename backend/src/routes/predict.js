const express = require('express');
const router = express.Router();
const { getPrediction } = require('../utils/newPredictor');

// ----------------------
// POST /api/predict OR /api/predict/from-score
// ----------------------
router.post(['/', '/from-score'], (req, res) => {
  try {
    const year = req.body.year || 2026; // Default to 2026 context
    const score = Number(req.body.score);

    if (isNaN(score)) {
      return res.status(400).json({ ok: false, message: 'Missing or invalid score' });
    }

    // Get Data from new CSV
    const result = getPrediction(score);

    if (!result) {
      return res.status(404).json({ ok: false, message: 'No data found for this score.' });
    }

    // Determine the main "Predicted Rank" to show
    // User Request: Predict between 2023 and 2024 data.

    let rank2024 = result.y2024 ? result.y2024.avg : null;
    let rank2023 = result.y2023 ? result.y2023.avg : null;

    let predictedRank = 0;
    let rankText = "N/A";

    if (rank2024 && rank2023) {
      // Average of both
      predictedRank = Math.round((rank2024 + rank2023) / 2);
      rankText = `~${predictedRank.toLocaleString()}`; // e.g. "~15,400"
    } else if (rank2024) {
      predictedRank = rank2024;
      rankText = result.y2024.text;
    } else if (rank2023) {
      predictedRank = rank2023;
      rankText = result.y2023.text;
    } else {
      // Fallback to whatever is available
      const fallback = result.y2025 || result.y2022 || result.y2021;
      if (fallback) {
        predictedRank = fallback.avg;
        rankText = fallback.text;
      }
    }

    const response = {
      ok: true,
      score: score,
      year: year,
      predictedRank: predictedRank,
      rankDisplay: rankText,
      // Provide full history for the chart
      history: {
        2025: result.y2025 ? result.y2025.avg : null,
        2024: result.y2024 ? result.y2024.avg : null,
        2023: result.y2023 ? result.y2023.avg : null,
        2022: result.y2022 ? result.y2022.avg : null,
        2021: result.y2021 ? result.y2021.avg : null,
      },
      // Legacy fields for backward compat
      rankRange: {
        low: predictedRank,
        high: predictedRank
      },
      percentile: 0 // Calculate if total is known, else omit or 0
    };

    return res.json(response);

  } catch (err) {
    console.error('❌ predict error:', err);
    return res.status(500).json({ ok: false, message: err.message || 'Predict failed' });
  }
});

module.exports = router;
