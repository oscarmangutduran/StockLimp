import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface PendingUser {
  id_user: number;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
  fecha_creacion?: string;
}

interface ApproveUsersViewProps {
  baseUrl: string;
}

export default function ApproveUsersView({ baseUrl }: ApproveUsersViewProps) {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/usuarios`);
      if (response.ok) {
        const allUsers: PendingUser[] = await response.json();
        // Filter pending users
        const pending = allUsers.filter((u) => u.estado === 'pendiente');
        setUsers(pending);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.log('Error fetching pending users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/usuarios/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_user: id }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        fetchPendingUsers();
      } else {
        alert(data.message || 'Error al aprobar el usuario.');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión.');
      setLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    const executeReject = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseUrl}/usuarios/rechazar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_user: id }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          fetchPendingUsers();
        } else {
          alert(data.message || 'Error al rechazar el usuario.');
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        alert('Error de conexión.');
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de que deseas rechazar este registro de usuario?')) {
        executeReject();
      }
    } else {
      Alert.alert(
        'Confirmar rechazo',
        '¿Estás seguro de que deseas rechazar este usuario?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Rechazar', style: 'destructive', onPress: executeReject },
        ]
      );
    }
  };

  // Helper to simulate a user for testing if the queue is empty
  const handleSimulateUser = () => {
    const mockPending: PendingUser = {
      id_user: Math.floor(Math.random() * 1000) + 10,
      nombre: 'Operario de Pruebas',
      email: 'prueba.operario@stocklimp.com',
      rol: 'usuario',
      estado: 'pendiente',
      fecha_creacion: new Date().toISOString().substring(0, 10),
    };
    setUsers([...users, mockPending]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.viewTitle}>USUARIOS POR APROBAR</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5C8E8D" />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.card}>
            {/* Custom Header banner for approvals matching screenshot */}
            <View style={styles.bannerHeader}>
              <Feather name="users" size={20} color="#FFFFFF" />
              <Text style={styles.bannerHeaderText}>BANDEJA DE APROBACIONES DE PERSONAL</Text>
            </View>

            {users.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay usuarios pendientes de aprobación en este momento.</Text>
                {Platform.OS === 'web' && (
                  <TouchableOpacity style={styles.simulateBtn} onPress={handleSimulateUser}>
                    <Text style={styles.simulateBtnText}>Simular usuario pendiente (Pruebas)</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <ScrollView horizontal={true} style={styles.scrollContainer}>
                <View style={styles.tableContainer}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.thText, { width: 80 }]}>ID</Text>
                    <Text style={[styles.thText, { width: 180 }]}>Nombre Completo</Text>
                    <Text style={[styles.thText, { width: 220 }]}>Correo Electrónico</Text>
                    <Text style={[styles.thText, { width: 120 }]}>Rol Solicitado</Text>
                    <Text style={[styles.thText, { width: 140 }]}>Fecha Registro</Text>
                    <Text style={[styles.thText, { width: 120, textAlign: 'center' }]}>Acciones</Text>
                  </View>

                  {/* Table Rows */}
                  {users.map((user, idx) => (
                    <View
                      key={user.id_user}
                      style={[
                        styles.tableRow,
                        { backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' },
                      ]}
                    >
                      <Text style={[styles.tdText, { width: 80, fontWeight: '600' }]}>#{user.id_user}</Text>
                      <Text style={[styles.tdText, { width: 180, fontWeight: '500' }]}>{user.nombre}</Text>
                      <Text style={[styles.tdText, { width: 220 }]}>{user.email}</Text>
                      <Text style={[styles.tdText, { width: 120, textTransform: 'uppercase' }]}>{user.rol}</Text>
                      <Text style={[styles.tdText, { width: 140 }]}>{user.fecha_creacion || '2026-06-17'}</Text>
                      <View style={[styles.tdActions, { width: 120 }]}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.approveBtn]}
                          onPress={() => handleApprove(user.id_user)}
                        >
                          <Feather name="check" size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>Aprobar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.rejectBtn]}
                          onPress={() => handleReject(user.id_user)}
                        >
                          <Feather name="x" size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>Rechazar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
  },
  viewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5C8E8D',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  bannerHeaderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  simulateBtn: {
    marginTop: 20,
    backgroundColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  simulateBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  scrollContainer: {
    flex: 1,
  },
  tableContainer: {
    minWidth: 860,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  thText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  tdText: {
    fontSize: 14,
    color: '#334155',
  },
  tdActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
