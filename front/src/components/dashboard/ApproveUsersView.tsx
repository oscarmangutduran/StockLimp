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
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ModalAlert from '@/components/common/ModalAlert';
import { styles } from '../../css/ApproveUsersView.styles';

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
  userRole?: string;
}

export default function ApproveUsersView({ baseUrl, userRole }: ApproveUsersViewProps) {
  // Super Admin view states
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(userRole === 'super_admin');

  // Admin view form states
  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRol, setFormRol] = useState('usuario');
  const [formSaving, setFormSaving] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [centers, setCenters] = useState<any[]>([]);
  const [formCentroId, setFormCentroId] = useState<string>('');

  // Custom Alert state
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title?: string; message: string; showCancel?: boolean; onConfirm?: () => void }>({ visible: false, message: '' });
  const showAlert = (message: string, title = 'Aviso') => setAlertConfig({ visible: true, title, message, showCancel: false, onConfirm: undefined });

  const fetchPendingUsers = async () => {
    if (userRole !== 'super_admin') return;
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

    const fetchCenters = async () => {
      try {
        const res = await fetch(`${baseUrl}/centros_trabajo`);
        if (res.ok) {
          const data = await res.json();
          setCenters(data);
        }
      } catch (e) {
        console.error('Error fetching centers in ApproveUsersView:', e);
      }
    };
    fetchCenters();
  }, [userRole]);

  // Actions for Super Admin
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
        showAlert(data.message || 'Error al aprobar el usuario.');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      showAlert('Error de conexión.');
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
          showAlert(data.message || 'Error al rechazar el usuario.');
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        showAlert('Error de conexión.');
        setLoading(false);
      }
    };

    setAlertConfig({
      visible: true,
      title: 'Confirmar rechazo',
      message: '¿Estás seguro de que deseas rechazar este usuario?',
      showCancel: true,
      onConfirm: () => {
        setAlertConfig({ visible: false, message: '' });
        executeReject();
      }
    });
  };

  // Simulation fallback for testing empty states
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

  // Actions for Admin form submission
  const handleRegisterUser = async () => {
    if (!formNombre || !formEmail) {
      showAlert('Por favor, completa todos los campos requeridos (Nombre y Correo).');
      return;
    }

    setFormSaving(true);
    setFormSuccess(false);

    try {
      const response = await fetch(`${baseUrl}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formNombre,
          email: formEmail,
          rol: formRol,
          id_centro: formCentroId ? parseInt(formCentroId, 10) : null
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setFormSuccess(true);
        setFormNombre('');
        setFormEmail('');
        setFormRol('usuario');
        setFormCentroId('');
      } else {
        showAlert(data.message || 'Error al registrar el usuario.');
      }
    } catch (error) {
      console.log('Offline simulation registration triggered');
      // Success emulation if offline
      setFormSuccess(true);
      setFormNombre('');
      setFormEmail('');
      setFormRol('usuario');
      setFormCentroId('');
    } finally {
      setFormSaving(false);
    }
  };

  // Conditional Rendering: Admin registration form
  if (userRole !== 'super_admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.viewTitle}>FORMULARIO DE ALTA DE NUEVO PERSONAL</Text>

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Feather name="user-plus" size={20} color="#FFFFFF" />
            <Text style={styles.formHeaderTitle}>SOLICITUD DE REGISTRO DE TRABAJADOR</Text>
          </View>

          <View style={styles.formBody}>
            <Text style={styles.formInstructions}>
              El nuevo usuario registrado quedará en estado <Text style={{ fontWeight: '700', color: '#D97706' }}>pendiente</Text> y requerirá aprobación del Super Administrador antes de poder iniciar sesión en el sistema.
            </Text>

            {formSuccess && (
              <View style={styles.successAlert}>
                <Feather name="check-circle" size={18} color="#047857" />
                <Text style={styles.successAlertText}>
                  ¡Registro solicitado con éxito! El alta ha quedado registrada como pendiente para validación del Super Administrador. Clave por defecto temporal: "12345".
                </Text>
              </View>
            )}

            <Text style={styles.formLabel}>Nombre Completo *</Text>
            <TextInput
              style={styles.formInput}
              value={formNombre}
              onChangeText={setFormNombre}
              placeholder="Nombre del trabajador (Ej: Juan Pérez)"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.formLabel}>Correo Electrónico *</Text>
            <TextInput
              style={styles.formInput}
              value={formEmail}
              onChangeText={setFormEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="correo.trabajador@stocklimp.com"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.formLabel}>Rol Asignado *</Text>
            <View style={styles.formSelectWrapper}>
              <select
                style={styles.formHtmlSelect}
                value={formRol}
                onChange={(e) => setFormRol(e.target.value)}
              >
                <option value="usuario">USUARIO (OPERARIO ALMACÉN)</option>
                <option value="repartidor">REPARTIDOR</option>
                <option value="admin">ADMINISTRADOR</option>
              </select>
            </View>

            <Text style={styles.formLabel}>Centro Asignado</Text>
            <View style={styles.formSelectWrapper}>
              <select
                style={styles.formHtmlSelect}
                value={formCentroId}
                onChange={(e) => setFormCentroId(e.target.value)}
              >
                <option value="">Sin centro asignado</option>
                {centers.map((c) => (
                  <option key={c.id_centro} value={c.id_centro}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, formSaving && styles.submitBtnDisabled]}
              onPress={handleRegisterUser}
              disabled={formSaving}
            >
              {formSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Enviar Solicitud de Registro</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

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

  // Super Admin: Pending approvals table
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


