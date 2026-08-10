import { BottomTabInset, MaxContentWidth, Spacing, Fonts } from '@/constants/theme';
import { Platform } from 'react-native';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeSnippet: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
});

