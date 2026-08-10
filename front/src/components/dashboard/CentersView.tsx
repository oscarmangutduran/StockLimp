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
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../css/CentersView.styles';

interface Center {
  id_centro: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  numero_ruta?: number | string;
  fecha_registro?: string;
  created_at?: string;
}

interface CentersViewProps {
  baseUrl: string;
}

const mockCenters: Center[] = [
  { id_centro: 1, nombre: "Almacén Central Cáceres", direccion: "Polígono Industrial Las Capellanías, Nave 5", ciudad: "N/A", numero_ruta: 1, fecha_registro: "2026-06-17" },
  { id_centro: 2, nombre: "Sede Administrativa", direccion: "Avenida de la Montaña 12, 10004 Cáceres", ciudad: "N/A", numero_ruta: 2, fecha_registro: "2026-06-17" },
  { id_centro: 3, nombre: "Centro Logístico Norte", direccion: "Calle de la Industria 45, Plasencia", ciudad: "N/A", numero_ruta: 3, fecha_registro: "2026-06-17" },
  { id_centro: 4, nombre: "Casa", direccion: "Torrente Ballester", ciudad: "Moraleja", numero_ruta: 4, fecha_registro: "2026-06-17" }
];

export default function CentersView({ baseUrl }: CentersViewProps) {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Search animation states
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchWidth = React.useRef(new Animated.Value(180)).current;

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    Animated.timing(searchWidth, {
      toValue: 260,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    Animated.timing(searchWidth, {
      toValue: 180,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'create' | 'edit'>('info');
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Custom Alert / Confirm Modal states
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertType, setCustomAlertType] = useState<'info' | 'confirm'>('info');
  const [customAlertConfirmAction, setCustomAlertConfirmAction] = useState<(() => void) | null>(null);

  const showCustomAlert = (title: string, message: string, type: 'info' | 'confirm' = 'info', onConfirm: (() => void) | null = null) => {
    setCustomAlertTitle(title);
    setCustomAlertMessage(message);
    setCustomAlertType(type);
    setCustomAlertConfirmAction(() => onConfirm);
    setCustomAlertVisible(true);
  };

  // Form states
  const [formNombre, setFormNombre] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formCiudad, setFormCiudad] = useState('');
  const [formRuta, setFormRuta] = useState('');

  const fetchCenters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/centros_trabajo`);
      if (response.ok) {
        const data = await response.json();
        setCenters(data);
      } else {
        setCenters(mockCenters);
      }
    } catch (error) {
      console.log('Error fetching centers, loading mocks:', error);
      setCenters(mockCenters);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  // Reset pagination on search or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const handleOpenCreate = () => {
    setSelectedCenter(null);
    setFormNombre('');
    setFormDireccion('');
    setFormCiudad('');
    setFormRuta('');
    setModalType('create');
    setSuccessMessage(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (center: Center) => {
    setSelectedCenter(center);
    setFormNombre(center.nombre);
    setFormDireccion(center.direccion || '');
    setFormCiudad(center.ciudad || '');
    setFormRuta(center.numero_ruta ? center.numero_ruta.toString() : '');
    setModalType('edit');
    setSuccessMessage(null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formNombre) {
      showCustomAlert('Campo Requerido', 'El Nombre es un campo requerido.', 'info');
      return;
    }

    const payload = {
      nombre: formNombre,
      direccion: formDireccion,
      ciudad: formCiudad,
      numero_ruta: formRuta ? parseInt(formRuta, 10) : null,
    };

    setLoading(true);
    try {
      let response;
      if (modalType === 'create') {
        response = await fetch(`${baseUrl}/centros_trabajo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${baseUrl}/centros_trabajo/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id_centro: selectedCenter?.id_centro }),
        });
      }

      const resData = await response.json();
      if (response.ok && resData.success) {
        setSuccessMessage('Se han guardado los datos correctamente.');
        fetchCenters();
        setTimeout(() => {
          setModalVisible(false);
          setSuccessMessage(null);
        }, 1500);
      } else {
        showCustomAlert('Error al guardar', resData.message || 'Error al guardar el centro.', 'info');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      showCustomAlert('Error de Red', 'Error de red al guardar.', 'info');
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = () => {
      setLoading(true);
      fetch(`${baseUrl}/centros_trabajo/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            fetchCenters();
          } else {
            showCustomAlert('Error al eliminar', data.message || 'No se pudo eliminar el centro.', 'info');
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error(err);
          showCustomAlert('Error de conexión', 'Error de conexión.', 'info');
          setLoading(false);
        });
    };

    showCustomAlert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este centro de trabajo?',
      'confirm',
      confirmDelete
    );
  };

  const handleExportCSV = () => {
    if (Platform.OS !== 'web') {
      showCustomAlert('Función No Disponible', 'La exportación de Excel está disponible en la versión Web.', 'info');
      return;
    }

    const headers = ['ID Centro', 'Nombre', 'Direccion', 'Ciudad', 'Numero Ruta', 'Fecha Registro'];
    const rows = filteredCenters.map((c) => [
      c.id_centro,
      c.nombre,
      c.direccion || 'N/A',
      c.ciudad || 'N/A',
      c.numero_ruta || 'N/A',
      c.fecha_registro || '2026-06-17',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'centros_trabajo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter centers by search
  const filteredCenters = centers.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (c.direccion && c.direccion.toLowerCase().includes(search.toLowerCase())) ||
      (c.ciudad && c.ciudad.toLowerCase().includes(search.toLowerCase()))
  );

  // Paginated centers
  const totalPages = Math.ceil(filteredCenters.length / itemsPerPage);
  const paginatedCenters = filteredCenters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <View style={styles.container}>
      {/* View Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.viewTitle}>GESTIÓN DE CENTROS</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.actionBtn, styles.excelBtn]} onPress={handleExportCSV}>
            <Feather name="download" size={16} color="#FFFFFF" />
            <Text style={styles.btnText}>Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.newBtn]} onPress={handleOpenCreate}>
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.btnText}>Nuevo</Text>
          </TouchableOpacity>
          <Animated.View
            style={[
              styles.searchContainer,
              {
                width: searchWidth,
                borderColor: isSearchFocused ? '#5C8E8D' : '#E2E8F0',
                borderWidth: isSearchFocused ? 2 : 1,
                backgroundColor: isSearchFocused ? '#FFFFFF' : '#F1F5F9',
              },
            ]}
          >
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
          </Animated.View>
        </View>
      </View>

      {/* Main Table Content */}
      {loading && centers.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5C8E8D" />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.scrollContainer} horizontal={true}>
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.thText, { width: 80 }]}>ID Centro</Text>
                <Text style={[styles.thText, { width: 220 }]}>Nombre</Text>
                <Text style={[styles.thText, { width: 280 }]}>Dirección</Text>
                <Text style={[styles.thText, { width: 120 }]}>Ciudad</Text>
                <Text style={[styles.thText, { width: 140 }]}>Fecha de registro</Text>
                <Text style={[styles.thText, { width: 120, textAlign: 'center' }]}>Acciones</Text>
              </View>

              {/* Table Rows */}
              <ScrollView style={{ flex: 1 }}>
                {paginatedCenters.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <Text style={styles.emptyText}>No se encontraron centros.</Text>
                  </View>
                ) : (
                  paginatedCenters.map((center, idx) => (
                    <View
                      key={center.id_centro}
                      style={[
                        styles.tableRow,
                        { backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' },
                      ]}
                    >
                      <Text style={[styles.tdText, { width: 80, fontWeight: '600' }]}>
                        {center.id_centro}
                      </Text>
                      <Text style={[styles.tdText, { width: 220, fontWeight: '500' }]}>
                        {center.nombre}
                      </Text>
                      <TouchableOpacity
                        style={[styles.tdView, { width: 280, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 10 }]}
                        onPress={() => {
                          if (center.direccion && center.direccion !== 'N/A') {
                            const query = `${center.direccion}${center.ciudad && center.ciudad !== 'N/A' ? ', ' + center.ciudad : ''}`;
                            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
                            Linking.openURL(url).catch((err) => console.error("Error al abrir Google Maps:", err));
                          }
                        }}
                        activeOpacity={0.7}
                        disabled={!center.direccion || center.direccion === 'N/A'}
                      >
                        <Feather name="map-pin" size={14} color={center.direccion && center.direccion !== 'N/A' ? '#5C8E8D' : '#94A3B8'} />
                        <Text
                          style={[
                            styles.tdText,
                            { flex: 1 },
                            center.direccion && center.direccion !== 'N/A'
                              ? { color: '#5C8E8D', textDecorationLine: 'underline' }
                              : { color: '#94A3B8' }
                          ]}
                          numberOfLines={2}
                        >
                          {center.direccion || 'N/A'}
                        </Text>
                      </TouchableOpacity>
                      <Text style={[styles.tdText, { width: 120 }]}>
                        {center.ciudad || 'N/A'}
                      </Text>
                      <Text style={[styles.tdText, { width: 140 }]}>
                        {center.fecha_registro ||
                          (center.created_at ? center.created_at.substring(0, 10) : '2026-06-17')}
                      </Text>
                      <View style={[styles.tdActions, { width: 120 }]}>
                        <TouchableOpacity
                          style={[styles.actionIcon, styles.editIcon]}
                          onPress={() => handleOpenEdit(center)}
                        >
                          <Feather name="edit-2" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionIcon, styles.deleteIcon]}
                          onPress={() => handleDelete(center.id_centro)}
                        >
                          <Feather name="trash-2" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
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
              <Text style={styles.paginationCount}>({filteredCenters.length} registros)</Text>
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

      {/* Modal Create / Edit */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'create' ? 'Nuevo Centro de Trabajo' : 'Editar Centro de Trabajo'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {successMessage && (
              <View style={{ backgroundColor: '#DEF7EC', padding: 12, borderRadius: 8, marginHorizontal: 20, marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="check-circle" size={16} color="#03543F" />
                <Text style={{ color: '#03543F', fontSize: 14, fontWeight: '500' }}>Se han guardado los datos correctamente.</Text>
              </View>
            )}

            <View style={styles.modalBody}>
              <Text style={styles.label}>Nombre del Centro *</Text>
              <TextInput
                style={styles.modalInput}
                value={formNombre}
                onChangeText={setFormNombre}
                placeholder="Almacén Central Cáceres"
              />

              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.modalInput}
                value={formDireccion}
                onChangeText={setFormDireccion}
                placeholder="Polígono Industrial Las Capellanías, Nave 5"
              />

              <Text style={styles.label}>Ciudad</Text>
              <TextInput
                style={styles.modalInput}
                value={formCiudad}
                onChangeText={setFormCiudad}
                placeholder="Cáceres"
              />

              <Text style={styles.label}>Número de Ruta (1-17)</Text>
              <TextInput
                style={styles.modalInput}
                value={formRuta}
                onChangeText={setFormRuta}
                keyboardType="number-pad"
                placeholder="5"
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
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Alert / Confirm Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={customAlertVisible}
        onRequestClose={() => setCustomAlertVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 400 }]}>
            <View style={[styles.modalHeader, { borderBottomWidth: 0, paddingBottom: 10 }]}>
              <Text style={styles.modalTitle}>{customAlertTitle}</Text>
              <TouchableOpacity onPress={() => setCustomAlertVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.modalBody, { paddingTop: 10, alignItems: 'center', gap: 16 }]}>
              {customAlertType === 'confirm' ? (
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="alert-triangle" size={28} color="#EF4444" />
                </View>
              ) : (
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="info" size={28} color="#0284C7" />
                </View>
              )}
              <Text style={{ fontSize: 15, color: '#334155', textAlign: 'center', lineHeight: 22 }}>
                {customAlertMessage}
              </Text>
            </View>

            <View style={[styles.modalFooter, { borderTopWidth: 0, backgroundColor: '#FFFFFF', padding: 20, gap: 12 }]}>
              {customAlertType === 'confirm' ? (
                <>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.cancelModalBtn, { flex: 1 }]}
                    onPress={() => setCustomAlertVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { flex: 1, backgroundColor: '#EF4444' }]}
                    onPress={() => {
                      setCustomAlertVisible(false);
                      if (customAlertConfirmAction) customAlertConfirmAction();
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14, textAlign: 'center' }}>Eliminar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveModalBtn, { width: '100%', backgroundColor: '#5C8E8D' }]}
                  onPress={() => setCustomAlertVisible(false)}
                >
                  <Text style={styles.saveBtnText}>Aceptar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


