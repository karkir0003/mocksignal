export const DEFAULT_STRIPE_TIP_URL = 'https://buy.stripe.com/cNi6oG6Wb5tlgNpfg93ks01';
export const GITHUB_REPO_URL = 'https://github.com/karkir0003/mocksignal';

/**
 * Builds a standardized Stripe tip checkout URL with UTM attribution parameters.
 */
export function buildStripeTipUrl(
  medium: 'web' | 'email',
  content: string,
  customBaseUrl?: string
): string {
  let envBaseUrl: string | undefined;
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STRIPE_TIP_URL) {
      envBaseUrl = import.meta.env.VITE_STRIPE_TIP_URL;
    }
  } catch {
    // Ignore in non-Vite environments
  }

  const base = customBaseUrl || envBaseUrl || DEFAULT_STRIPE_TIP_URL;
  const url = new URL(base);
  url.searchParams.set('utm_source', 'mocksignal');
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_campaign', medium === 'email' ? 'interview_evaluation' : 'candidate_scorecard');
  url.searchParams.set('utm_content', content);
  return url.toString();
}

/**
 * Builds a standardized Scorecard URL with UTM attribution parameters.
 */
export function buildScorecardReportUrl(
  baseUrl: string,
  publicToken: string,
  content: string = 'view_scorecard_cta'
): string {
  const url = new URL(`/r/${publicToken}`, baseUrl);
  url.searchParams.set('utm_source', 'mocksignal');
  url.searchParams.set('utm_medium', 'email');
  url.searchParams.set('utm_campaign', 'interview_evaluation');
  url.searchParams.set('utm_content', content);
  return url.toString();
}

/**
 * Builds a candidate history sign-in URL with UTM attribution parameters.
 */
export function buildCandidateHistoryLoginUrl(
  baseUrl: string,
  content: string = 'candidate_history_cta'
): string {
  const url = new URL('/login', baseUrl);
  url.searchParams.set('redirect', '/history');
  url.searchParams.set('utm_source', 'mocksignal');
  url.searchParams.set('utm_medium', 'email');
  url.searchParams.set('utm_campaign', 'interview_evaluation');
  url.searchParams.set('utm_content', content);
  return url.toString();
}

