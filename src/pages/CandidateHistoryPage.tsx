import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent } from '../lib/analytics';
import { SessionFilterBar } from '../components/history/SessionFilterBar';
import { CandidateStatsOverview } from '../components/history/CandidateStatsOverview';
import { SessionsTable } from '../components/history/SessionsTable';
import {
  HistoryEvaluation,
  computeEvaluationMetrics,
  extractUniqueCandidates,
  filterEvaluations,
} from '../lib/candidateStats';
import { Inbox, Loader2, Users } from 'lucide-react';

export function CandidateHistoryPage() {
  const { user, canGrade } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [evaluations, setEvaluations] = useState<HistoryEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedCandidateId = canGrade ? searchParams.get('candidate') : null;

  useEffect(() => {
    document.title = canGrade
      ? 'Conducted Sessions — MockSignal'
      : 'My Mock Interviews — MockSignal';
  }, [canGrade]);

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const baseSelect = `
          id,
          public_token,
          candidate_id,
          interview_type_name,
          question_title,
          hireability,
          interviewed_at,
          created_at,
          evaluation_scores (criterion_key, criterion_label, score)
        `;
        const selectFields = canGrade
          ? `${baseSelect}, candidates (id, full_name, email)`
          : baseSelect;

        // RLS filters candidate rows to the signed-in user's email; staff see all sessions.
        const { data, error: fetchError } = await supabase
          .from('evaluations')
          .select(selectFields)
          .order('interviewed_at', { ascending: false })
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setEvaluations((data as unknown as HistoryEvaluation[]) || []);
      } catch (err: unknown) {
        const e = err as Error;
        console.error('Failed to load evaluations:', e);
        setError(e.message || 'Unable to retrieve evaluations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, [user, canGrade]);

  const candidateOptions = useMemo(
    () => (canGrade ? extractUniqueCandidates(evaluations) : []),
    [canGrade, evaluations]
  );

  const selectedCandidate = useMemo(() => {
    if (!canGrade || !selectedCandidateId) return null;
    return candidateOptions.find((c) => c.id === selectedCandidateId) || null;
  }, [canGrade, selectedCandidateId, candidateOptions]);

  // Metrics are computed strictly for a single candidate (never mixed across candidates)
  const scopedEvaluationsForStats = useMemo(() => {
    if (!canGrade) return evaluations;
    if (!selectedCandidate) return [];
    return evaluations.filter((ev) => ev.candidate_id === selectedCandidate.id);
  }, [canGrade, evaluations, selectedCandidate]);

  const overallMetrics = useMemo(
    () => computeEvaluationMetrics(scopedEvaluationsForStats),
    [scopedEvaluationsForStats]
  );

  const filteredEvaluations = useMemo(
    () =>
      filterEvaluations(evaluations, {
        candidateId: selectedCandidate?.id,
        searchQuery,
        includeCandidateFields: canGrade,
      }),
    [evaluations, selectedCandidate, searchQuery, canGrade]
  );

  const handleSelectCandidate = (
    candidateId: string,
    source: 'table_candidate' | 'filter_dropdown'
  ) => {
    if (!candidateId) {
      setSearchParams({});
      trackEvent('candidate_history_cleared');
      return;
    }
    setSearchParams({ candidate: candidateId });
    trackEvent('candidate_history_selected', { source });
  };

  const handleClearCandidateFilter = () => {
    setSearchParams({});
    trackEvent('candidate_history_cleared');
  };

  const showStats = !canGrade || Boolean(selectedCandidate);
  const isInvalidCandidateParam = Boolean(
    canGrade && selectedCandidateId && !selectedCandidate
  );

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">
          {canGrade
            ? 'Loading conducted interview sessions...'
            : 'Retrieving your mock interview history...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {!canGrade
                ? 'Mock Interview Progression'
                : selectedCandidate
                ? selectedCandidate.full_name
                : 'Conducted Interview Sessions'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {!canGrade
                ? 'Track your calibrated rubric scores, feedback history, and technical growth over time.'
                : selectedCandidate
                ? `Candidate-level rubric stats and session history (${selectedCandidate.email}).`
                : 'Search conducted sessions or select a candidate to inspect candidate-level stats.'}
            </p>
          </div>

          {!canGrade ? (
            <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
              Account: <strong className="text-slate-700">{user?.email}</strong>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              <span>
                <strong className="text-slate-900">{candidateOptions.length}</strong>{' '}
                {candidateOptions.length === 1 ? 'candidate' : 'candidates'} ·{' '}
                <strong className="text-slate-900">{evaluations.length}</strong>{' '}
                {evaluations.length === 1 ? 'session' : 'sessions'}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">
          {error}
        </div>
      )}

      {evaluations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <Inbox className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No mock interview records yet</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {canGrade
              ? 'Once an evaluation is published from the grading dashboard, sessions will appear here.'
              : `Once an interviewer publishes a scorecard for ${user?.email}, it will automatically populate your longitudinal dashboard here.`}
          </p>
        </div>
      ) : (
        <>
          <SessionFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            canGrade={canGrade}
            candidateOptions={candidateOptions}
            selectedCandidateId={selectedCandidate?.id || ''}
            hasCandidateParam={Boolean(selectedCandidateId)}
            onSelectCandidate={(id) => handleSelectCandidate(id, 'filter_dropdown')}
            onClearCandidateFilter={handleClearCandidateFilter}
          />

          {isInvalidCandidateParam ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
              <h3 className="text-base font-bold text-slate-900">Candidate not found</h3>
              <p className="text-sm text-slate-600">
                No evaluated sessions match the selected candidate filter.
              </p>
              <button
                type="button"
                onClick={handleClearCandidateFilter}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Show All Candidates
              </button>
            </div>
          ) : (
            <>
              {showStats && (
                <CandidateStatsOverview
                  metrics={overallMetrics}
                  isStaffView={canGrade}
                />
              )}

              <SessionsTable
                evaluations={filteredEvaluations}
                canGrade={canGrade}
                onSelectCandidate={(id) => handleSelectCandidate(id, 'table_candidate')}
                onResetFilters={() => {
                  setSearchQuery('');
                  if (selectedCandidateId) handleClearCandidateFilter();
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
