import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  
  // Tabs Header
  tabsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#5C8E8D', paddingBottom: 8 },
  tabActiveText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  tabInactive: { paddingBottom: 8 },
  tabInactiveText: { fontSize: 15, fontWeight: '500', color: '#64748B' },

  // Cards
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardLinkText: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  cardDateRange: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },

  // Rings
  ringsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statColumn: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  statSub: { fontSize: 11, color: '#94A3B8' },

  // Buttons
  previewBtn: { backgroundColor: '#EAF1F1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  previewBtnActive: { backgroundColor: '#FEF2F2' },
  previewBtnText: { color: '#5C8E8D', fontWeight: '700', fontSize: 15 },
  
  // Vacations List
  timrVacationItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  timrVacationTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  timrVacationDates: { fontSize: 13, color: '#64748B', marginTop: 4 },
  
  timrBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  timrBadgePending: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  timrBadgeApproved: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  timrBadgeRejected: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  
  timrBadgeText: { fontSize: 12, fontWeight: '600' },
  timrBadgePendingText: { color: '#D97706' },
  timrBadgeApprovedText: { color: '#16A34A' },
  timrBadgeRejectedText: { color: '#DC2626' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', maxWidth: 400, borderRadius: 12, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, color: '#475569', marginBottom: 8, marginTop: 16 },
  textArea: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, height: 100, textAlignVertical: 'top' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 8, gap: 12 },
  uploadBtnText: { color: '#64748B', flex: 1 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelBtn: { backgroundColor: '#F1F5F9' },
  cancelBtnText: { color: '#64748B', fontWeight: '600' },
  saveBtn: { backgroundColor: '#EF4444' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
