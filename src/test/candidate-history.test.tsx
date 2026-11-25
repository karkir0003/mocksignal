import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CandidateHistoryPage } from '../pages/CandidateHistoryPage';
import * as AuthModule from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { EvaluationWithScores } from '../types';

const alexCandidate = {
  id: 'cand-alex',
  email: 'alex@example.com',
  full_name: 'Alex Rivera',
  created_at: '2026-11-01T00:00:00Z',
};

const priyaCandidate = {
  id: 'cand-priya',
  email: 'priya@example.com',
  full_name: 'Priya Nair',
  created_at: '2026-11-01T00:00:00Z',
};

const sampleEvaluations: EvaluationWithScores[] = [
  {
    id: 'eval-1',
    public_token: 'token-alex-1',
    candidate_id: 'cand-alex',
    interview_type_id: 'type-lld',
    question_id: 'q-splitwise',
    interview_type_name: 'LLD Coding',
    question_title: 'Splitwise',
    hireability: 'Strong Hire',
    overall_feedback: 'Clean domain separation and strategy pattern.',
    interviewed_at: '2026-11-14',
    created_at: '2026-11-14T10:00:00Z',
    candidates: alexCandidate,
    evaluation_scores: [
      {
        id: 'score-1',
        evaluation_id: 'eval-1',
        criterion_key: 'product_system',
        criterion_label: 'System Pragmatism',
        score: 5,
        justification: 'Handled edge cases cleanly.',
        display_order: 1,
      },
      {
        id: 'score-2',
        evaluation_id: 'eval-1',
        criterion_key: 'communication',
        criterion_label: 'Communication',
        score: 4,
        justification: 'Clear explanations.',
        display_order: 2,
      },
    ],
  },
  {
    id: 'eval-2',
    public_token: 'token-alex-2',
    candidate_id: 'cand-alex',
    interview_type_id: 'type-dsa',
    question_id: 'q-lru',
    interview_type_name: 'DSA / LeetCode',
    question_title: 'LRU Cache',
    hireability: 'Hire',
    overall_feedback: 'Solid O(1) linked list + hashmap.',
    interviewed_at: '2026-11-10',
    created_at: '2026-11-10T10:00:00Z',
    candidates: alexCandidate,
    evaluation_scores: [
      {
        id: 'score-3',
        evaluation_id: 'eval-2',
        criterion_key: 'optimality',
        criterion_label: 'Optimality',
        score: 4,
        justification: 'Optimal approach.',
        display_order: 1,
      },
    ],
  },
  {
    id: 'eval-3',
    public_token: 'token-priya-1',
    candidate_id: 'cand-priya',
    interview_type_id: 'type-sd',
    question_id: 'q-url',
    interview_type_name: 'System Design',
    question_title: 'Design URL Shortener',
    hireability: 'Partial Hire',
    overall_feedback: 'Good schema, needs deeper sharding discussion.',
    interviewed_at: '2026-11-16',
    created_at: '2026-11-16T10:00:00Z',
    candidates: priyaCandidate,
    evaluation_scores: [
      {
        id: 'score-4',
        evaluation_id: 'eval-3',
        criterion_key: 'scalability',
        criterion_label: 'Scalability',
        score: 2,
        justification: 'Missed partition hotspots.',
        display_order: 1,
      },
    ],
  },
];

function mockSupabaseEvaluations(rows: EvaluationWithScores[]) {
  const secondOrder = vi.fn().mockResolvedValue({ data: rows, error: null });
  const firstOrder = vi.fn().mockReturnValue({ order: secondOrder });
  const select = vi.fn().mockReturnValue({ order: firstOrder });
  vi.spyOn(supabase, 'from').mockReturnValue({ select } as any);
  return { select };
}

function mockAuth(role: 'admin' | 'interviewer' | 'candidate', email: string) {
  vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
    user: { id: `user-${role}`, email } as any,
    session: {} as any,
    profile: { id: `user-${role}`, email, role, created_at: '' },
    role,
    isAdmin: role === 'admin',
    isInterviewer: role === 'interviewer',
    canGrade: role === 'admin' || role === 'interviewer',
    isLoading: false,
    isConfigured: true,
    signInWithPassword: vi.fn(),
    signInWithMagicLink: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  });
}

