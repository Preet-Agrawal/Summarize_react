// Simple standalone check for the adaptive-difficulty rule logic.
// Run with: node test-difficulty.js
// No test framework (jest/mocha) — the project doesn't use one, and this
// is a handful of pure-function checks, not worth adding a dependency for.

const assert = require('assert');
const { computeAverageScore, decideDifficulty } = require('./difficulty');

function attempt(score, totalQuestions, difficulty) {
  return { score, totalQuestions, difficulty };
}

let passed = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`FAIL: ${name}`);
    console.log(`  ${e.message}`);
  }
}

// --- computeAverageScore ---

check('cold start: no attempts -> null', () => {
  assert.strictEqual(computeAverageScore([]), null);
});

check('single perfect attempt -> avg 1', () => {
  const avg = computeAverageScore([attempt(5, 5, 'medium')]);
  assert.strictEqual(avg, 1);
});

check('mixed attempts -> correct average', () => {
  // 4/5, 2/5, 3/5 -> (0.8 + 0.4 + 0.6) / 3 = 0.6
  const avg = computeAverageScore([attempt(4, 5, 'medium'), attempt(2, 5, 'medium'), attempt(3, 5, 'medium')]);
  assert.ok(Math.abs(avg - 0.6) < 1e-9, `expected ~0.6, got ${avg}`);
});

check('backward compat: missing totalQuestions defaults to 5', () => {
  const avg = computeAverageScore([{ score: 4, difficulty: 'medium' }]); // no totalQuestions field
  assert.strictEqual(avg, 0.8);
});

// --- decideDifficulty ---

check('cold start: no avg score -> stays at current (medium)', () => {
  assert.strictEqual(decideDifficulty('medium', null), 'medium');
});

check('high score from medium -> levels up to hard', () => {
  assert.strictEqual(decideDifficulty('medium', 0.8), 'hard');
});

check('high score from easy -> levels up to medium', () => {
  assert.strictEqual(decideDifficulty('easy', 0.9), 'medium');
});

check('low score from medium -> levels down to easy', () => {
  assert.strictEqual(decideDifficulty('medium', 0.4), 'easy');
});

check('low score from hard -> levels down to medium', () => {
  assert.strictEqual(decideDifficulty('hard', 0.2), 'medium');
});

check('mid score -> stays at current difficulty', () => {
  assert.strictEqual(decideDifficulty('medium', 0.6), 'medium');
});

check('cap: already hard + high score -> stays hard', () => {
  assert.strictEqual(decideDifficulty('hard', 1), 'hard');
});

check('floor: already easy + low score -> stays easy', () => {
  assert.strictEqual(decideDifficulty('easy', 0), 'easy');
});

// --- end-to-end scenario using both functions together ---

check('scenario: 3 great attempts on medium -> next quiz is hard', () => {
  const recent = [attempt(5, 5, 'medium'), attempt(4, 5, 'medium'), attempt(5, 5, 'medium')];
  const avg = computeAverageScore(recent);
  const next = decideDifficulty(recent[0].difficulty, avg);
  assert.strictEqual(next, 'hard');
});

check('scenario: 3 poor attempts on hard -> next quiz drops to medium', () => {
  const recent = [attempt(1, 5, 'hard'), attempt(2, 5, 'hard'), attempt(1, 5, 'hard')];
  const avg = computeAverageScore(recent);
  const next = decideDifficulty(recent[0].difficulty, avg);
  assert.strictEqual(next, 'medium');
});

console.log(`\n${passed} passed`);
if (passed !== 14) {
  console.log('Some checks failed — see FAIL lines above.');
  process.exit(1);
}
