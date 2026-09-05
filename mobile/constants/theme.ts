/**
 * Sahkaar Connect Mobile Theme
 * National Cooperative palette with accessible contrast
 */

export const COLORS = {
  // Primary: Cooperative Green
  primary: "#15803D",
  primaryLight: "#DCFCE7",
  primaryDark: "#166534",
  primaryMuted: "#DCFCE7",

  // Accent / Secondary: National Saffron
  secondary: "#EA580C",
  secondaryLight: "#FFEDD5",
  secondaryDark: "#C2410C",
  accent: "#EA580C",
  accentLight: "#FB923C",
  accentMuted: "#FFEDD5",

  // Democratic Blue
  blue: "#1E40AF",
  blueLight: "#DBEAFE",

  // Emergency SOS: Crimson
  danger: "#DC2626",
  dangerLight: "#FEE2E2",
  dangerDark: "#991B1B",

  // States
  success: "#16A34A",
  successLight: "#DCFCE7",
  warning: "#D97706",
  warningLight: "#FEF3C7",
  info: "#0284C7",
  infoLight: "#E0F2FE",

  // Neutral & Surfaces
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  borderStrong: "#CBD5E1",

  // Text
  text: "#0F172A",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textTertiary: "#94A3B8",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  hero: 32,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const TYPOGRAPHY = {
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  fontFamily: {
    regular: "System",
    medium: "System",
    bold: "System",
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  lg: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
};

export const THEME = {
  colors: {
    ...COLORS,
    accent: COLORS.secondary,
    accentLight: COLORS.secondaryLight,
    accentMuted: COLORS.secondaryLight,
    secondaryMuted: COLORS.secondaryLight,
    dangerMuted: COLORS.dangerLight,
    textInverse: COLORS.textInverse,
  },
  spacing: SPACING,
  borderRadius: RADIUS,
  typography: {
    fontFamily: TYPOGRAPHY.fontFamily,
    sizes: {
      caption: 11,
      subtext: 13,
      body: 15,
      title: 17,
      header: 20,
      hero: 26,
    },
  },
  shadows: SHADOWS,
};
