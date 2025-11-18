// Bank of Kigali theme configuration
export const theme = {
  colors: {
    primary: '#1e3a8a', // BK Blue
    primaryLight: '#3b82f6',
    primaryDark: '#1e40af',
    secondary: '#ffffff', // BK White
    accent: '#f59e0b', // Gold accent
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    light: '#f8fafc',
    dark: '#1f2937',
    muted: '#6b7280',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280'
  },
  fonts: {
    primary: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    heading: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }
};

export const roleColors = {
  retentionOfficer: '#3b82f6',
  retentionAnalyst: '#8b5cf6',
  retentionManager: '#f59e0b',
  admin: '#ef4444'
};

export default theme;
