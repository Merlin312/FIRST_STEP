import { StyleSheet } from 'react-native';

/**
 * Shared layout styles reused across all DrawerPanel sections.
 * Centralises padding/gap and section-label typography so every
 * section looks identical without duplicating the same rules.
 */
export const sectionStyles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
});
