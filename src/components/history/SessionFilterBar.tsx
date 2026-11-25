import { Search, X } from 'lucide-react';
import { CandidateFilterOption } from '../../lib/candidateStats';

interface SessionFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  canGrade: boolean;
  candidateOptions: CandidateFilterOption[];
  selectedCandidateId: string;
  hasCandidateParam: boolean;
  onSelectCandidate: (candidateId: string) => void;
  onClearCandidateFilter: () => void;
}

export function SessionFilterBar({
  searchQuery,
  onSearchChange,
  canGrade,
  candidateOptions,
  selectedCandidateId,
  hasCandidateParam,
  onSelectCandidate,
  onClearCandidateFilter,
}: SessionFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          aria-label="Search sessions"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            canGrade
              ? 'Search by candidate, question, track, or verdict...'
              : 'Search by question, track, or verdict...'
          }
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {canGrade && (
        <div className="flex items-center gap-2 sm:w-80">
          <select
            aria-label="Filter by candidate"
            value={selectedCandidateId}
            onChange={(e) => onSelectCandidate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          >
            <option value="">All Candidates ({candidateOptions.length})</option>
            {candidateOptions.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.full_name} ({candidate.sessionCount}{' '}
                {candidate.sessionCount === 1 ? 'session' : 'sessions'})
              </option>
            ))}
          </select>

          {hasCandidateParam && (
            <button
              type="button"
              onClick={onClearCandidateFilter}
              className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition whitespace-nowrap shadow-sm"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
