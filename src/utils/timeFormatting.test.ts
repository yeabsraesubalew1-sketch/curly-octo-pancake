import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPeriodTime, formatLunchBreakTime } from './timeFormatting';

test('formats period ranges in 12-hour clock', () => {
  assert.equal(formatPeriodTime(1), '8:30 AM – 9:20 AM');
  assert.equal(formatPeriodTime(4), '11:15 AM – 12:05 PM');
  assert.equal(formatPeriodTime(5), '1:30 PM – 2:20 PM');
  assert.equal(formatPeriodTime(8), '4:15 PM – 5:05 PM');
});

test('formats lunch break in 12-hour clock', () => {
  assert.equal(formatLunchBreakTime(), '12:05 PM – 1:30 PM');
});
