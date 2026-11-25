import { Award, BarChart2, Layers, TrendingUp } from 'lucide-react';
import { ScoreBadge, ScoreProgressBar } from '../common/Badges';
import { EvaluationMetrics } from '../../lib/candidateStats';

interface CandidateStatsOverviewProps {
  metrics: EvaluationMetrics;
  isStaffView: boolean;
}

export function CandidateStatsOverview({
  metrics,
  isStaffView,
}: CandidateStatsOverviewProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Sessions
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">
              {metrics.totalSessions}
            </p>
            <p className="text-xs text-slate-500 mt-1">Completed mock interviews</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overall Average Score
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">
                {metrics.overallAvg.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-slate-500">/ 5.0</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Across all calibrated axes</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Top Evaluated Skill
            </p>
            <p className="text-base font-bold text-slate-900 mt-1 truncate max-w-[200px]">
              {metrics.axisAverages[0]?.label || 'General'}
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              {metrics.axisAverages[0]
                ? `${metrics.axisAverages[0].avg.toFixed(1)} / 5.0 Average`
                : 'Awaiting scores'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Award className="h-6 w-6" />
          </div>
        </div>
      </div>

      {metrics.axisAverages.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-blue-600" />
              <span>Longitudinal Performance by Rubric Axis</span>
            </h2>
            <span className="text-xs text-slate-500">
              {isStaffView ? 'Candidate average across sessions' : 'Average across all sessions'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metrics.axisAverages.map((axis) => (
              <div
                key={axis.key}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{axis.label}</span>
                  <ScoreBadge score={axis.avg} size="sm" />
                </div>
                <ScoreProgressBar score={axis.avg} />
                <p className="text-[11px] text-slate-400">
                  Evaluated {axis.count} {axis.count === 1 ? 'time' : 'times'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
