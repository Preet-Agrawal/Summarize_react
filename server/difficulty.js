// Adaptive difficulty — rule-based, not ML.
// Score -> difficulty is a simple monotonic relationship (better score,
// harder questions), fully captured by a threshold rule. ML would need
// thousands of labeled attempts we don't have, and would overfit a
// relationship this simple — pure overengineering.

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

// avgScore = average of (score / totalQuestions) across the given attempts.
// Pass only completed attempts (score != null); returns null if none.
function computeAverageScore(scoredAttempts) {
  if (!scoredAttempts.length) return null;
  const total = scoredAttempts.reduce((sum, r) => sum + r.score / (r.totalQuestions || 5), 0);
  return total / scoredAttempts.length;
}

// currentDifficulty is where the user was; avgScore is their recent performance.
// avgScore === null means we have no completed attempts to judge performance,
// so we hold at currentDifficulty rather than guessing.
function decideDifficulty(currentDifficulty, avgScore) {
  const idx = DIFFICULTY_LEVELS.indexOf(currentDifficulty);
  if (avgScore === null) return currentDifficulty;
  if (avgScore >= 0.8) return DIFFICULTY_LEVELS[Math.min(idx + 1, DIFFICULTY_LEVELS.length - 1)];
  if (avgScore <= 0.4) return DIFFICULTY_LEVELS[Math.max(idx - 1, 0)];
  return currentDifficulty;
}

module.exports = { DIFFICULTY_LEVELS, computeAverageScore, decideDifficulty };
