import { BottomTabInset, MaxContentWidth, Spacing, Fonts } from '@/constants/theme';
import { Platform } from 'react-native';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F3F6F8',
  },
  imageColumn: {
    flex: 1,
    height: '100%',
  },
  cleaningImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  formColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F6F8',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5C8E8D',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#EBF1FC',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF1FC',
    borderRadius: 12,
    marginBottom: 16,
    height: 52,
    width: '100%',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  eyeIcon: {
    paddingRight: 16,
    height: '100%',
    justifyContent: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    borderColor: '#5C8E8D',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#5C8E8D',
    borderRadius: 2,
  },
  checkboxLabel: {
    color: '#64748B',
    fontSize: 14,
    flexShrink: 1,
  },
  button: {
    backgroundColor: '#6D9896',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Dashboard Structure (Post-Login)
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#F3F6F8',
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#1E2640', // Dark profile color matching mockups
    height: '100%',
    paddingVertical: 24,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderColor: '#0F172A',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  profileIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  menuList: {
    flex: 1,
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: '#2A3A54', // Active bar focus color
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#3B82F6', // Blue side active bar indicator
  },
  menuItemText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    height: 52,
    gap: 8,
    marginTop: 'auto',
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  mainContentPanel: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainScrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  footerWeb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerWebText: {
    fontSize: 13,
    color: '#64748B',
  },
  socialsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  // Mobile Layout
  mobileLayout: {
    flex: 1,
  },
  mobileHeader: {
    height: 56,
    backgroundColor: '#1E2640',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  hamburgerBtn: {
    padding: 6,
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mobileDrawerContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    bottom: 0,
    width: 240,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  footerMobile: {
    marginTop: 40,
    paddingVertical: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  footerMobileText: {
    fontSize: 12,
    color: '#64748B',
  },
});

