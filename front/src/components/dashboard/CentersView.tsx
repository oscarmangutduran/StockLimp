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
} from 'react-native';
import { Feather } from '@expo/vector-icons';

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
    setModalVisible(true);
  };

  const handleOpenEdit = (center: Center) => {
    setSelectedCenter(center);
    setFormNombre(center.nombre);
    setFormDireccion(center.direccion || '');
    setFormCiudad(center.ciudad || '');
    setFormRuta(center.numero_ruta ? center.numero_ruta.toString() : '');
    setModalType('edit');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formNombre) {
      alert('El Nombre es un campo requerido.');
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
        fetchCenters();
        setModalVisible(false);
      } else {
        alert(resData.message || 'Error al guardar el centro.');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert('Error de red al guardar.');
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
            alert(data.message || 'No se pudo eliminar el centro.');
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error(err);
          alert('Error de conexión.');
          setLoading(false);
        });
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de que deseas eliminar este centro de trabajo?')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Confirmar eliminación',
        '¿Estás seguro de que deseas eliminar este centro de trabajo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const handleExportCSV = () => {
    if (Platform.OS !== 'web') {
      alert('La exportación de Excel está disponible en la versión Web.');
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
                      <View style={[styles.tdView, { width: 280, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 10 }]}>
                        <Feather name="map-pin" size={14} color="#5C8E8D" />
                        <Text style={[styles.tdText, { flex: 1, color: '#64748B' }]} numberOfLines={2}>
                          {center.direccion || 'N/A'}
                        </Text>
                      </View>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 16,
  },
  viewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  excelBtn: {
    backgroundColor: '#10B981',
  },
  newBtn: {
    backgroundColor: '#5C8E8D',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    justifyContent: 'center',
    width: 180,
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
    minHeight: 300,
  },
  scrollContainer: {
    flex: 1,
  },
  tableContainer: {
    minWidth: 920,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#5C8E8D',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  thText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  tdView: {
    justifyContent: 'center',
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
    gap: 12,
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    backgroundColor: '#F59E0B',
  },
  deleteIcon: {
    backgroundColor: '#EF4444',
  },
  // Pagination styles
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
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
});
