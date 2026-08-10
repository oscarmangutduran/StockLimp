import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ModalAlert from '@/components/common/ModalAlert';

interface VacationsAdminViewProps {
  baseUrl: string;
  userId: number;
}

export default function VacationsAdminView({ baseUrl, userId }: VacationsAdminViewProps) {
  const [vacaciones, setVacaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Custom Alert state
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title?: string; message: string; showCancel?: boolean; onConfirm?: () => void }>({ visible: false, message: '' });
  const showAlert = (message: string, title = 'Aviso') => setAlertConfig({ visible: true, title, message, showCancel: false, onConfirm: undefined });

  const fetchVacaciones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/vacaciones/todas`);
      const data = await res.json();
      if (data.success) {
        setVacaciones(data.vacaciones);
      }
    } catch (e) {
      console.log('Error fetching vacations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacaciones();
  }, []);

  const changeStatus = async (id: number, nuevoEstado: string) => {
    try {
      const res = await fetch(`${baseUrl}/vacaciones/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, id_user_admin: userId })
      });
      const data = await res.json();
      if (data.success) {
        fetchVacaciones(); // refresh
      } else {
        showAlert(data.message || 'Error al cambiar estado');
      }
    } catch (e) {
      console.log('Error changing status', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>GESTIÓN DE VACACIONES</Text>
          <Text style={styles.subtitle}>Aprueba o rechaza las solicitudes de tus empleados</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchVacaciones} disabled={loading}>
          <Feather name="refresh-cw" size={16} color="#fff" />
          <Text style={styles.refreshText}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#5C8E8D" />}

      {!loading && vacaciones.length === 0 && (
        <Text style={styles.emptyText}>No hay solicitudes de vacaciones registradas.</Text>
      )}

      {!loading && vacaciones.length > 0 && (
        <ScrollView style={styles.list}>
          {vacaciones.map((vac) => (
            <View key={vac.id_vacacion} style={styles.card}>
              <View style={styles.cardInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <View style={styles.avatar}>
                    <Feather name="user" size={16} color="#64748B" />
                  </View>
                  <View>
                    <Text style={styles.userName}>{vac.user ? vac.user.nombre : 'Usuario desconocido'}</Text>
                    <Text style={styles.datesText}>Del {vac.fecha_inicio} al {vac.fecha_fin}</Text>
                  </View>
                </View>
                {vac.comentarios ? (
                  <Text style={styles.comments}>Comentarios: {vac.comentarios}</Text>
                ) : null}
                
                <View style={styles.statusBadgeContainer}>
                  <View style={[
                    styles.statusBadge,
                    vac.estado === 'aprobada' ? styles.statusApproved : 
                    vac.estado === 'rechazada' || vac.estado === 'cancelada' ? styles.statusRejected : 
                    vac.estado === 'solicita_cancelacion' ? { backgroundColor: '#E0E7FF' } : styles.statusPending
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      vac.estado === 'aprobada' ? styles.statusApprovedText : 
                      vac.estado === 'rechazada' || vac.estado === 'cancelada' ? styles.statusRejectedText : 
                      vac.estado === 'solicita_cancelacion' ? { color: '#4338CA' } : styles.statusPendingText
                    ]}>
                      {vac.estado === 'solicita_cancelacion' ? 'PIDE CANCELACIÓN' : vac.estado.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardActions}>
                {vac.estado === 'pendiente' ? (
                  <>
                    <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => changeStatus(vac.id_vacacion, 'aprobada')}>
                      <Feather name="check" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Aprobar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => changeStatus(vac.id_vacacion, 'rechazada')}>
                      <Feather name="x" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Rechazar</Text>
                    </TouchableOpacity>
                  </>
                ) : vac.estado === 'solicita_cancelacion' ? (
                  <>
                    <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => changeStatus(vac.id_vacacion, 'cancelada')}>
                      <Feather name="trash-2" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Aceptar Cancelación</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => changeStatus(vac.id_vacacion, 'aprobada')}>
                      <Feather name="x" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Denegar Cancelación</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={styles.resetBtn} onPress={() => changeStatus(vac.id_vacacion, 'pendiente')}>
                    <Feather name="rotate-ccw" size={14} color="#64748B" />
                    <Text style={styles.resetBtnText}>Marcar como Pendiente</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
      <ModalAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
