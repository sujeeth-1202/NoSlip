/**
 * NoSlip — "Quiet Growth" Theme Tokens
 *
 * Warm stone palette with humanist Manrope UI typography
 * and warm Fraunces serif display numbers.
 */

export const QuietTheme = {
  background: '#E7DFCE', // Warm stone base
  surface: '#F6F1E4',    // Cards, drawer, sheet backgrounds
  ink: '#2E2B24',        // Primary text (soft near-black)
  inkLight: '#544E42',   // Secondary text
  accentGrowth: '#3E5C43', // Forest green for tree, CTA, page 1 dot
  accentGrowthHover: '#334D37',
  accentBuddy: '#6B5B73',  // Dusty mauve for buddy elements, page 2 dot
  accentBuddyHover: '#5B4D63',
  muted: '#B8AE9C',      // Disabled states, dividers, secondary text
  border: '#DDD5C5',     // Subtle border line
  danger: '#8B4848',     // Muted red/rust for destructive actions
};

export const Colors = {
  light: {
    text: QuietTheme.ink,
    background: QuietTheme.background,
    tint: QuietTheme.accentGrowth,
    icon: QuietTheme.inkLight,
    tabIconDefault: QuietTheme.muted,
    tabIconSelected: QuietTheme.accentGrowth,
  },
  dark: {
    text: QuietTheme.ink,
    background: QuietTheme.background,
    tint: QuietTheme.accentGrowth,
    icon: QuietTheme.inkLight,
    tabIconDefault: QuietTheme.muted,
    tabIconSelected: QuietTheme.accentGrowth,
  },
};

export const Typography = {
  // Display numbers: Fraunces (warm serif)
  display: 'Fraunces_700Bold',
  displaySemiBold: 'Fraunces_600SemiBold',
  displayRegular: 'Fraunces_400Regular',

  // UI & Body text: Manrope (humanist sans)
  sansRegular: 'Manrope_400Regular',
  sansMedium: 'Manrope_500Medium',
  sansSemiBold: 'Manrope_600SemiBold',
  sansBold: 'Manrope_700Bold',
};
