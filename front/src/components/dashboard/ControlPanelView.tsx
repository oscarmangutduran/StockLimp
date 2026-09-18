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
import { styles } from '../../css/ControlPanelView.styles';

interface CenterRef {
  id_centro: number;
  nombre: string;
  direccion?: string;
  ciudad?: string;
}

interface User {
  id_user: number;
  nombre: string;
  apellido?: string;
  email: string;
  rol: string;
  estado: string;
  id_centro?: number | null;
  centro?: CenterRef | null;
  centros?: CenterRef[];
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
      toValue: 320,
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
    const currentCentroId = user.id_centro
      ? user.id_centro.toString()
      : (user.centros && user.centros.length > 0 ? user.centros[0].id_centro.toString() : '');
    setFormCentroId(currentCentroId);
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

  const handleExportCSV = () => {
    if (Platform.OS !== 'web') {
      showAlert('La exportación de datos está disponible en la versión Web.');
      return;
    }

    const headers = ['ID Usuario', 'Nombre', 'Apellidos', 'Email', 'Rol', 'Centro(s) Asignado(s)', 'Estado', 'Fecha Creación'];
    const rows = filteredUsers.map((u) => {
      const centrosStr = (u.centros && u.centros.length > 0)
        ? u.centros.map(c => c.nombre).join(' | ')
        : (u.centro?.nombre || 'Sin centro asignado');
      return [
        u.id_user,
        `"${(u.nombre || '').replace(/"/g, '""')}"`,
        `"${(u.apellido || '').replace(/"/g, '""')}"`,
        `"${(u.email || '').replace(/"/g, '""')}"`,
        u.rol,
        `"${centrosStr.replace(/"/g, '""')}"`,
        u.estado || 'activo',
        u.fecha_creacion || (u.created_at ? u.created_at.substring(0, 10) : '17/06/2026')
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'personal_usuarios.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleStyle = (rol: string) => {
    const r = rol.toLowerCase();
    if (r === 'super_admin') return { bg: '#FFEBEF', text: '#EF4444', label: 'SUPER ADMINISTRADOR' };
    if (r === 'admin') return { bg: '#FEF3C7', text: '#D97706', label: 'ADMINISTRADOR' };
    if (r === 'repartidor') return { bg: '#F3E8FF', text: '#8B5CF6', label: 'REPARTIDOR' };
    return { bg: '#EFF6FF', text: '#3B82F6', label: 'USUARIO' };
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const fullName = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const role = (u.rol || '').toLowerCase();
    const centerNames = [
      ...(u.centros || []).map((c) => c.nombre || ''),
      u.centro?.nombre || '',
    ]
      .join(' ')
      .toLowerCase();

    return (
      fullName.includes(q) ||
      email.includes(q) ||
      role.includes(q) ||
      centerNames.includes(q)
    );
  });

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
          onPress={fetchUsersAndMetrics}
        >
          <Feather name="refresh-cw" size={16} color="#475569" />
          <Text style={styles.saveChangesBtnText}>Actualizar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveChangesBtn, { backgroundColor: '#F8FAFC' }]}
          onPress={handleExportCSV}
        >
          <Feather name="download" size={16} color="#475569" />
          <Text style={styles.saveChangesBtnText}>Exportar CSV</Text>
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
            placeholder="Buscar por nombre, correo o centro asignado..."
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
              <View style={[styles.tableContainer, { minWidth: 1140 }]}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.thText, { width: 60 }]}>ID</Text>
                  <Text style={[styles.thText, { width: 170 }]}>Nombre Completo</Text>
                  <Text style={[styles.thText, { width: 190 }]}>Correo Electrónico</Text>
                  <Text style={[styles.thText, { width: 150 }]}>Rol Asignado</Text>
                  <Text style={[styles.thText, { width: 240 }]}>Centro Asignado</Text>
                  <Text style={[styles.thText, { width: 90 }]}>Estado</Text>
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
                      const hasCentros = (user.centros && user.centros.length > 0) || !!user.centro;
                      const assignedCentros = (user.centros && user.centros.length > 0)
                        ? user.centros
                        : (user.centro ? [user.centro] : []);
                      const centerNamesText = assignedCentros.map((c) => c.nombre).join(', ');

                      return (
                        <View
                          key={user.id_user}
                          style={[
                            styles.tableRow,
                            { backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' },
                          ]}
                        >
                          <Text style={[styles.tdText, { width: 60, fontWeight: '600' }]}>#{user.id_user}</Text>
                          <Text style={[styles.tdText, { width: 170, fontWeight: '500' }]} numberOfLines={2}>
                            {`${user.nombre} ${user.apellido || ''}`.trim()}
                          </Text>
                          <Text style={[styles.tdText, { width: 190 }]} numberOfLines={1}>{user.email}</Text>
                          <View style={{ width: 150 }}>
                            <View style={[styles.roleTag, { backgroundColor: roleStyle.bg }]}>
                              <Text style={[styles.roleText, { color: roleStyle.text }]}>{roleStyle.label}</Text>
                            </View>
                          </View>
                          <View style={{ width: 240, paddingRight: 10 }}>
                            {hasCentros ? (
                              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                                <Feather name="map-pin" size={13} color="#5C8E8D" style={{ marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={[
                                      styles.tdText,
                                      { width: '100%', color: '#0F172A', fontWeight: '500', fontSize: 13, lineHeight: 18 }
                                    ]}
                                    numberOfLines={2}
                                    // @ts-ignore
                                    title={centerNamesText}
                                  >
                                    {centerNamesText}
                                  </Text>
                                  {assignedCentros.length > 1 && (
                                    <View
                                      style={{
                                        alignSelf: 'flex-start',
                                        backgroundColor: '#E6F4EA',
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                        borderRadius: 6,
                                        marginTop: 3,
                                      }}
                                    >
                                      <Text style={{ fontSize: 10, color: '#16A34A', fontWeight: '600' }}>
                                        {assignedCentros.length} centros asignados
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            ) : (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Feather name="map-pin" size={13} color="#94A3B8" />
                                <Text style={[styles.tdText, { color: '#94A3B8', fontStyle: 'italic', fontSize: 12 }]}>
                                  Sin centro asignado
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={{ width: 90 }}>
                            <View style={styles.statusTag}>
                              <Text style={styles.statusText}>{user.estado ? user.estado.toUpperCase() : 'ACTIVO'}</Text>
                            </View>
                          </View>
                          <Text style={[styles.tdText, { width: 120 }]}>
                            {user.fecha_creacion
                              ? user.fecha_creacion.substring(0, 10)
                              : (user.created_at ? user.created_at.substring(0, 10) : '17/06/2026')}
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
