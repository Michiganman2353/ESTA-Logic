/**
 * Color Design Tokens
 *
 * Defines the color palette for the guided UX system
 * with trust-building and compliance-focused colors.
 */

export const colors = {
  // Primary trust blue
  primary: {
    50: '#F7FAFE',
    100: '#E8F2FD',
    200: '#C7E0FB',
    300: '#94C6F8',
    400: '#5AA7F3',
    500: '#3B82F6', // Accent Blue
    600: '#1E4BD8', // Primary Trust Blue
    700: '#1A3FAF',
    800: '#163489',
    900: '#122A6B',
  },

  // Government trust green
  success: {
    50: '#E6F9F4',
    100: '#B3EFE0',
    200: '#80E5CC',
    300: '#4DDBB8',
    400: '#1AD1A4',
    500: '#00B289', // Government Trust Green
    600: '#009970',
    700: '#007A59',
    800: '#005B42',
    900: '#003C2B',
  },

  // Compliance error
  error: {
    50: '#FEECEB',
    100: '#FCC9C6',
    200: '#FAA6A1',
    300: '#F8837C',
    400: '#F66057',
    500: '#D32F2F', // Compliance Error
    600: '#B92826',
    700: '#9E211E',
    800: '#841A16',
    900: '#6A130E',
  },

  // Warning/caution
  warning: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFC107',
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },

  // Neutral grays
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Semantic colors
  background: '#F7FAFE',
  surface: '#FFFFFF',
  text: {
    primary: '#212121',
    secondary: '#616161',
    disabled: '#9E9E9E',
    hint: '#BDBDBD',
  },

  // Border colors
  border: {
    light: '#E0E0E0',
    default: '#BDBDBD',
    dark: '#757575',
  },
} as const;

export type ColorTokens = typeof colors;
