import { describe, it, expect } from 'vitest';
import {
  DEFAULT_STRIPE_TIP_URL,
  GITHUB_REPO_URL,
  buildStripeTipUrl,
  buildScorecardReportUrl,
  buildCandidateHistoryLoginUrl,
} from '../lib/constants';

describe('Centralized URL & Attribution Constants', () => {
  it('exports default public external URLs', () => {
    expect(DEFAULT_STRIPE_TIP_URL).toBe('https://buy.stripe.com/cNi6oG6Wb5tlgNpfg93ks01');
    expect(GITHUB_REPO_URL).toBe('https://github.com/karkir0003/mocksignal');
  });

  describe('buildStripeTipUrl', () => {
    it('constructs Stripe tip URL with standardized web UTM parameters', () => {
      const urlString = buildStripeTipUrl('web', 'stripe_tip_scorecard');
      const url = new URL(urlString);

      expect(url.origin + url.pathname).toBe(DEFAULT_STRIPE_TIP_URL);
      expect(url.searchParams.get('utm_source')).toBe('mocksignal');
      expect(url.searchParams.get('utm_medium')).toBe('web');
      expect(url.searchParams.get('utm_campaign')).toBe('candidate_scorecard');
      expect(url.searchParams.get('utm_content')).toBe('stripe_tip_scorecard');
    });

    it('constructs Stripe tip URL with standardized email UTM parameters', () => {
      const urlString = buildStripeTipUrl('email', 'stripe_tip_email');
      const url = new URL(urlString);

      expect(url.origin + url.pathname).toBe(DEFAULT_STRIPE_TIP_URL);
      expect(url.searchParams.get('utm_source')).toBe('mocksignal');
      expect(url.searchParams.get('utm_medium')).toBe('email');
      expect(url.searchParams.get('utm_campaign')).toBe('interview_evaluation');
      expect(url.searchParams.get('utm_content')).toBe('stripe_tip_email');
    });

    it('supports custom base URL override', () => {
      const customBase = 'https://buy.stripe.com/custom_link_123';
      const urlString = buildStripeTipUrl('email', 'stripe_tip_email', customBase);
      const url = new URL(urlString);

      expect(url.origin + url.pathname).toBe(customBase);
      expect(url.searchParams.get('utm_source')).toBe('mocksignal');
    });
  });

  describe('buildScorecardReportUrl', () => {
    it('constructs scorecard public link with email UTM attribution', () => {
      const urlString = buildScorecardReportUrl(
        'https://mocksignal.karkir0003.workers.dev',
        'tok-abc',
        'view_scorecard_cta'
      );
      const url = new URL(urlString);

      expect(url.pathname).toBe('/r/tok-abc');
      expect(url.searchParams.get('utm_source')).toBe('mocksignal');
      expect(url.searchParams.get('utm_medium')).toBe('email');
      expect(url.searchParams.get('utm_campaign')).toBe('interview_evaluation');
      expect(url.searchParams.get('utm_content')).toBe('view_scorecard_cta');
    });
  });

  describe('buildCandidateHistoryLoginUrl', () => {
    it('constructs login link redirecting to history with UTM parameters', () => {
      const urlString = buildCandidateHistoryLoginUrl(
        'https://mocksignal.karkir0003.workers.dev',
        'candidate_history_cta'
      );
      const url = new URL(urlString);

      expect(url.pathname).toBe('/login');
      expect(url.searchParams.get('redirect')).toBe('/history');
      expect(url.searchParams.get('utm_source')).toBe('mocksignal');
      expect(url.searchParams.get('utm_medium')).toBe('email');
      expect(url.searchParams.get('utm_campaign')).toBe('interview_evaluation');
      expect(url.searchParams.get('utm_content')).toBe('candidate_history_cta');
    });
  });
});

