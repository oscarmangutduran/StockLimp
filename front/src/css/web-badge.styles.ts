import { BottomTabInset, MaxContentWidth, Spacing, Fonts } from '@/constants/theme';
import { Platform } from 'react-native';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  versionText: {
    textAlign: 'center',
  },
  badgeImage: {
    width: 123,
    aspectRatio: 123 / 24,
  },
});

