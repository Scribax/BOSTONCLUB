/**
 * useFeatureFlags — thin wrapper around ThemeContext.
 * All feature flag state lives in ThemeContext to avoid duplicate API calls.
 */
export { useTheme as useFeatureFlags } from '../contexts/ThemeContext';
