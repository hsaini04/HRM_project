import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deriveEnrollmentStatus } from '../services/enrollmentStatus.js';
import { calculateGap, gapSeverity, isPriorityGap } from '../services/gapService.js';

describe('skill-gap calculation', () => {
  it('is required level minus current level', () => {
    assert.equal(calculateGap(4, 2), 2);
    assert.equal(calculateGap(3, 2), 1);
    assert.equal(calculateGap(3, 3), 0);
  });

  it('never reports a negative gap when the employee exceeds the requirement', () => {
    assert.equal(calculateGap(2, 4), 0);
    assert.equal(gapSeverity(calculateGap(2, 4)), 'None');
  });

  it('returns null when the competency has not been assessed', () => {
    assert.equal(calculateGap(3, null), null);
    assert.equal(gapSeverity(null), 'Not assessed');
  });

  it('classifies severity and priority', () => {
    assert.equal(gapSeverity(1), 'Moderate');
    assert.equal(gapSeverity(2), 'High');
    assert.equal(gapSeverity(3), 'Critical');
    assert.equal(isPriorityGap(1), false);
    assert.equal(isPriorityGap(2), true);
  });
});

describe('enrolment status derivation', () => {
  const now = new Date('2026-11-01T10:00:00Z');
  const future = new Date('2026-11-20T00:00:00Z');
  const past = new Date('2026-10-25T00:00:00Z');

  it('maps progress to Not Started / In Progress / Completed', () => {
    assert.equal(deriveEnrollmentStatus(0, future, now), 'Not Started');
    assert.equal(deriveEnrollmentStatus(35, future, now), 'In Progress');
    assert.equal(deriveEnrollmentStatus(100, future, now), 'Completed');
  });

  it('marks unfinished work past its due date as Overdue', () => {
    assert.equal(deriveEnrollmentStatus(0, past, now), 'Overdue');
    assert.equal(deriveEnrollmentStatus(60, past, now), 'Overdue');
  });

  it('treats the due date itself as still on time', () => {
    assert.equal(deriveEnrollmentStatus(10, new Date('2026-11-01T00:00:00Z'), now), 'In Progress');
  });

  it('keeps completed work Completed even after the due date', () => {
    assert.equal(deriveEnrollmentStatus(100, past, now), 'Completed');
  });
});
