import { BottomTabInset, MaxContentWidth, Spacing, Fonts } from '@/constants/theme';
import { Platform } from 'react-native';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#5C8E8D', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  refreshText: { color: '#fff', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 40 },
  list: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardInfo: { flex: 1, minWidth: 250 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 16, fontWeight: '700', color: '#334155' },
  datesText: { fontSize: 14, color: '#475569' },
  comments: { fontSize: 13, color: '#64748B', marginTop: 12, fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 6 },
  statusBadgeContainer: { marginTop: 12, flexDirection: 'row' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusApproved: { backgroundColor: '#D1FAE5' },
  statusRejected: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  statusPendingText: { color: '#D97706' },
  statusApprovedText: { color: '#059669' },
  statusRejectedText: { color: '#DC2626' },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9' },
  resetBtnText: { color: '#64748B', fontWeight: '600', fontSize: 12 },
});

