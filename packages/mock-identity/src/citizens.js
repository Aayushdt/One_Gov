// Consolidated: delegates to the canonical shared deterministic dataset.
// In Docker, scripts/ is copied to /app/scripts/ (one level up from /app/src/).
// DO NOT add independent citizen data here — edit scripts/deterministic_50_citizens.js instead.
module.exports = require('../scripts/deterministic_50_citizens');

