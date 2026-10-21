import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../css/OrdersView.styles';
import { authFetch } from '../../utils/api';

// Subcomponentes modulares
import {
  Order,
  Center,
  User,
  Product,
  FormItem,
  OrdersViewProps,
} from './orders/types';
import { OrderDetailsModal } from './orders/OrderDetailsModal';
import { OrderFormModal } from './orders/OrderFormModal';
import { CenterSelectionModal } from './orders/CenterSelectionModal';
import { NextCenterModal } from './orders/NextCenterModal';
import { CustomAlertModal } from './orders/CustomAlertModal';
import { PeriodNoticeBanner } from './orders/PeriodNoticeBanner';
import { OrdersTable } from './orders/OrdersTable';

const mockOrders: Order[] = [
  {
    id_pedido: 11,
    id_user: 1,
    id_centro: 1,
    fecha_creacion: "2026-06-19 08:21:56",
    estado: "EN_PREPARACION",
    operario: "Oscar",
    detalles: [
      { id_detalle: 1, id_pedido: 11, id_producto: 2, cantidad_solicitada: 2, precio_total_linea: 49.9, producto: { nombre: "Lejía Concentrada", precio_unidad: 24.95 } },
      { id_detalle: 2, id_pedido: 11, id_producto: 3, cantidad_solicitada: 4, precio_total_linea: 72.8, producto: { nombre: "Detergente Textil", precio_unidad: 18.2 } },
    ]
  },
  {
    id_pedido: 6,
    id_user: 3,
    id_centro: 2,
    fecha_creacion: "2026-06-18 12:27:01",
    estado: "CANCELADO",
    operario: "Operario Almacén",
    detalles: [
      { id_detalle: 3, id_pedido: 6, id_producto: 1, cantidad_solicitada: 3, precio_total_linea: 3.87, producto: { nombre: "Detergente Industrial", precio_unidad: 1.29 } },
      { id_detalle: 4, id_pedido: 6, id_producto: 4, cantidad_solicitada: 10, precio_total_linea: 84.5, producto: { nombre: "Limpia Cristales Concentrado", precio_unidad: 8.45 } },
    ]
  },
  {
    id_pedido: 5,
    id_user: 3,
    id_centro: 2,
    fecha_creacion: "2026-06-18 12:27:00",
    estado: "EN_PREPARACION",
    operario: "Operario Almacén",
    detalles: [
      { id_detalle: 5, id_pedido: 5, id_producto: 1, cantidad_solicitada: 3, precio_total_linea: 3.87, producto: { nombre: "Detergente Industrial", precio_unidad: 1.29 } },
      { id_detalle: 6, id_pedido: 5, id_producto: 4, cantidad_solicitada: 10, precio_total_linea: 84.5, producto: { nombre: "Limpia Cristales Concentrado", precio_unidad: 8.45 } },
    ]
  },
];

