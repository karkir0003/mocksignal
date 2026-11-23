import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { HomePage } from '../pages/HomePage';
import * as AuthModule from '../contexts/AuthContext';

describe('Role-Based Navigation Gating (Navbar)', () => {
  it('renders only Public brand and Sign In for unauthenticated visitors', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      profile: null,
      role: null,
      isAdmin: false,
      isInterviewer: false,
      canGrade: false,
      isLoading: false,
      isConfigured: true,
      signInWithPassword: vi.fn(),
      signInWithMagicLink: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText('MockSignal')).toBeDefined();
    expect(screen.queryByText('Grade Interview')).toBeNull();
    expect(screen.queryByText('Question Bank')).toBeNull();
    expect(screen.queryByText('Rubrics')).toBeNull();
    expect(screen.queryByText('My Sessions')).toBeNull();
  });

  it('renders "My Sessions" for candidates, but gates staff and admin tabs', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: { id: 'user-1', email: 'candidate@example.com' } as any,
      session: {} as any,
      profile: { id: 'user-1', email: 'candidate@example.com', role: 'candidate', created_at: '' },
      role: 'candidate',
      isAdmin: false,
      isInterviewer: false,
      canGrade: false,
      isLoading: false,
      isConfigured: true,
      signInWithPassword: vi.fn(),
      signInWithMagicLink: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText('My Sessions')).toBeDefined();
    expect(screen.queryByText('Grade Interview')).toBeNull();
    expect(screen.queryByText('Question Bank')).toBeNull();
    expect(screen.queryByText('Rubrics')).toBeNull();
  });

  it('renders "Grade Interview" & "Question Bank" for Interviewers, but gates "Rubrics"', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: { id: 'user-2', email: 'interviewer@example.com' } as any,
      session: {} as any,
      profile: { id: 'user-2', email: 'interviewer@example.com', role: 'interviewer', created_at: '' },
      role: 'interviewer',
      isAdmin: false,
      isInterviewer: true,
      canGrade: true,
      isLoading: false,
      isConfigured: true,
      signInWithPassword: vi.fn(),
      signInWithMagicLink: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText('Grade Interview')).toBeDefined();
    expect(screen.getByText('Question Bank')).toBeDefined();
    expect(screen.getByText('My Sessions')).toBeDefined();
    // Rubrics MUST be strictly hidden from interviewers
    expect(screen.queryByText('Rubrics')).toBeNull();
  });

  it('renders ALL tabs including "Rubrics" for Admins', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: { id: 'user-3', email: 'admin@example.com' } as any,
      session: {} as any,
      profile: { id: 'user-3', email: 'admin@example.com', role: 'admin', created_at: '' },
      role: 'admin',
      isAdmin: true,
      isInterviewer: false,
      canGrade: true,
      isLoading: false,
      isConfigured: true,
      signInWithPassword: vi.fn(),
      signInWithMagicLink: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText('Grade Interview')).toBeDefined();
    expect(screen.getByText('Question Bank')).toBeDefined();
    expect(screen.getByText('Rubrics')).toBeDefined();
    expect(screen.getByText('My Sessions')).toBeDefined();
  });

  it('renders "Read Documentation" CTA on HomePage pointing to the project GitHub repository', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      profile: null,
      role: null,
      isAdmin: false,
      isInterviewer: false,
      canGrade: false,
      isLoading: false,
      isConfigured: true,
      signInWithPassword: vi.fn(),
      signInWithMagicLink: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const docLink = screen.getByRole('link', { name: /read documentation/i });
    expect(docLink).toBeDefined();
    expect(docLink.getAttribute('href')).toBe('https://github.com/karkir0003/mocksignal');
    expect(docLink.getAttribute('target')).toBe('_blank');
    expect(docLink.getAttribute('rel')).toContain('noopener');
  });
});
