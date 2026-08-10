import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ModalAlert from '@/components/common/ModalAlert';

interface User {
  id_user: number;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
  id_centro?: number | null;
  centro?: {
    id_centro: number;
    nombre: string;
  } | null;
  fecha_creacion?: string;
  created_at?: string;
}

interface ControlPanelViewProps {
  baseUrl: string;
  currentUser: { id_user: number };
}

const mockUsers: User[] = [
  { id_user: 1, nombre: "Oscar Mangut", email: "oscar@stocklimp.com", rol: "super_admin", estado: "activo", id_centro: null, fecha_creacion: "2026-06-17" },
  { id_user: 2, nombre: "Admin Sistema", email: "admin@stocklimp.com", rol: "admin", estado: "activo", id_centro: null, fecha_creacion: "2026-06-17" },
  { id_user: 3, nombre: "Operario Almacén", email: "almacen@stocklimp.com", rol: "usuario", estado: "activo", id_centro: 1, fecha_creacion: "2026-06-17" },
  { id_user: 4, nombre: "pepe", email: "pepe@stocklimp.com", rol: "usuario", estado: "activo", id_centro: 2, fecha_creacion: "2026-06-17" }
];

export default function ControlPanelView({ baseUrl, currentUser }: ControlPanelViewProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [users, setUsers] = useState<User[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [userCenters, setUserCenters] = useState<{[key: number]: number | null}>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Search animation states
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchWidth = React.useRef(new Animated.Value(220)).current;

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    Animated.timing(searchWidth, {
      toValue: 300,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    Animated.timing(searchWidth, {
      toValue: 220,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  // Metrics states
  const [userCount, setUserCount] = useState(11);
  const [productCount, setProductCount] = useState(8);
  const [orderCount, setOrderCount] = useState(6);
  const [centerCount, setCenterCount] = useState(4);

  // Modal edit user
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRol, setFormRol] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCentroId, setFormCentroId] = useState<string>('');

  // Custom Alert state
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title?: string; message: string; showCancel?: boolean; onConfirm?: () => void }>({ visible: false, message: '' });

  const showAlert = (message: string, title = 'Aviso') => setAlertConfig({ visible: true, title, message, showCancel: false, onConfirm: undefined });

  const fetchUsersAndMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/usuarios`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setUserCount(data.length);
      } else {
        setUsers(mockUsers);
        setUserCount(11);
      }

      // Fetch other lists for counts
      const productsRes = await fetch(`${baseUrl}/productos`);
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProductCount(data.length);
      }

      const ordersRes = await fetch(`${baseUrl}/pedidos`);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrderCount(data.length);
      }

      const centersRes = await fetch(`${baseUrl}/centros_trabajo`);
      if (centersRes.ok) {
        const data = await centersRes.json();
        setCenters(data);
        setCenterCount(data.length);
      }

    } catch (error) {
      console.log('Error fetching metrics, using mocks:', error);
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndMetrics();
  }, []);

  // Reset pagination on search or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormNombre(user.nombre);
    setFormEmail(user.email);
    setFormRol(user.rol);
    setFormPassword('');
    setFormCentroId(user.id_centro ? user.id_centro.toString() : '');
    setModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!formNombre || !formEmail) {
      showAlert('Nombre y Email son campos obligatorios.');
      return;
    }

    const payload = {
      id_user: selectedUser?.id_user,
      nombre: formNombre,
      email: formEmail,
      rol: formRol,
      password: formPassword || null,
      id_centro: formCentroId ? parseInt(formCentroId, 10) : null
    };

    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/usuarios/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        fetchUsersAndMetrics();
        setModalVisible(false);
      } else {
        showAlert(resData.message || 'Error al actualizar el usuario.');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      showAlert('Error de red al guardar.');
      setLoading(false);
    }
  };

  const handleSaveInlineChanges = async () => {
    const entries = Object.entries(userCenters);
    if (entries.length === 0) {
      showAlert('No hay cambios pendientes para guardar.');
      return;
    }

    setLoading(true);
    try {
      let hasError = false;
      for (const [userIdStr, centerId] of entries) {
        const userId = parseInt(userIdStr, 10);
        const u = users.find(user => user.id_user === userId);
        if (!u) continue;

        const response = await fetch(`${baseUrl}/usuarios/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_user: u.id_user,
            nombre: u.nombre,
            email: u.email,
            rol: u.rol,
            id_centro: centerId
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          hasError = true;
        }
      }

      if (hasError) {
        showAlert('Algunos cambios no se pudieron guardar.');
      } else {
        showAlert('Cambios guardados correctamente.');
        setUserCenters({});
      }
      fetchUsersAndMetrics();
    } catch (err) {
      console.error(err);
      showAlert('Error de conexión al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (user: User) => {
    const executeReset = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseUrl}/usuarios/enviar-restablecimiento`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_user: user.id_user }),
        });
        const resData = await response.json();
        if (response.ok && resData.success) {
          showAlert('Se ha enviado un correo con la nueva contraseña temporal al usuario.');
        } else {
          showAlert(resData.message || 'No se pudo restablecer la contraseña.');
        }
      } catch (error) {
        console.error(error);
        showAlert('Error de conexión.');
      } finally {
        setLoading(false);
      }
    };

    setAlertConfig({
      visible: true,
      title: 'Restablecer Contraseña',
      message: `¿Deseas restablecer la contraseña de ${user.nombre}?`,
      showCancel: true,
      onConfirm: () => {
        setAlertConfig({ visible: false, message: '' });
        executeReset();
      }
    });
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id_user === currentUser?.id_user) {
      showAlert('No puedes eliminarte a ti mismo del sistema.');
      return;
    }

    const executeDelete = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${baseUrl}/usuarios/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_user: user.id_user }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          fetchUsersAndMetrics();
        } else {
          showAlert(data.message || 'No se pudo eliminar el usuario.');
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
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de que deseas eliminar a ${user.nombre}?`,
      showCancel: true,
      onConfirm: () => {
        setAlertConfig({ visible: false, message: '' });
        executeDelete();
      }
    });
  };

  const getRoleStyle = (rol: string) => {
    const r = rol.toLowerCase();
    if (r === 'super_admin') return { bg: '#FFEBEF', text: '#EF4444', label: 'SUPER ADMINISTRADOR' };
    if (r === 'admin') return { bg: '#FEF3C7', text: '#D97706', label: 'ADMINISTRADOR' };
    if (r === 'repartidor') return { bg: '#F3E8FF', text: '#8B5CF6', label: 'REPARTIDOR' };
    return { bg: '#EFF6FF', text: '#3B82F6', label: 'USUARIO' };
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Paginated users
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <View style={styles.container}>
      <Text style={styles.viewTitle}>PANEL DE CONTROL</Text>

      {/* Actions Row */}
      <View style={[styles.topActionsRow, { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }]}>
        <TouchableOpacity
          style={styles.saveChangesBtn}
          onPress={handleSaveInlineChanges}
        >
          <Feather name="save" size={16} color="#475569" />
          <Text style={styles.saveChangesBtnText}>Guardar Cambios</Text>
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.searchContainer,
            {
              flex: 1,
              width: isDesktop ? searchWidth : 'auto',
              borderColor: isSearchFocused ? '#5C8E8D' : '#E2E8F0',
              borderWidth: isSearchFocused ? 2 : 1,
              backgroundColor: isSearchFocused ? '#FFFFFF' : '#F1F5F9',
              borderRadius: 20,
              height: 40,
              paddingHorizontal: 16,
              justifyContent: 'center',
            },
          ]}
        >
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar usuarios..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
        </Animated.View>
      </View>

      {/* Metrics Cards */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <View style={[styles.metricIconBox, { backgroundColor: '#E6F4EA' }]}>
            <Feather name="users" size={20} color="#5C8E8D" />
          </View>
          <View>
            <Text style={styles.metricNumber}>{userCount}</Text>
            <Text style={styles.metricLabel}>Usuarios Registrados</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Feather name="box" size={20} color="#D97706" />
          </View>
          <View>
            <Text style={styles.metricNumber}>{productCount}</Text>
            <Text style={styles.metricLabel}>Productos en Inventario</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconBox, { backgroundColor: '#E0F2FE' }]}>
            <Feather name="file-text" size={20} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.metricNumber}>{orderCount}</Text>
            <Text style={styles.metricLabel}>Pedidos Realizados</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconBox, { backgroundColor: '#E6F4EA' }]}>
            <Feather name="home" size={20} color="#16A34A" />
          </View>
          <View>
            <Text style={styles.metricNumber}>{centerCount}</Text>
            <Text style={styles.metricLabel}>Centros de Trabajo</Text>
          </View>
        </View>
      </View>

      {/* Search and Table */}
      <View style={styles.tableCard}>
        {isDesktop && (
          <View style={styles.tableHeaderBar}>
            <Text style={styles.tableTitle}>Listado de Personal</Text>
          </View>
        )}

        {loading && users.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5C8E8D" />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView horizontal={true} style={styles.scrollContainer}>
              <View style={[styles.tableContainer, { minWidth: 1040 }]}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.thText, { width: 60 }]}>ID Usuario</Text>
                  <Text style={[styles.thText, { width: 160 }]}>Nombre Completo</Text>
                  <Text style={[styles.thText, { width: 200 }]}>Correo Electrónico</Text>
                  <Text style={[styles.thText, { width: 180 }]}>Rol Asignado</Text>
                  <Text style={[styles.thText, { width: 180 }]}>Centro Asignado</Text>
                  <Text style={[styles.thText, { width: 100 }]}>Estado</Text>
                  <Text style={[styles.thText, { width: 120 }]}>Fecha de Registro</Text>
                  <Text style={[styles.thText, { width: 120, textAlign: 'center' }]}>Acciones</Text>
                </View>

                {/* Table Rows */}
                <ScrollView style={{ flex: 1 }}>
                  {paginatedUsers.length === 0 ? (
                    <View style={styles.emptyRow}>
                      <Text style={styles.emptyText}>No se encontraron usuarios.</Text>
                    </View>
                  ) : (
                    paginatedUsers.map((user, idx) => {
                      const roleStyle = getRoleStyle(user.rol);
                      const isSelf = user.id_user === currentUser?.id_user;

                      return (
                        <View
                          key={user.id_user}
                          style={[
                            styles.tableRow,
                            { backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' },
                          ]}
                        >
                          <Text style={[styles.tdText, { width: 60, fontWeight: '600' }]}>#{user.id_user}</Text>
                          <Text style={[styles.tdText, { width: 160, fontWeight: '500' }]}>{user.nombre}</Text>
                          <Text style={[styles.tdText, { width: 200 }]}>{user.email}</Text>
                          <View style={{ width: 180 }}>
                            <View style={[styles.roleTag, { backgroundColor: roleStyle.bg }]}>
                              <Text style={[styles.roleText, { color: roleStyle.text }]}>{roleStyle.label}</Text>
                            </View>
                          </View>
                          <View style={{ width: 180 }}>
                            <View style={[styles.selectWrapper, { height: 36, width: 170, marginBottom: 0, overflow: 'hidden', borderRadius: 18, borderColor: '#CBD5E1', borderWidth: 1, backgroundColor: '#FFFFFF' }]}>
                              <select
                                style={{
                                  ...styles.htmlSelect,
                                  height: '100%',
                                  fontSize: 13,
                                  paddingHorizontal: 8,
                                  outlineStyle: 'none',
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  MozAppearance: 'none',
                                } as any}
                                value={userCenters[user.id_user] !== undefined ? (userCenters[user.id_user] ?? '') : (user.id_centro ?? '')}
                                onChange={(e) => {
                                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                                  setUserCenters({
                                    ...userCenters,
                                    [user.id_user]: val
                                  });
                                }}
                              >
                                <option value="">Sin centro asignado</option>
                                {centers.map((c) => (
                                  <option key={c.id_centro} value={c.id_centro}>
                                    {c.nombre}
                                  </option>
                                ))}
                              </select>
                            </View>
                          </View>
                          <View style={{ width: 100 }}>
                            <View style={styles.statusTag}>
                              <Text style={styles.statusText}>ACTIVO</Text>
                            </View>
                          </View>
                          <Text style={[styles.tdText, { width: 120 }]}>
                            {user.fecha_creacion ||
                              (user.created_at ? user.created_at.substring(0, 10) : '2026-06-17')}
                          </Text>
                          <View style={[styles.tdActions, { width: 120 }]}>
                            <TouchableOpacity
                              style={styles.actionIcon}
                              onPress={() => handleOpenEdit(user)}
                            >
                              <Feather name="edit-2" size={14} color="#475569" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionIcon, styles.keyBtn]}
                              onPress={() => handleResetPassword(user)}
                            >
                              <Feather name="key" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionIcon, isSelf ? styles.disabledDeleteBtn : styles.deleteBtn]}
                              onPress={() => handleDeleteUser(user)}
                              disabled={isSelf}
                            >
                              <Feather name="trash-2" size={14} color={isSelf ? '#CBD5E1' : '#FFFFFF'} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Pagination Controls */}
            <View style={styles.paginationRow}>
              <View style={styles.paginationLeft}>
                <Text style={styles.paginationLabel}>Registros por página:</Text>
                <View style={styles.paginationSelectWrapper}>
                  <select
                    style={styles.paginationSelect}
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(parseInt(e.target.value, 10))}
                  >
                    <option value={3}>3</option>
                    <option value={6}>6</option>
                    <option value={9}>9</option>
                  </select>
                </View>
                <Text style={styles.paginationCount}>({filteredUsers.length} registros)</Text>
              </View>
              
              {totalPages > 1 && (
                <View style={styles.paginationRight}>
                  <TouchableOpacity
                    style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                    disabled={currentPage === 1}
                    onPress={() => setCurrentPage(currentPage - 1)}
                  >
                    <Feather name="chevron-left" size={16} color={currentPage === 1 ? '#94A3B8' : '#475569'} />
                  </TouchableOpacity>
                  <Text style={styles.pageIndicator}>Pág. {currentPage} de {totalPages}</Text>
                  <TouchableOpacity
                    style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                    disabled={currentPage === totalPages}
                    onPress={() => setCurrentPage(currentPage + 1)}
                  >
                    <Feather name="chevron-right" size={16} color={currentPage === totalPages ? '#94A3B8' : '#475569'} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Edit User Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil de Usuario</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Nombre Completo *</Text>
              <TextInput
                style={styles.modalInput}
                value={formNombre}
                onChangeText={setFormNombre}
                placeholder="Nombre completo"
              />

              <Text style={styles.label}>Correo Electrónico *</Text>
              <TextInput
                style={styles.modalInput}
                value={formEmail}
                onChangeText={setFormEmail}
                keyboardType="email-address"
                placeholder="usuario@stocklimp.com"
              />

              <Text style={styles.label}>Rol de Usuario *</Text>
              <View style={styles.selectWrapper}>
                <select
                  style={styles.htmlSelect}
                  value={formRol}
                  onChange={(e) => setFormRol(e.target.value)}
                >
                  <option value="super_admin">SUPER ADMINISTRADOR</option>
                  <option value="admin">ADMINISTRADOR</option>
                  <option value="usuario">USUARIO</option>
                  <option value="repartidor">REPARTIDOR</option>
                </select>
              </View>

              <Text style={styles.label}>Centro Asignado</Text>
              <View style={styles.selectWrapper}>
                <select
                  style={styles.htmlSelect}
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

              <Text style={styles.label}>Cambiar Contraseña (Dejar en blanco si no se cambia)</Text>
              <TextInput
                style={styles.modalInput}
                value={formPassword}
                onChangeText={setFormPassword}
                secureTextEntry={true}
                placeholder="Nueva contraseña"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveModalBtn]}
                onPress={handleSaveUser}
              >
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 24,
    gap: 24,
  },
  viewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metricIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 16,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchContainer: {
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    justifyContent: 'center',
    width: 220,
  },
  searchInput: {
    height: '100%',
    fontSize: 14,
    color: '#1E293B',
    outlineStyle: 'none',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 240,
  },
  scrollContainer: {
    flex: 1,
  },
  tableContainer: {
    minWidth: 860,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#5C8E8D',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  thText: {
    color: '#FFFFFF',
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
  roleTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTag: {
    backgroundColor: '#E6F4EA',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#137333',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyRow: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
  },
  tdActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  keyBtn: {
    backgroundColor: '#F59E0B',
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
  },
  disabledDeleteBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  // Pagination styles
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  paginationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationLabel: {
    fontSize: 14,
    color: '#475569',
  },
  paginationSelectWrapper: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    height: 32,
    width: 60,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  paginationSelect: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  paginationCount: {
    fontSize: 14,
    color: '#64748B',
  },
  paginationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtnDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.5,
  },
  pageIndicator: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  selectWrapper: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  htmlSelect: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModalBtn: {
    backgroundColor: '#E2E8F0',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  saveModalBtn: {
    backgroundColor: '#5C8E8D',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  topActionsRow: {
    width: '100%',
  },
  saveChangesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 16,
    gap: 8,
  },
  saveChangesBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});