export default function OrdersView({ baseUrl, userRole = 'admin', userId, idCentro, currentUser }: OrdersViewProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const isTablet = Platform.OS === 'web' && width >= 768 && width < 1024;
  const isMobile = Platform.OS !== 'web' || width < 768;
  const isTabletOrDesktop = isDesktop || isTablet;

  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchWidth] = useState(new Animated.Value(isTabletOrDesktop ? 220 : 160));
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('ENTREGADO');
  const [orderStatuses, setOrderStatuses] = useState<{ [id_pedido: number]: string }>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'info'>('create');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formUserId, setFormUserId] = useState<string>('1');
  const [formCenterId, setFormCenterId] = useState<string>('1');
  const [formObservaciones, setFormObservaciones] = useState<string>('');
  const [formItems, setFormItems] = useState<FormItem[]>([]);

  // Period verification
  const [simulateActivePeriod, setSimulateActivePeriod] = useState(false);

  // Multi-center modals
  const [centerSelectionModalVisible, setCenterSelectionModalVisible] = useState(false);
  const [nextCenterModalVisible, setNextCenterModalVisible] = useState(false);
  const [justSavedCenterName, setJustSavedCenterName] = useState<string>('');
  const [pendingCentersForNext, setPendingCentersForNext] = useState<Center[]>([]);

  // Custom alert
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertType, setCustomAlertType] = useState<'info' | 'confirm'>('info');
  const [customAlertConfirmAction, setCustomAlertConfirmAction] = useState<(() => void) | null>(null);

  const showCustomAlert = (title: string, message: string, type: 'info' | 'confirm' = 'info', onConfirm?: () => void) => {
    setCustomAlertTitle(title);
    setCustomAlertMessage(message);
    setCustomAlertType(type);
    setCustomAlertConfirmAction(onConfirm ? () => onConfirm : null);
    setCustomAlertVisible(true);
  };

  const isPeriodActive = () => {
    if (simulateActivePeriod) return true;
    const currentDay = new Date().getDate();
    return currentDay >= 2 && currentDay <= 8;
  };

  const getUserAssignedCenters = (targetUserId?: number): Center[] => {
    if (!targetUserId) return [];
    if (currentUser && currentUser.id_user === targetUserId && currentUser.assigned_centros && currentUser.assigned_centros.length > 0) {
      return currentUser.assigned_centros;
    }
    const foundUser = users.find(u => u.id_user === targetUserId);
    if (foundUser?.assigned_centros && foundUser.assigned_centros.length > 0) {
      return foundUser.assigned_centros;
    }
    if (foundUser?.centros && foundUser.centros.length > 0) {
      return foundUser.centros;
    }
    if (foundUser?.id_centro) {
      const single = centers.find(c => c.id_centro === foundUser.id_centro);
      if (single) return [single];
    }
    if (currentUser?.id_centro && currentUser.id_user === targetUserId) {
      const single = centers.find(c => c.id_centro === currentUser.id_centro);
      if (single) return [single];
    }
    return [];
  };

  const getOrderForCenter = (centerId: number, targetUserId?: number): Order | undefined => {
    return orders.find(o => o.id_centro === centerId && (!targetUserId || o.id_user === targetUserId));
  };

  const handleStartCreateForCenter = (centerId: number) => {
    const existing = getOrderForCenter(centerId, userId);
    if (existing) {
      setCenterSelectionModalVisible(false);
      setNextCenterModalVisible(false);
      handleOpenEdit(existing);
      return;
    }

    setSelectedOrder(null);
    setFormUserId(userId ? userId.toString() : '1');
    setFormCenterId(centerId.toString());
    setFormObservaciones('');
    setFormItems([{ id_producto: products[0]?.id_producto || 1, cantidad: 1 }]);
    setModalType('create');
    setSuccessMessage(null);
    setCenterSelectionModalVisible(false);
    setNextCenterModalVisible(false);
    setModalVisible(true);
  };

  // Fetch all orders and support lists
  const fetchData = async () => {
    setLoading(true);
    try {
      const url = userRole === 'usuario' && userId
        ? `${baseUrl}/pedidos?id_user=${userId}`
        : `${baseUrl}/pedidos`;
      const ordersRes = await authFetch(url);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data);
      } else {
        setOrders(mockOrders);
      }

      // Fetch users, centers, products for dropdowns
      const usersRes = await authFetch(`${baseUrl}/usuarios`);
      if (usersRes.ok) setUsers(await usersRes.json());

      const centersRes = await authFetch(`${baseUrl}/centros_trabajo`);
      if (centersRes.ok) setCenters(await centersRes.json());

      const productsRes = await authFetch(`${baseUrl}/productos`);
      if (productsRes.ok) setProducts(await productsRes.json());

    } catch (error) {
      console.log('Error fetching data, loading mocks:', error);
      setOrders(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination on search or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const handleOpenCreate = () => {
    setSelectedOrder(null);
    const initialUser = userRole === 'usuario' && userId ? userId.toString() : (users[0]?.id_user?.toString() || '1');
    setFormUserId(initialUser);
    const assigned = getUserAssignedCenters(parseInt(initialUser, 10));
    setFormCenterId(assigned[0]?.id_centro?.toString() || centers[0]?.id_centro?.toString() || '1');
    setFormObservaciones('');
    setFormItems([{ id_producto: products[0]?.id_producto || 1, cantidad: 1 }]);
    setModalType('create');
    setSuccessMessage(null);
    setModalVisible(true);
  };

  const handleOpenCreateForUser = () => {
    if (!isPeriodActive()) {
      showCustomAlert('Fuera de plazo', 'El período para realizar o modificar pedidos es del día 2 al 8 de cada mes.', 'info');
      return;
    }
    const myCenters = getUserAssignedCenters(userId);
    if (myCenters.length === 0) {
      showCustomAlert('Sin Centro Asignado', 'No tienes ningún centro de trabajo asignado. Por favor, contacta con tu administrador.', 'info');
      return;
    }
    if (myCenters.length === 1) {
      handleStartCreateForCenter(myCenters[0].id_centro);
      return;
    }
    setCenterSelectionModalVisible(true);
  };

  const handleOpenEdit = (order: Order) => {
    setSelectedOrder(order);
    setFormUserId(order.id_user.toString());
    setFormCenterId(order.id_centro?.toString() || '1');
    setFormObservaciones(order.observaciones || '');
    setFormItems(
      order.detalles.map((d) => ({
        id_producto: d.id_producto,
        cantidad: d.cantidad_solicitada,
      }))
    );
    setModalType('edit');
    setSuccessMessage(null);
    setModalVisible(true);
  };

  const handleOpenInfo = (order: Order) => {
    setSelectedOrder(order);
    setModalType('info');
    setSuccessMessage(null);
    setModalVisible(true);
  };

  const getProductColor = (p: Product) => {
    if (p.es_toxico) return '#FEE2E2';
    const name = p.nombre.toLowerCase();
    if (name.includes('cristal') || name.includes('limpia')) return '#ECFEFF';
    if (name.includes('ambient') || name.includes('bosque')) return '#ECFDF5';
    if (name.includes('lejia') || name.includes('cloro')) return '#FEF3C7';
    return '#EFF6FF';
  };

  const getProductIconColor = (p: Product) => {
    if (p.es_toxico) return '#EF4444';
    const name = p.nombre.toLowerCase();
    if (name.includes('cristal') || name.includes('limpia')) return '#0891B2';
    if (name.includes('ambient') || name.includes('bosque')) return '#059669';
    if (name.includes('lejia') || name.includes('cloro')) return '#D97706';
    return '#2563EB';
  };

  const getProductIcon = (p: Product) => {
    if (p.es_toxico) return 'alert-triangle';
    const name = p.nombre.toLowerCase();
    if (name.includes('cristal') || name.includes('limpia')) return 'wind';
    if (name.includes('ambient') || name.includes('bosque')) return 'feather';
    if (name.includes('lejia') || name.includes('cloro')) return 'shield';
    return 'droplet';
  };

  const handleProductCardClick = (productId: number) => {
    const existing = formItems.find((item) => item.id_producto === productId);
    if (existing) {
      setFormItems(
        formItems.map((item) =>
          item.id_producto === productId ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      );
    } else {
      setFormItems([...formItems, { id_producto: productId, cantidad: 1 }]);
    }
  };

  const handleAdjustQuantity = (productId: number, amount: number) => {
    setFormItems(
      formItems
        .map((item) => {
          if (item.id_producto === productId) {
            const nextQty = item.cantidad + amount;
            return { ...item, cantidad: nextQty };
          }
          return item;
        })
        .filter((item) => item.cantidad > 0)
    );
  };

  const handleRemoveProduct = (productId: number) => {
    setFormItems(formItems.filter((item) => item.id_producto !== productId));
  };

  const handleSave = async () => {
    if (formItems.length === 0) {
      showCustomAlert('Detalles del Pedido', 'Por favor, agrega al menos un producto al pedido.', 'info');
      return;
    }

    const payload = {
      id_user: parseInt(formUserId, 10),
      id_centro: parseInt(formCenterId, 10),
      productos: formItems.map((item) => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
      })),
      observaciones: formObservaciones,
    };

    setLoading(true);
    try {
      let response;
      if (modalType === 'create') {
        response = await authFetch(`${baseUrl}/pedidos/multiple`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else {
        response = await authFetch(`${baseUrl}/pedidos/update-details`, {
          method: 'POST',
          body: JSON.stringify({ ...payload, id_pedido: selectedOrder?.id_pedido }),
        });
      }

      const resData = await response.json();
      if (response.ok && resData.success) {
        setSuccessMessage('Se han guardado los datos correctamente.');
        await fetchData();

        const currentSavedCenterId = parseInt(formCenterId, 10);
        const savedCenterObj = centers.find(c => c.id_centro === currentSavedCenterId);
        const myCenters = getUserAssignedCenters(userId);

        if (userRole === 'usuario' && myCenters.length > 1 && modalType === 'create') {
          const remaining = myCenters.filter(
            (c) => c.id_centro !== currentSavedCenterId && !orders.some((o) => o.id_centro === c.id_centro && o.id_user === userId)
          );

          setLoading(false);
          setModalVisible(false);
          setSuccessMessage(null);

          if (remaining.length > 0) {
            setJustSavedCenterName(savedCenterObj?.nombre || 'Centro');
            setPendingCentersForNext(remaining);
            setNextCenterModalVisible(true);
          } else {
            showCustomAlert(
              '¡Todos los pedidos completados!',
              `Has completado los pedidos para todos tus centros asignados (${myCenters.map((c) => c.nombre).join(', ')}).`,
              'info'
            );
          }
          return;
        }

        setTimeout(() => {
          setModalVisible(false);
          setSuccessMessage(null);
        }, 1500);
      } else {
        showCustomAlert('Error al guardar', resData.message || 'Error al guardar el pedido.', 'info');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      showCustomAlert('Error de Red', 'Error de red al guardar.', 'info');
      setLoading(false);
    }
  };

  const handleSaveOrderStatus = async (id: number) => {
    const statusToSave = orderStatuses[id] !== undefined ? orderStatuses[id] : orders.find(o => o.id_pedido === id)?.estado || 'PENDIENTE';

    setLoading(true);
    try {
      const res = await authFetch(`${baseUrl}/pedidos/update`, {
        method: 'POST',
        body: JSON.stringify({ id_pedido: id, estado: statusToSave }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedStatuses = { ...orderStatuses };
        delete updatedStatuses[id];
        setOrderStatuses(updatedStatuses);
        
        fetchData();
        showCustomAlert('Éxito', 'Cambios guardados correctamente.', 'info');
      } else {
        showCustomAlert('Error', data.message || 'Error al actualizar el estado.', 'info');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      showCustomAlert('Error de conexión', 'Error de conexión.', 'info');
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedOrderIds.length === 0) {
      showCustomAlert('Acción Requerida', 'Por favor, selecciona al menos un pedido.', 'info');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(`${baseUrl}/pedidos/update-multiple`, {
        method: 'POST',
        body: JSON.stringify({ ids: selectedOrderIds, estado: bulkStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrderIds([]);
        fetchData();
        showCustomAlert('Éxito', 'Se ha actualizado el estado de los pedidos seleccionados.', 'info');
      } else {
        showCustomAlert('Error', data.message || 'Error al actualizar los estados.', 'info');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      showCustomAlert('Error de conexión', 'Error de conexión con el servidor.', 'info');
      setLoading(false);
    }
  };

  const toggleSelectOrder = (id: number) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter((orderId) => orderId !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  const toggleSelectAll = (currentPageOrders: Order[]) => {
    const pageIds = currentPageOrders.map(o => o.id_pedido);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedOrderIds.includes(id));

    if (allSelected) {
      setSelectedOrderIds(selectedOrderIds.filter(id => !pageIds.includes(id)));
    } else {
      const newSelected = [...selectedOrderIds];
      pageIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      setSelectedOrderIds(newSelected);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = () => {
      setLoading(true);
      authFetch(`${baseUrl}/pedidos/delete`, {
        method: 'POST',
        body: JSON.stringify({ id_pedido: id }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            fetchData();
          } else {
            showCustomAlert('Error al eliminar', data.message || 'No se pudo eliminar el pedido.', 'info');
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
      '¿Estás seguro de que deseas eliminar este pedido?',
      'confirm',
      confirmDelete
    );
  };

  const handleExportExcel = () => {
    if (Platform.OS === 'web') {
      window.open(`${baseUrl}/pedidos/exportar`, '_blank');
    } else {
      showCustomAlert('Función No Disponible', 'La descarga de Excel está disponible en la versión Web.', 'info');
    }
  };

  const getStatusStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'EN_PREPARACION') return { bg: '#F5E6FF', text: '#A855F7' };
    if (s === 'CANCELADO') return { bg: '#FFEBEB', text: '#EF4444' };
    if (s === 'ENTREGADO') return { bg: '#EBFDF5', text: '#10B981' };
    return { bg: '#F1F5F9', text: '#64748B' };
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const operarioName = order.operario || '';
    const centerName = order.centro?.nombre || '';
    const matchesSearch =
      order.id_pedido.toString().includes(search) ||
      operarioName.toLowerCase().includes(search.toLowerCase()) ||
      centerName.toLowerCase().includes(search.toLowerCase()) ||
      order.estado.toLowerCase().includes(search.toLowerCase());

    const matchesRoute =
      selectedRoute === 'all' ||
      (order.numero_ruta && order.numero_ruta.toString() === selectedRoute);

    return matchesSearch && matchesRoute;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    Animated.timing(searchWidth, {
      toValue: isDesktop ? 300 : (isTablet ? 260 : width - 64),
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    Animated.timing(searchWidth, {
      toValue: isDesktop ? 220 : (isTablet ? 200 : 160),
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  // Table layout columns width
  const colWidths = {
    id: isTabletOrDesktop ? 100 : 80,
    operario: isTabletOrDesktop ? 140 : 110,
    productos: isTabletOrDesktop ? (userRole === 'usuario' ? 260 : 240) : 180,
    fecha: isTabletOrDesktop ? (userRole === 'usuario' ? 160 : 150) : 130,
    centro: isTabletOrDesktop ? 180 : 150,
    estado: isTabletOrDesktop ? 140 : 110,
    acciones: 140,
  };

  const tableMinWidth = isDesktop
    ? (userRole === 'usuario' ? 980 : 1120)
    : (isTablet ? (userRole === 'usuario' ? 920 : 960) : 700);

  return (
    <View style={styles.container}>
      {/* View Header */}
      <View style={[styles.headerContainer, isMobile && { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
        <Text style={styles.viewTitle}>
          {userRole === 'usuario' ? 'MIS PEDIDOS' : 'GESTIÓN DE PEDIDOS'}
        </Text>
        <View style={[styles.headerActions, isMobile && { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
          {userRole === 'repartidor' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.selectWrapper, { height: 40, width: 160, marginBottom: 0, overflow: 'hidden', borderRadius: 20, borderColor: '#E2E8F0', borderWidth: 1 }]}>
                <select
                  style={{
                    ...styles.htmlSelect,
                    height: '100%',
                    fontSize: 14,
                    outlineStyle: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                  } as any}
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                >
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="EN_PREPARACION">EN_PREPARACION</option>
                  <option value="ENTREGADO">ENTREGADO</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                onPress={handleBulkStatusUpdate}
              >
                <Text style={styles.btnText}>CAMBIAR ESTADO</Text>
              </TouchableOpacity>
            </View>
          )}

          {userRole === 'usuario' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.newBtn, isMobile && { justifyContent: 'center' }]}
              onPress={handleOpenCreateForUser}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.btnText}>Nuevo Pedido</Text>
            </TouchableOpacity>
          )}

          {(userRole === 'super_admin' || userRole === 'admin') && (
            isTabletOrDesktop ? (
              <>
                <TouchableOpacity style={[styles.actionBtn, styles.excelBtn]} onPress={handleExportExcel}>
                  <Feather name="download" size={16} color="#FFFFFF" />
                  <Text style={styles.btnText}>Excel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.newBtn]} onPress={handleOpenCreate}>
                  <Feather name="plus" size={16} color="#FFFFFF" />
                  <Text style={styles.btnText}>Nuevo</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <TouchableOpacity style={[styles.actionBtn, styles.excelBtn, { flex: 1, justifyContent: 'center' }]} onPress={handleExportExcel}>
                  <Feather name="download" size={16} color="#FFFFFF" />
                  <Text style={styles.btnText}>Excel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.newBtn, { flex: 1, justifyContent: 'center' }]} onPress={handleOpenCreate}>
                  <Feather name="plus" size={16} color="#FFFFFF" />
                  <Text style={styles.btnText}>Nuevo</Text>
                </TouchableOpacity>
              </View>
            )
          )}

          <Animated.View
            style={[
              styles.searchContainer,
              {
                width: isTabletOrDesktop ? searchWidth : '100%',
                borderColor: isSearchFocused ? '#5C8E8D' : '#E2E8F0',
                borderWidth: isSearchFocused ? 2 : 1,
                backgroundColor: isSearchFocused ? '#FFFFFF' : '#F1F5F9',
              },
            ]}
          >
            <TextInput
              style={styles.searchInput as any}
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

      {/* Period Notice Banner for Employees */}
      {userRole === 'usuario' && (
        <PeriodNoticeBanner
          isPeriodActive={isPeriodActive()}
          simulateActivePeriod={simulateActivePeriod}
          onToggleSimulate={() => setSimulateActivePeriod(!simulateActivePeriod)}
        />
      )}

      {/* Multi-center banner for employees */}
      {userRole === 'usuario' && getUserAssignedCenters(userId).length > 1 && (
        <View style={styles.employeeCentersBanner}>
          <View style={styles.employeeCentersHeader}>
            <View>
              <Text style={styles.employeeCentersTitle}>
                Tus Centros de Trabajo Asignados ({getUserAssignedCenters(userId).length})
              </Text>
              <Text style={styles.employeeCentersSubtitle}>
                Debes realizar un pedido individual para cada uno de tus centros asignados:
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, styles.newBtn, { height: 34, paddingHorizontal: 14 }]}
              onPress={handleOpenCreateForUser}
            >
              <Feather name="plus" size={14} color="#FFFFFF" />
              <Text style={[styles.btnText, { fontSize: 13 }]}>Hacer Pedido</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.employeeCentersList}>
            {getUserAssignedCenters(userId).map((c) => {
              const existing = getOrderForCenter(c.id_centro, userId);
              return (
                <View
                  key={c.id_centro}
                  style={[
                    styles.employeeCenterCard,
                    existing ? { borderColor: '#BBF7D0' } : { borderColor: '#FDE68A' }
                  ]}
                >
                  <View style={styles.employeeCenterCardHeader}>
                    <Feather name="map-pin" size={15} color={existing ? '#16A34A' : '#D97706'} />
                    <Text style={styles.employeeCenterName} numberOfLines={1}>
                      {c.nombre}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.employeeCenterStatusBadge,
                      { backgroundColor: existing ? '#DCFCE7' : '#FEF3C7' }
                    ]}
                  >
                    <Text
                      style={[
                        styles.employeeCenterStatusText,
                        { color: existing ? '#15803D' : '#B45309' }
                      ]}
                    >
                      {existing ? `✓ Pedido #${existing.id_pedido} (${existing.estado})` : '⚠️ Pedido pendiente'}
                    </Text>
                  </View>

                  {!existing ? (
                    <TouchableOpacity
                      style={styles.employeeCenterActionBtn}
                      onPress={() => {
                        if (!isPeriodActive()) {
                          showCustomAlert('Fuera de plazo', 'El período para realizar o modificar pedidos es del día 2 al 8 de cada mes.', 'info');
                          return;
                        }
                        handleStartCreateForCenter(c.id_centro);
                      }}
                    >
                      <Feather name="shopping-cart" size={13} color="#FFFFFF" />
                      <Text style={styles.employeeCenterActionBtnText}>Hacer Pedido para este Centro</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.employeeCenterActionBtn, { backgroundColor: '#F1F5F9' }]}
                      onPress={() => handleOpenInfo(existing)}
                    >
                      <Feather name="eye" size={13} color="#475569" />
                      <Text style={[styles.employeeCenterActionBtnText, { color: '#475569' }]}>Ver Pedido</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Main Table Content */}
      {loading && orders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5C8E8D" />
        </View>
      ) : (
        <OrdersTable
          paginatedOrders={paginatedOrders}
          filteredOrdersCount={filteredOrders.length}
          selectedOrderIds={selectedOrderIds}
          tableMinWidth={tableMinWidth}
          colWidths={colWidths}
          isDesktop={isDesktop}
          isTabletOrDesktop={isTabletOrDesktop}
          userRole={userRole}
          orderStatuses={orderStatuses}
          setOrderStatuses={setOrderStatuses}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          isPeriodActive={isPeriodActive}
          toggleSelectOrder={toggleSelectOrder}
          toggleSelectAll={toggleSelectAll}
          getStatusStyle={getStatusStyle}
          handleOpenInfo={handleOpenInfo}
          handleOpenEdit={handleOpenEdit}
          handleDelete={handleDelete}
          handleSaveOrderStatus={handleSaveOrderStatus}
        />
      )}

      {/* Modal Details */}
      <OrderDetailsModal
        visible={modalVisible && modalType === 'info'}
        order={selectedOrder}
        onClose={() => setModalVisible(false)}
      />

      {/* Modal Create / Edit */}
      <OrderFormModal
        visible={modalVisible && modalType !== 'info'}
        modalType={modalType === 'edit' ? 'edit' : 'create'}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        successMessage={Boolean(successMessage)}
        formCenterId={formCenterId}
        setFormCenterId={setFormCenterId}
        formUserId={formUserId}
        setFormUserId={setFormUserId}
        formObservaciones={formObservaciones}
        setFormObservaciones={setFormObservaciones}
        formItems={formItems}
        centers={centers}
        products={products}
        users={users}
        userRole={userRole}
        userId={userId}
        getUserAssignedCenters={getUserAssignedCenters}
        onOpenCenterSelection={() => {
          setModalVisible(false);
          setCenterSelectionModalVisible(true);
        }}
        onProductCardClick={handleProductCardClick}
        onAdjustQuantity={handleAdjustQuantity}
        onRemoveProduct={handleRemoveProduct}
        getProductColor={getProductColor}
        getProductIcon={getProductIcon}
        getProductIconColor={getProductIconColor}
      />

      {/* Modal Selección de Centro para Empleados con varios centros */}
      <CenterSelectionModal
        visible={centerSelectionModalVisible}
        onClose={() => setCenterSelectionModalVisible(false)}
        assignedCenters={getUserAssignedCenters(userId)}
        formCenterId={formCenterId}
        userId={userId}
        getOrderForCenter={getOrderForCenter}
        onSelectCenter={handleStartCreateForCenter}
      />

      {/* Modal Siguiente Centro */}
      <NextCenterModal
        visible={nextCenterModalVisible}
        onClose={() => setNextCenterModalVisible(false)}
        justSavedCenterName={justSavedCenterName}
        pendingCentersForNext={pendingCentersForNext}
        onStartCreateForCenter={handleStartCreateForCenter}
      />

      {/* Custom Alert / Confirm Modal */}
      <CustomAlertModal
        visible={customAlertVisible}
        type={customAlertType}
        title={customAlertTitle}
        message={customAlertMessage}
        onClose={() => setCustomAlertVisible(false)}
        onConfirm={customAlertConfirmAction || undefined}
      />
    </View>
  );
}
