import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { HireabilityBadge, ScoreBadge } from '../common/Badges';
import { trackEvent } from '../../lib/analytics';
import {
  HistoryEvaluation,
  computeSessionAverage,
  formatInterviewDate,
} from '../../lib/candidateStats';

interface SessionsTableProps {
  evaluations: HistoryEvaluation[];
  canGrade: boolean;
  onSelectCandidate: (candidateId: string) => void;
  onResetFilters: () => void;
}

export function SessionsTable({
  evaluations,
  canGrade,
  onSelectCandidate,
  onResetFilters,
}: SessionsTableProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">
        Mock Interview Sessions ({evaluations.length})
      </h2>

      {evaluations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            No sessions match your current filters.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  {canGrade && <th className="py-3 px-4">Candidate</th>}
                  <th className="py-3 px-4">Track</th>
                  <th className="py-3 px-4">Question</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4 w-px whitespace-nowrap">Rubric</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evaluations.map((ev) => {
                  const sessionAvg = computeSessionAverage(ev);

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatInterviewDate(ev.interviewed_at)}
                      </td>

                      {canGrade && (
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {ev.candidates ? (
                            <button
                              type="button"
                              onClick={() => onSelectCandidate(ev.candidate_id)}
                              className="text-left group hover:text-blue-700 transition"
                            >
                              <span className="block font-semibold text-slate-900 group-hover:text-blue-700">
                                {ev.candidates.full_name}
                              </span>
                              <span className="block text-[11px] text-slate-500">
                                {ev.candidates.email}
                              </span>
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {ev.interview_type_name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs font-semibold text-slate-900 truncate">
                        {ev.question_title}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <ScoreBadge score={sessionAvg} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <HireabilityBadge verdict={ev.hireability} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <Link
                          to={`/r/${ev.public_token}`}
                          onClick={() =>
                            trackEvent('candidate_rubric_opened', {
                              track: ev.interview_type_name,
                              role: canGrade ? 'staff' : 'candidate',
                            })
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
                        >
                          <span>View Full Rubric</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
