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
  Switch,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Product {
  id_producto: number;
  nombre: string;
  sku: string;
  precio_unidad: number;
  stock_actual: number;
  es_toxico: boolean | number;
  imagen?: string;
  fecha_registro?: string;
  created_at?: string;
}

interface ProductsViewProps {
  baseUrl: string;
}

const mockProducts: Product[] = [
  { id_producto: 1, nombre: "Detergente Industrial", sku: "DET-IND-001", es_toxico: true, precio_unidad: 1.29, stock_actual: 100, fecha_registro: "2026-05-18" },
  { id_producto: 2, nombre: "Lejía Concentrada", sku: "LEJ-CON-002", es_toxico: true, precio_unidad: 24.95, stock_actual: 50, fecha_registro: "2026-05-18" },
  { id_producto: 3, nombre: "Detergente Textil Profesional", sku: "DET-TEX-003", es_toxico: false, precio_unidad: 18.20, stock_actual: 85, fecha_registro: "2026-05-18" },
  { id_producto: 4, nombre: "Limpia Cristales Concentrado", sku: "CRI-CON-004", es_toxico: false, precio_unidad: 8.45, stock_actual: 120, fecha_registro: "2026-06-17" },
  { id_producto: 5, nombre: "Desengrasante Fuerte", sku: "DEG-ACID-005", es_toxico: true, precio_unidad: 32.10, stock_actual: 15, fecha_registro: "2026-06-17" },
  { id_producto: 6, nombre: "Ambientador Bosque 1L", sku: "AMB-BOS-006", es_toxico: false, precio_unidad: 5.75, stock_actual: 200, fecha_registro: "2026-06-17" }
];

