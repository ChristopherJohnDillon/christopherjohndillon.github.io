// Pure-function tests for charts.js helpers. Run: node scripts/test_charts.mjs
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(dir, '..', 'assets', 'js', 'charts.js'), 'utf8');
// charts.js is wrapped in a top-level IIFE `(function () { ... })();` so its
// internal declarations (niceMax, binCounts) aren't visible outside it. To
// reach them from Node, strip the outer `(function () {` / `})();` wrapper
// so the body's declarations land directly in the new Function's scope,
// and stub the browser-only globals (document/getComputedStyle/window)
// the body touches at load time and at the bottom (window.ReadingCharts=...).
const body = src
  .replace(/^[^]*?\(function\s*\(\)\s*\{/, '')
  .replace(/\}\)\s*\(\s*\)\s*;?\s*$/, '');
const factory = new Function('document', 'getComputedStyle', 'window', body + '\nreturn { niceMax, binCounts };');
const stubDocument = { documentElement: {} };
const stubGetComputedStyle = function () { return { getPropertyValue: function () { return ''; } }; };
const stubWindow = {};
const { niceMax, binCounts } = factory(stubDocument, stubGetComputedStyle, stubWindow);

assert.strictEqual(niceMax(1707, 200), 1800, 'niceMax rounds up to step');
assert.strictEqual(niceMax(46, 10), 50, 'niceMax rounds up to step');
assert.strictEqual(niceMax(0, 10), 10, 'niceMax floors at one step');

const edges = [0, 100, 200, 300];  // bins: [0,100),[100,200),[200,300),[300,inf)
assert.deepStrictEqual(binCounts([50, 150, 150, 999], edges), [1, 2, 0, 1]);

console.log('all passed');