describe('CandidateHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders personal stats and searchable sessions table for candidate users without candidate filter controls', async () => {
    mockAuth('candidate', 'alex@example.com');
    const alexOnly = sampleEvaluations.filter((e) => e.candidate_id === 'cand-alex');
    const { select } = mockSupabaseEvaluations(alexOnly);

    render(
      <MemoryRouter initialEntries={['/history']}>
        <Routes>
          <Route path="/history" element={<CandidateHistoryPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mock Interview Progression')).toBeDefined();
    });

    const selectArg = String(select.mock.calls[0]?.[0] || '');
    expect(selectArg).toContain('evaluation_scores (criterion_key, criterion_label, score)');
    expect(selectArg).not.toContain('candidates');
    expect(selectArg).not.toContain('justification');
    expect(selectArg).not.toContain('overall_feedback');
    expect(selectArg).not.toContain('*');

    // Candidate stats & searchable table visible; staff candidate dropdown absent
    expect(screen.queryByLabelText('Filter by candidate')).toBeNull();
    expect(screen.getByRole('table')).toBeDefined();
    expect(screen.getByText('4.3')).toBeDefined();
    expect(screen.getByText('Splitwise')).toBeDefined();
    expect(screen.getByText('LRU Cache')).toBeDefined();

    // Search filters candidate's own table by question/track
    const searchInput = screen.getByLabelText('Search sessions');
    fireEvent.change(searchInput, { target: { value: 'LRU' } });
    expect(screen.getByText('LRU Cache')).toBeDefined();
    expect(screen.queryByText('Splitwise')).toBeNull();

    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(screen.getByText('Splitwise')).toBeDefined();
  });

  it('hides cross-candidate summary stats in staff unfiltered view and supports search', async () => {
    mockAuth('admin', 'admin@mocksignal.local');
    const { select } = mockSupabaseEvaluations(sampleEvaluations);

    render(
      <MemoryRouter initialEntries={['/history']}>
        <Routes>
          <Route path="/history" element={<CandidateHistoryPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conducted Interview Sessions')).toBeDefined();
    });

    const selectArg = String(select.mock.calls[0]?.[0] || '');
    expect(selectArg).toContain('candidates (id, full_name, email)');
    expect(selectArg).toContain('evaluation_scores (criterion_key, criterion_label, score)');
    expect(selectArg).not.toContain('justification');
    expect(selectArg).not.toContain('overall_feedback');
    expect(selectArg).not.toContain('*');

    // No cross-candidate stats when unfiltered
    expect(screen.queryByText('Overall Average Score')).toBeNull();
    expect(screen.queryByText('Longitudinal Performance by Rubric Axis')).toBeNull();

    // All sessions appear in table
    expect(screen.getByText('Splitwise')).toBeDefined();
    expect(screen.getByText('LRU Cache')).toBeDefined();
    expect(screen.getByText('Design URL Shortener')).toBeDefined();

    // Search filters table by candidate name
    fireEvent.change(screen.getByLabelText('Search sessions'), {
      target: { value: 'priya' },
    });
    expect(screen.getByText('Design URL Shortener')).toBeDefined();
    expect(screen.queryByText('Splitwise')).toBeNull();
  });

  it('reveals candidate-level stats above filtered table rows when filtering to a candidate', async () => {
    mockAuth('interviewer', 'interviewer@mocksignal.local');
    mockSupabaseEvaluations(sampleEvaluations);

    render(
      <MemoryRouter initialEntries={['/history']}>
        <Routes>
          <Route path="/history" element={<CandidateHistoryPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conducted Interview Sessions')).toBeDefined();
    });

    // Click Alex Rivera in the table
    fireEvent.click(screen.getAllByText('Alex Rivera')[0]);

    await waitFor(() => {
      expect(screen.getByText('Overall Average Score')).toBeDefined();
    });

    // Stats & table are scoped strictly to Alex Rivera
    expect(screen.getByText('4.3')).toBeDefined();
    expect(screen.getAllByText('System Pragmatism').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Optimality')).toBeDefined();
    expect(screen.queryByText('Scalability')).toBeNull();
    expect(screen.getByText('Splitwise')).toBeDefined();
    expect(screen.getByText('LRU Cache')).toBeDefined();
    expect(screen.queryByText('Design URL Shortener')).toBeNull();

    // View Full Rubric links point to /r/:public_token
    const rubricLinks = screen.getAllByRole('link', { name: /View Full Rubric/i });
    expect(rubricLinks.map((a) => a.getAttribute('href'))).toEqual([
      '/r/token-alex-1',
      '/r/token-alex-2',
    ]);

    // Switch candidate via dropdown to Priya Nair
    fireEvent.change(screen.getByLabelText('Filter by candidate'), {
      target: { value: 'cand-priya' },
    });

    await waitFor(() => {
      expect(screen.getByText('Design URL Shortener')).toBeDefined();
    });
    expect(screen.queryByText('Splitwise')).toBeNull();
    expect(screen.getByText('2.0')).toBeDefined();

    // Clear candidate filter hides stats and restores all sessions
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await waitFor(() => {
      expect(screen.queryByText('Overall Average Score')).toBeNull();
    });
    expect(screen.getByText('Splitwise')).toBeDefined();
    expect(screen.getByText('Design URL Shortener')).toBeDefined();
  });

  it('handles unknown candidate query param gracefully', async () => {
    mockAuth('admin', 'admin@mocksignal.local');
    mockSupabaseEvaluations(sampleEvaluations);

    render(
      <MemoryRouter initialEntries={['/history?candidate=does-not-exist']}>
        <Routes>
          <Route path="/history" element={<CandidateHistoryPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Candidate not found')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Show All Candidates'));
    await waitFor(() => {
      expect(screen.getByText('Splitwise')).toBeDefined();
    });
  });
});
