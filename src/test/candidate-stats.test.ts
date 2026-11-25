import { describe, it, expect } from 'vitest';
import {
  HistoryEvaluation,
  computeSessionAverage,
  computeEvaluationMetrics,
  extractUniqueCandidates,
  filterEvaluations,
  formatInterviewDate,
} from '../lib/candidateStats';

const makeEval = (
  overrides: Partial<HistoryEvaluation> & { id: string; candidate_id: string }
): HistoryEvaluation => ({
  public_token: `token-${overrides.id}`,
  interview_type_name: 'DSA / LeetCode',
  question_title: 'LRU Cache',
  hireability: 'Hire',
  interviewed_at: '2026-11-10',
  created_at: '2026-11-10T12:00:00Z',
  evaluation_scores: [],
  ...overrides,
});

describe('candidateStats helpers', () => {
  it('computes session average safely for empty and populated scores', () => {
    const emptyEval = makeEval({ id: 'e1', candidate_id: 'c1', evaluation_scores: [] });
    expect(computeSessionAverage(emptyEval)).toBe(0);

    const scoredEval = makeEval({
      id: 'e2',
      candidate_id: 'c1',
      evaluation_scores: [
        { criterion_key: 'optimality', criterion_label: 'Optimality', score: 4 },
        { criterion_key: 'complexity', criterion_label: 'Complexity', score: 5 },
      ],
    });
    expect(computeSessionAverage(scoredEval)).toBe(4.5);
  });

  it('computes overall average and sorted axis averages accurately', () => {
    const metrics = computeEvaluationMetrics([
      makeEval({
        id: 'e1',
        candidate_id: 'c1',
        evaluation_scores: [
          { criterion_key: 'optimality', criterion_label: 'Optimality', score: 3 },
          { criterion_key: 'communication', criterion_label: 'Communication', score: 5 },
        ],
      }),
      makeEval({
        id: 'e2',
        candidate_id: 'c1',
        evaluation_scores: [
          { criterion_key: 'optimality', criterion_label: 'Optimality', score: 5 },
        ],
      }),
    ]);

    expect(metrics.totalSessions).toBe(2);
    expect(metrics.overallAvg).toBe(4.3);
    expect(metrics.axisAverages).toEqual([
      { key: 'communication', label: 'Communication', avg: 5, count: 1 },
      { key: 'optimality', label: 'Optimality', avg: 4, count: 2 },
    ]);
  });

  it('extracts unique candidates with session counts and skips records missing name or email', () => {
    const candidates = extractUniqueCandidates([
      makeEval({
        id: 'e1',
        candidate_id: 'cand-a',
        candidates: { id: 'cand-a', full_name: '  Alex Rivera ', email: 'Alex@Example.com' },
      }),
      makeEval({
        id: 'e2',
        candidate_id: 'cand-a',
        candidates: { id: 'cand-a', full_name: 'Alex Rivera', email: 'alex@example.com' },
      }),
      makeEval({
        id: 'e3',
        candidate_id: 'cand-blank-name',
        candidates: { id: 'cand-blank-name', full_name: '   ', email: 'x@example.com' },
      }),
      makeEval({
        id: 'e4',
        candidate_id: 'cand-missing',
      }),
    ]);

    expect(candidates).toEqual([
      {
        id: 'cand-a',
        full_name: 'Alex Rivera',
        email: 'alex@example.com',
        sessionCount: 2,
      },
    ]);
  });

  it('filters evaluations by candidateId and search query across session and candidate fields', () => {
    const evals: HistoryEvaluation[] = [
      makeEval({
        id: 'e1',
        candidate_id: 'cand-a',
        question_title: 'Splitwise',
        interview_type_name: 'LLD Coding',
        hireability: 'Strong Hire',
        candidates: { id: 'cand-a', full_name: 'Alex Rivera', email: 'alex@example.com' },
      }),
      makeEval({
        id: 'e2',
        candidate_id: 'cand-b',
        question_title: 'LRU Cache',
        interview_type_name: 'DSA / LeetCode',
        hireability: 'Partial Hire',
        candidates: { id: 'cand-b', full_name: 'Priya Nair', email: 'priya@example.com' },
      }),
    ];

    expect(filterEvaluations(evals, { candidateId: 'cand-a' }).map((e) => e.id)).toEqual(['e1']);
    expect(
      filterEvaluations(evals, { searchQuery: 'priya', includeCandidateFields: true }).map(
        (e) => e.id
      )
    ).toEqual(['e2']);
    expect(
      filterEvaluations(evals, { searchQuery: 'priya', includeCandidateFields: false })
    ).toEqual([]);
    expect(filterEvaluations(evals, { searchQuery: 'splitwise' }).map((e) => e.id)).toEqual([
      'e1',
    ]);
  });

  it('formats YYYY-MM-DD dates safely without timezone shift', () => {
    expect(formatInterviewDate('2026-11-14')).toBe('Nov 14, 2026');
  });
});
