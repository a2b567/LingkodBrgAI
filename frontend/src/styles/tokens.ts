/**
 * LingkodBrgy Civic-Tech Design Tokens
 * Standardized design tokens for colors, typography, elevations, spacing, and transition curves.
 */

export const tokens = {
  colors: {
    govBlue: {
      50: '#f0f5fb',
      100: '#e1ecf7',
      200: '#c3dbf0',
      300: '#94c0e4',
      400: '#5e9ed4',
      500: '#3880c2',
      600: '#2565a4',
      700: '#1e5186',
      800: '#1c456f',
      900: '#1c3b5d',
      950: '#0f243d',
    },
    govGold: {
      50: '#fdfce8',
      100: '#faf8c5',
      200: '#f5ee8e',
      300: '#eedc4e',
      400: '#e4c41e',
      500: '#cca210',
      600: '#af7e0c',
      700: '#8c5c0d',
      800: '#744a12',
      900: '#633d14',
      950: '#3a2007',
    },
    emerald: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    rose: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
    },
    amber: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    }
  },
  radius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.25rem',// 20px
    full: '9999px',
  },
  shadows: {
    subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    elevated: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
  typography: {
    fontBody: 'Inter, system-ui, -apple-system, sans-serif',
    fontDisplay: 'Outfit, Inter, system-ui, sans-serif',
  }
} as const;

export type ThemeTokens = typeof tokens;
