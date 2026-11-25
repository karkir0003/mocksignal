import { Candidate, EvaluationScore, HireabilityVerdict } from '../types';

export type CandidateSummary = Pick<Candidate, 'id' | 'full_name' | 'email'>;

export type EvaluationScoreSummary = Pick<
  EvaluationScore,
  'criterion_key' | 'criterion_label' | 'score'
>;

export interface HistoryEvaluation {
  id: string;
  public_token: string;
  candidate_id: string;
  interview_type_name: string;
  question_title: string;
  hireability: HireabilityVerdict;
  interviewed_at: string;
  created_at: string;
  evaluation_scores: EvaluationScoreSummary[];
  candidates?: CandidateSummary | null;
}

export interface AxisAverage {
  key: string;
  label: string;
  avg: number;
  count: number;
}

export interface EvaluationMetrics {
  totalSessions: number;
  overallAvg: number;
  axisAverages: AxisAverage[];
}

export interface CandidateFilterOption extends CandidateSummary {
  sessionCount: number;
}

/**
 * Computes the average score across all rubric criteria for a single evaluation session.
 */
export function computeSessionAverage(evaluation: HistoryEvaluation): number {
  const scores = evaluation.evaluation_scores;
  if (!scores || scores.length === 0) return 0;

  const total = scores.reduce((sum, s) => sum + s.score, 0);
  return Number((total / scores.length).toFixed(1));
}

/**
 * Aggregates session count, overall average score, and sorted per-axis averages.
 */
export function computeEvaluationMetrics(
  evaluations: HistoryEvaluation[]
): EvaluationMetrics {
  if (evaluations.length === 0) {
    return { totalSessions: 0, overallAvg: 0, axisAverages: [] };
  }

  let totalScoreSum = 0;
  let totalScoreCount = 0;
  const axisMap: Record<string, { label: string; sum: number; count: number }> = {};

  for (const ev of evaluations) {
    if (!ev.evaluation_scores) continue;
    for (const s of ev.evaluation_scores) {
      totalScoreSum += s.score;
      totalScoreCount += 1;

      if (!axisMap[s.criterion_key]) {
        axisMap[s.criterion_key] = {
          label: s.criterion_label,
          sum: 0,
          count: 0,
        };
      }
      axisMap[s.criterion_key].sum += s.score;
      axisMap[s.criterion_key].count += 1;
    }
  }

  const overallAvg =
    totalScoreCount > 0 ? Number((totalScoreSum / totalScoreCount).toFixed(1)) : 0;

  const axisAverages = Object.entries(axisMap)
    .map(([key, data]) => ({
      key,
      label: data.label,
      avg: Number((data.sum / data.count).toFixed(1)),
      count: data.count,
    }))
    .sort((a, b) => b.avg - a.avg || a.label.localeCompare(b.label));

  return {
    totalSessions: evaluations.length,
    overallAvg,
    axisAverages,
  };
}

/**
 * Builds a deduplicated, alphabetically sorted list of candidates from evaluations,
 * skipping any records missing a candidate name or email.
 */
export function extractUniqueCandidates(
  evaluations: HistoryEvaluation[]
): CandidateFilterOption[] {
  const map = new Map<string, CandidateFilterOption>();

  for (const ev of evaluations) {
    const c = ev.candidates;
    if (!c || !c.full_name?.trim() || !c.email?.trim()) {
      continue;
    }

    const id = c.id || ev.candidate_id;
    const existing = map.get(id);
    if (existing) {
      existing.sessionCount += 1;
    } else {
      map.set(id, {
        id,
        full_name: c.full_name.trim(),
        email: c.email.trim().toLowerCase(),
        sessionCount: 1,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => a.full_name.localeCompare(b.full_name) || a.email.localeCompare(b.email)
  );
}

/**
 * Filters evaluations by optional candidate ID and case-insensitive search query.
 */
export function filterEvaluations(
  evaluations: HistoryEvaluation[],
  options: {
    candidateId?: string | null;
    searchQuery?: string;
    includeCandidateFields?: boolean;
  }
): HistoryEvaluation[] {
  const { candidateId, searchQuery = '', includeCandidateFields = false } = options;
  const q = searchQuery.trim().toLowerCase();

  return evaluations.filter((ev) => {
    if (candidateId && ev.candidate_id !== candidateId) {
      return false;
    }

    if (!q) return true;

    const matchesSession =
      ev.question_title.toLowerCase().includes(q) ||
      ev.interview_type_name.toLowerCase().includes(q) ||
      ev.hireability.toLowerCase().includes(q);

    if (matchesSession) return true;

    if (includeCandidateFields && ev.candidates) {
      return (
        ev.candidates.full_name.toLowerCase().includes(q) ||
        ev.candidates.email.toLowerCase().includes(q)
      );
    }

    return false;
  });
}

/**
 * Formats an ISO date string (YYYY-MM-DD or timestamp) without UTC off-by-one shifts.
 */
export function formatInterviewDate(dateStr: string): string {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const dateObj = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(dateStr);

  if (Number.isNaN(dateObj.getTime())) {
    return dateStr;
  }

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
