export const COLORS = {
  // UTurn Brand Colors (from logo: yellow diamond, green/yellow/red signals)
  primary: '#F5C518',      // UTurn Yellow (main brand)
  primaryDark: '#D4A800',  // Darker yellow
  primaryLight: '#FFF9E0', // Light yellow tint

  secondary: '#2D2D2D',    // Dark charcoal for text/headers
  accent: '#4CAF50',       // Signal Green (active/online)
  accentRed: '#E53935',    // Signal Red (stop/offline)
  accentOrange: '#FF9800', // Signal Orange/Yellow

  // Neutrals
  background: '#F8F5EF',   // Warm off-white
  surface: '#FFFFFF',
  black: '#1A1A1A',
  white: '#FFFFFF',
  text: '#2D2D2D',
  textMuted: '#8E8E93',
  textLight: '#ABABAB',
  border: '#E8E8E8',

  // Functional
  success: '#4CAF50',
  error: '#E53935',
  warning: '#FF9800',
  info: '#2196F3',

  // Gradients
  headerGradient: ['#F5C518', '#D4A800'],
  buttonGradient: ['#4CAF50', '#388E3C'],
  cardGradient: ['#FFFFFF', '#F8F5EF'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24,
  xxl: 30,
};

export const SHADOW = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};
