/**
 * Healthcare Color Palette - Softer Blue Tones
 * Preferred by both male and female consumers
 * Used by health-related organizations like insurance and hospitals
 */

// Primary Healthcare Colors - Softer Blue Tones
export const HEALTHCARE_COLORS = {
  // Primary Soft Blue - Preferred by both genders, calming, professional
  blue: {
    50: '#f0f7ff',   // Very soft blue
    100: '#e0efff',  // Soft light blue
    200: '#c7e2ff',  // Light blue
    300: '#a5d0ff',  // Medium light blue
    400: '#7db5ff',  // Medium blue
    500: '#5b9eff',  // Primary soft blue
    600: '#3d7ee8',  // Medium soft blue
    700: '#2d62c4',  // Soft blue
    800: '#264f9e',  // Deeper soft blue
    900: '#25437d',  // Deep soft blue
    primary: '#5b9eff', // Primary soft blue
    light: '#7db5ff',   // Light soft blue
    soft: '#a5d0ff',    // Very soft blue
    deep: '#3d7ee8',    // Deeper soft blue
  },
  
  // Teal - Calming, professional
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    primary: '#14b8a6',
    light: '#5eead4',
    cyan: '#06b6d4',
  },
  
  // Green - Positive, healing
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    primary: '#10b981', // Emerald
    light: '#4ade80',
  },
  
  // Chart colors for data visualization - Softer blue tones
  chart: {
    primary: '#5b9eff',      // Soft blue - primary
    secondary: '#7db5ff',       // Light soft blue
    accent: '#a5d0ff',          // Very soft blue
    info: '#3d7ee8',            // Medium soft blue
    blue: '#5b9eff',            // Primary soft blue
    blueLight: '#a5d0ff',       // Light soft blue
    blueMedium: '#7db5ff',      // Medium soft blue
    blueDeep: '#3d7ee8',        // Deeper soft blue
    softBlue1: '#c7e2ff',       // Very light soft blue
    softBlue2: '#e0efff',       // Extremely light soft blue
    green: '#4ade80',           // Soft green for success
    danger: '#ef4444',          // Red for errors/warnings (keep for critical alerts)
  },
  
  // Legacy support - map old colors to new
  legacy: {
    primary: '#0F4C75', // Deep blue
    secondary: '#1B9AAA', // Teal variant
  },
} as const;

// Helper function to get healthcare color
export function getHealthcareColor(
  color: 'blue' | 'teal' | 'green',
  shade: 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 'primary' | 'light' | 'deep' | 'cyan' = 500
): string {
  const colorGroup = HEALTHCARE_COLORS[color];
  if (typeof shade === 'number') {
    return colorGroup[shade];
  }
  return (colorGroup as any)[shade] || colorGroup[500];
}