export default function ProductsView({ baseUrl }: ProductsViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form states
  const [formNombre, setFormNombre] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formPrecio, setFormPrecio] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formEsToxico, setFormEsToxico] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/productos`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        setProducts(mockProducts);
      }
    } catch (error) {
      console.log('Error fetching products, loading mocks:', error);
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Reset pagination on search or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setFormNombre('');
    setFormSku('');
    setFormPrecio('');
    setFormStock('');
    setFormEsToxico(false);
    setModalType('create');
    setModalVisible(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormNombre(product.nombre);
    setFormSku(product.sku || '');
    setFormPrecio(product.precio_unidad.toString());
    setFormStock(product.stock_actual.toString());
    setFormEsToxico(!!product.es_toxico);
    setModalType('edit');
    setModalVisible(true);
  };

  const handleOpenInfo = (product: Product) => {
    setSelectedProduct(product);
    setModalType('info');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formNombre || !formPrecio || !formStock) {
      alert('Por favor, completa los campos requeridos (Nombre, Precio, Stock).');
      return;
    }

    const payload = {
      nombre: formNombre,
      sku: formSku,
      precio_unidad: parseFloat(formPrecio),
      stock_actual: parseInt(formStock, 10),
      es_toxico: formEsToxico ? 1 : 0,
    };

    setLoading(true);
    try {
      let response;
      if (modalType === 'create') {
        response = await fetch(`${baseUrl}/productos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${baseUrl}/productos/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id_producto: selectedProduct?.id_producto }),
        });
      }

      const resData = await response.json();
      if (response.ok && resData.success) {
        fetchProducts();
        setModalVisible(false);
      } else {
        alert(resData.message || 'Error al guardar el producto.');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al conectar con el servidor.');
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = () => {
      setLoading(true);
      fetch(`${baseUrl}/productos/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_producto: id }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            fetchProducts();
          } else {
            alert(data.message || 'No se pudo eliminar el producto.');
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error(err);
          alert('Error de conexión con el servidor.');
          setLoading(false);
        });
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Confirmar eliminación',
        '¿Estás seguro de que deseas eliminar este producto?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const handleExportExcel = () => {
    if (Platform.OS === 'web') {
      window.open(`${baseUrl}/productos/exportar`, '_blank');
    } else {
      alert('La descarga de Excel está disponible en la versión Web.');
    }
  };

  // Filter products by search
  const filteredProducts = products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  // Paginated products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <View style={styles.container}>
      {/* View Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.viewTitle}>GESTIÓN DE PRODUCTOS</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.actionBtn, styles.excelBtn]} onPress={handleExportExcel}>
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
      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5C8E8D" />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.scrollContainer} horizontal={true}>
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.thText, { width: 60 }]}>ID Producto</Text>
                <Text style={[styles.thText, { width: 80 }]}>Imagen</Text>
                <Text style={[styles.thText, { width: 180 }]}>Nombre</Text>
                <Text style={[styles.thText, { width: 120 }]}>SKU</Text>
                <Text style={[styles.thText, { width: 100 }]}>¿Tóxico?</Text>
                <Text style={[styles.thText, { width: 100 }]}>Precio Unidad</Text>
                <Text style={[styles.thText, { width: 100 }]}>Stock Actual</Text>
                <Text style={[styles.thText, { width: 120 }]}>Fecha de registro</Text>
                <Text style={[styles.thText, { width: 120, textAlign: 'center' }]}>Acciones</Text>
              </View>

              {/* Table Rows */}
              <ScrollView style={{ flex: 1 }}>
                {paginatedProducts.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <Text style={styles.emptyText}>No se encontraron productos.</Text>
                  </View>
                ) : (
                  paginatedProducts.map((product, idx) => (
                    <View
                      key={product.id_producto}
                      style={[
                        styles.tableRow,
                        { backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' },
                      ]}
                    >
                      <Text style={[styles.tdText, { width: 60 }]}>#{product.id_producto}</Text>
                      <View style={[styles.tdView, { width: 80, alignItems: 'center' }]}>
                        <View style={styles.imagePlaceholder}>
                          <Feather name="box" size={18} color="#94A3B8" />
                        </View>
                      </View>
                      <Text style={[styles.tdText, { width: 180, fontWeight: '500' }]}>
                        {product.nombre}
                      </Text>
                      <Text style={[styles.tdText, { width: 120, color: '#64748B' }]}>
                        {product.sku || 'N/A'}
                      </Text>
                      <Text
                        style={[
                          styles.tdText,
                          {
                            width: 100,
                            fontWeight: 'bold',
                            color: product.es_toxico ? '#EF4444' : '#1E293B',
                          },
                        ]}
                      >
                        {product.es_toxico ? 'SÍ' : 'NO'}
                      </Text>
                      <Text style={[styles.tdText, { width: 100 }]}>
                        {parseFloat(product.precio_unidad.toString()).toFixed(2)}€
                      </Text>
                      <Text style={[styles.tdText, { width: 100 }]}>
                        {product.stock_actual}
                      </Text>
                      <Text style={[styles.tdText, { width: 120 }]}>
                        {product.fecha_registro ||
                          (product.created_at ? product.created_at.substring(0, 10) : '2026-06-17')}
                      </Text>
                      <View style={[styles.tdActions, { width: 120 }]}>
                        <TouchableOpacity
                          style={[styles.actionIcon, styles.infoIcon]}
                          onPress={() => handleOpenInfo(product)}
                        >
                          <Feather name="info" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionIcon, styles.editIcon]}
                          onPress={() => handleOpenEdit(product)}
                        >
                          <Feather name="edit-2" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionIcon, styles.deleteIcon]}
                          onPress={() => handleDelete(product.id_producto)}
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
              <Text style={styles.paginationCount}>({filteredProducts.length} registros)</Text>
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

      {/* Modal View for Info / Create / Edit */}
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
                {modalType === 'info' && 'Detalles del Producto'}
                {modalType === 'create' && 'Nuevo Producto'}
                {modalType === 'edit' && 'Editar Producto'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {modalType === 'info' && selectedProduct ? (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID Producto:</Text>
                  <Text style={styles.detailVal}>#{selectedProduct.id_producto}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nombre:</Text>
                  <Text style={styles.detailVal}>{selectedProduct.nombre}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>SKU:</Text>
                  <Text style={styles.detailVal}>{selectedProduct.sku || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Precio Unidad:</Text>
                  <Text style={styles.detailVal}>{parseFloat(selectedProduct.precio_unidad.toString()).toFixed(2)}€</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Stock Actual:</Text>
                  <Text style={styles.detailVal}>{selectedProduct.stock_actual}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>¿Es Tóxico?:</Text>
                  <Text style={[styles.detailVal, { fontWeight: 'bold', color: selectedProduct.es_toxico ? '#EF4444' : '#10B981' }]}>
                    {selectedProduct.es_toxico ? 'SÍ (Peligroso)' : 'NO'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fecha Registro:</Text>
                  <Text style={styles.detailVal}>
                    {selectedProduct.fecha_registro || 
                     (selectedProduct.created_at ? selectedProduct.created_at.substring(0, 10) : '2026-06-17')}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <Text style={styles.label}>Nombre del Producto *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formNombre}
                  onChangeText={setFormNombre}
                  placeholder="Detergente Industrial"
                />

                <Text style={styles.label}>SKU</Text>
                <TextInput
                  style={styles.modalInput}
                  value={formSku}
                  onChangeText={setFormSku}
                  placeholder="DET-IND-001"
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Precio Unidad (€) *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={formPrecio}
                      onChangeText={setFormPrecio}
                      keyboardType="numeric"
                      placeholder="1.29"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.label}>Stock Actual *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={formStock}
                      onChangeText={setFormStock}
                      keyboardType="number-pad"
                      placeholder="100"
                    />
                  </View>
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.label}>¿Es un producto tóxico?</Text>
                  <Switch
                    value={formEsToxico}
                    onValueChange={setFormEsToxico}
                    trackColor={{ false: '#CBD5E1', true: '#EF4444' }}
                    thumbColor={formEsToxico ? '#EF4444' : '#F1F5F9'}
                  />
                </View>
              </View>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cerrar</Text>
              </TouchableOpacity>
              {modalType !== 'info' && (
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveModalBtn]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
              )}
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
    minWidth: 980,
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
  imagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    backgroundColor: '#3B82F6',
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
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailLabel: {
    width: 140,
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  detailVal: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
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
