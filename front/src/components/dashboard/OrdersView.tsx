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
import { styles } from '../../css/OrdersView.styles';

interface OrderDetail {
  id_detalle: number;
  id_pedido: number;
  id_producto: number;
  cantidad_solicitada: number;
  precio_total_linea: number;
  producto?: {
    nombre: string;
    precio_unidad: number;
  };
}

interface Order {
  id_pedido: number;
  id_user: number;
  id_centro: number;
  fecha_creacion: string;
  estado: string;
  observaciones?: string;
  operario: string;
  numero_ruta?: string;
  detalles: OrderDetail[];
  usuario?: {
    nombre: string;
    email: string;
  };
  centro?: {
    nombre: string;
  };
}

interface Center {
  id_centro: number;
  nombre: string;
  direccion?: string;
  ciudad?: string;
  numero_ruta?: number;
}

interface User {
  id_user: number;
  nombre: string;
  rol: string;
  id_centro?: number | null;
  centro?: Center;
  centros?: Center[];
  assigned_centros?: Center[];
}

interface Product {
  id_producto: number;
  nombre: string;
  precio_unidad: number;
  es_toxico?: boolean | number;
}

interface OrdersViewProps {
  baseUrl: string;
  userRole?: string;
  userId?: number;
  idCentro?: number | null;
  currentUser?: any;
}

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
  {
    id_pedido: 4,
    id_user: 4,
    id_centro: 3,
    fecha_creacion: "2026-04-23 16:39:32",
    estado: "CANCELADO",
    operario: "pepe",
    detalles: []
  },
  {
    id_pedido: 2,
    id_user: 2,
    id_centro: 4,
    fecha_creacion: "2026-04-23 00:00:00",
    estado: "CANCELADO",
    operario: "Oscar Mangut",
    detalles: [
      { id_detalle: 7, id_pedido: 2, id_producto: 2, cantidad_solicitada: 2, precio_total_linea: 49.9, producto: { nombre: "Lejía Concentrada", precio_unidad: 24.95 } }
    ]
  },
  {
    id_pedido: 1,
    id_user: 2,
    id_centro: 4,
    fecha_creacion: "2026-02-20 00:00:00",
    estado: "CANCELADO",
    operario: "Oscar Mangut",
    detalles: [
      { id_detalle: 8, id_pedido: 1, id_producto: 1, cantidad_solicitada: 10, precio_total_linea: 12.9, producto: { nombre: "Detergente Industrial", precio_unidad: 1.29 } },
      { id_detalle: 9, id_pedido: 1, id_producto: 4, cantidad_solicitada: 5, precio_total_linea: 42.25, producto: { nombre: "Limpia Cristales Concentrado", precio_unidad: 8.45 } }
    ]
  }
];

export default function OrdersView({ baseUrl, userRole, userId, idCentro, currentUser }: OrdersViewProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const isTabletOrDesktop = width >= 768;
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Multi-center states
  const [centerSelectionModalVisible, setCenterSelectionModalVisible] = useState(false);
  const [nextCenterModalVisible, setNextCenterModalVisible] = useState(false);
  const [justSavedCenterName, setJustSavedCenterName] = useState('');
  const [pendingCentersForNext, setPendingCentersForNext] = useState<Center[]>([]);

  // Form states (Create/Edit order)
  const [formUserId, setFormUserId] = useState('');
  const [formCenterId, setFormCenterId] = useState('');
  const [formObservaciones, setFormObservaciones] = useState('');
  const [formItems, setFormItems] = useState<{ id_producto: number; cantidad: number }[]>([]);

  // Checkbox & Bulk Actions states
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState('ENTREGADO');
  const [orderStatuses, setOrderStatuses] = useState<{[key: number]: string}>({});
  const [simulateActivePeriod, setSimulateActivePeriod] = useState(false);

  const isPeriodActive = () => {
    if (simulateActivePeriod) return true;
    const day = new Date().getDate();
    return day >= 2 && day <= 8;
  };

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

  // Helper to obtain all assigned centers for a user
  const getUserAssignedCenters = (targetUserId?: number): Center[] => {
    const uid = targetUserId || (userRole === 'usuario' ? userId : parseInt(formUserId, 10));
    const targetUser = users.find((u) => u.id_user === uid) || (uid === userId ? currentUser : null);

    const list: Center[] = [];
    if (targetUser) {
      const rawList = targetUser.assigned_centros || targetUser.centros || [];
      rawList.forEach((c: any) => {
        if (c && c.id_centro && !list.some((existing) => existing.id_centro === c.id_centro)) {
          list.push(c);
        }
      });
      if (targetUser.centro && !list.some((existing) => existing.id_centro === targetUser.centro.id_centro)) {
        list.push(targetUser.centro);
      }
      if (list.length === 0 && targetUser.id_centro) {
        const match = centers.find((c) => c.id_centro === targetUser.id_centro);
        if (match) list.push(match);
      }
    } else if (uid === userId && idCentro) {
      const match = centers.find((c) => c.id_centro === idCentro);
      if (match) list.push(match);
    }

    if (list.length === 0 && (userRole === 'super_admin' || userRole === 'admin')) {
      return centers;
    }
    return list;
  };

  // Check if an order already exists for a specific center
  const getOrderForCenter = (centerId: number, targetUserId?: number): Order | undefined => {
    const uid = targetUserId || (userRole === 'usuario' ? userId : parseInt(formUserId, 10));
    return orders.find((o) => o.id_centro === centerId && (!uid || o.id_user === uid));
  };

  // Start order creation for a specific center
  const handleStartCreateForCenter = (centerId: number) => {
    setSelectedOrder(null);
    setFormUserId(userRole === 'usuario' && userId ? userId.toString() : (users[0]?.id_user?.toString() || '1'));
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
      const ordersRes = await fetch(url);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data);
      } else {
        setOrders(mockOrders);
      }

      // Fetch users, centers, products for dropdowns
      const usersRes = await fetch(`${baseUrl}/usuarios`);
      if (usersRes.ok) setUsers(await usersRes.json());

      const centersRes = await fetch(`${baseUrl}/centros_trabajo`);
      if (centersRes.ok) setCenters(await centersRes.json());

      const productsRes = await fetch(`${baseUrl}/productos`);
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
    // Employee with more than 1 center: must pick which center to make the order for!
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
        shadow_cantidad: d.cantidad_solicitada,
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
    if (p.es_toxico) return '#FEE2E2'; // Light red background for toxic
    const name = p.nombre.toLowerCase();
    if (name.includes('cristal') || name.includes('limpia')) return '#ECFEFF'; // Cyan
    if (name.includes('ambient') || name.includes('bosque')) return '#ECFDF5'; // Green
    if (name.includes('lejia') || name.includes('cloro')) return '#FEF3C7'; // Amber
    return '#EFF6FF'; // Blue
  };

  const getProductIconColor = (p: Product) => {
    if (p.es_toxico) return '#EF4444'; // Red
    const name = p.nombre.toLowerCase();
    if (name.includes('cristal') || name.includes('limpia')) return '#0891B2'; // Cyan
    if (name.includes('ambient') || name.includes('bosque')) return '#059669'; // Green
    if (name.includes('lejia') || name.includes('cloro')) return '#D97706'; // Amber
    return '#2563EB'; // Blue
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
        response = await fetch(`${baseUrl}/pedidos/multiple`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${baseUrl}/pedidos/update-details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          // Calculate remaining centers without orders (excluding the one just saved)
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

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    let nextStatus = 'PENDIENTE';
    if (currentStatus === 'PENDIENTE') nextStatus = 'EN_PREPARACION';
    else if (currentStatus === 'EN_PREPARACION') nextStatus = 'ENTREGADO';
    else nextStatus = 'PENDIENTE';

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/pedidos/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pedido: id, estado: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchData();
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

  const handleSaveOrderStatus = async (id: number) => {
    const statusToSave = orderStatuses[id] !== undefined ? orderStatuses[id] : orders.find(o => o.id_pedido === id)?.estado || 'PENDIENTE';

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/pedidos/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${baseUrl}/pedidos/update-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      fetch(`${baseUrl}/pedidos/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    return { bg: '#F1F5F9', text: '#64748B' }; // PENDIENTE
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.operario.toLowerCase().includes(search.toLowerCase()) ||
      o.estado.toLowerCase().includes(search.toLowerCase()) ||
      o.id_pedido.toString().includes(search)
  );

  // Paginated orders
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const colWidths = {
    id: 80,
    operario: isTabletOrDesktop ? 140 : 120,
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

      {userRole === 'usuario' && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#EFF6FF',
            borderColor: '#BFDBFE',
            borderWidth: 1,
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 280 }}>
            <Feather name="info" size={18} color="#2563EB" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, color: '#1E3A8A', lineHeight: 20 }}>
              Nota: Puedes modificar tus pedidos del día 2 al 8 de cada mes. Estado actual:{' '}
              <Text style={{ fontWeight: 'bold', color: '#1D4ED8' }}>
                {isPeriodActive() ? 'HABILITADO' : 'DESHABILITADO'}
              </Text>
              .
            </Text>
          </View>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            activeOpacity={0.8}
            onPress={() => setSimulateActivePeriod(!simulateActivePeriod)}
          >
            <View style={[styles.checkbox, simulateActivePeriod && styles.checkboxChecked, { borderColor: '#2563EB', width: 16, height: 16 }]}>
              {simulateActivePeriod && <View style={[styles.checkboxInner, { backgroundColor: '#FFFFFF', width: 8, height: 8 }]} />}
            </View>
            <Text style={{ fontSize: 13, color: '#1E3A8A', fontWeight: '500' }}>
              Simular periodo activo (para pruebas)
            </Text>
          </TouchableOpacity>
        </View>
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
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.scrollContainer} horizontal={true}>
            <View style={[styles.tableContainer, { minWidth: tableMinWidth }]}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                {isDesktop && userRole === 'repartidor' && (
                  <View style={{ width: 40, justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        { borderColor: '#FFFFFF', borderWidth: 1.5 },
                        paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id_pedido)) && styles.checkboxChecked
                      ]}
                      onPress={() => toggleSelectAll(paginatedOrders)}
                    >
                      {paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id_pedido)) && (
                        <View style={[styles.checkboxInner, { backgroundColor: '#FFFFFF' }]} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={[styles.thText, { width: colWidths.id }]}>ID Pedido</Text>
                {userRole !== 'usuario' && <Text style={[styles.thText, { width: colWidths.operario }]}>Operario</Text>}
                <Text style={[styles.thText, { width: colWidths.productos }]}>Productos Pedidos</Text>
                <Text style={[styles.thText, { width: colWidths.fecha }]}>Fecha de pedido</Text>
                {isDesktop && <Text style={[styles.thText, { width: colWidths.centro }]}>Centro Destino</Text>}
                <Text style={[styles.thText, { width: colWidths.estado }]}>Estado</Text>
                {isTabletOrDesktop && <Text style={[styles.thText, { width: colWidths.acciones, textAlign: 'center' }]}>Acciones</Text>}
              </View>

              {/* Table Rows */}
              <ScrollView style={{ flex: 1 }}>
                {paginatedOrders.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <Text style={styles.emptyText}>No se encontraron pedidos.</Text>
                  </View>
                ) : (
                  paginatedOrders.map((order, idx) => {
                    const isSelected = selectedOrderIds.includes(order.id_pedido);
                    const statusColors = getStatusStyle(order.estado);
                    const totalUds = order.detalles.reduce((acc, d) => acc + d.cantidad_solicitada, 0);
                    const detailString = order.detalles
                      .map((d) => `${d.producto?.nombre || 'Producto'} (x${parseFloat(d.cantidad_solicitada.toString()).toFixed(2)})`)
                      .join(', ');

                    return (
                      <View
                        key={order.id_pedido}
                        style={[
                          styles.tableRow,
                          { backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' },
                        ]}
                      >
                        {isDesktop && userRole === 'repartidor' && (
                          <View style={{ width: 40, justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableOpacity
                              style={[styles.checkbox, isSelected && styles.checkboxChecked]}
                              onPress={() => toggleSelectOrder(order.id_pedido)}
                            >
                              {isSelected && <View style={styles.checkboxInner} />}
                            </TouchableOpacity>
                          </View>
                        )}
                        <TouchableOpacity
                          style={{ width: colWidths.id }}
                          onPress={() => handleOpenInfo(order)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.tdText, { fontWeight: '600', color: '#5C8E8D', textDecorationLine: 'underline' }]}>
                            #{order.id_pedido}
                          </Text>
                        </TouchableOpacity>
                        {userRole !== 'usuario' && (
                          <Text style={[styles.tdText, { width: colWidths.operario, fontWeight: '500' }]}>
                            {order.operario}
                          </Text>
                        )}
                        <View style={{ width: colWidths.productos, paddingRight: 10 }}>
                          <Text style={[styles.totalUdsText, { color: '#5C8E8D', fontWeight: 'bold' }]}>{totalUds} uds.</Text>
                          <Text style={styles.detailsText} numberOfLines={2}>
                            {detailString || 'Sin productos'}
                          </Text>
                        </View>
                        <Text style={[styles.tdText, { width: colWidths.fecha, color: '#475569' }]}>
                          {order.fecha_creacion}
                        </Text>
                        {isDesktop && (
                          <Text style={[styles.tdText, { width: colWidths.centro, fontWeight: '500', color: '#0F172A' }]} numberOfLines={1}>
                            {order.centro?.nombre || 'N/A'}
                          </Text>
                        )}
                        <View style={{ width: colWidths.estado }}>
                          {userRole === 'repartidor' ? (
                            <View style={[styles.selectWrapper, { height: 36, width: colWidths.estado - 10, marginBottom: 0, overflow: 'hidden', borderRadius: 18, borderColor: '#CBD5E1', borderWidth: 1 }]}>
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
                                value={orderStatuses[order.id_pedido] !== undefined ? orderStatuses[order.id_pedido] : order.estado}
                                onChange={(e) => {
                                  setOrderStatuses({
                                    ...orderStatuses,
                                    [order.id_pedido]: e.target.value
                                  });
                                }}
                              >
                                <option value="PENDIENTE">PENDIENTE</option>
                                <option value="EN_PREPARACION">EN_PREPARACION</option>
                                <option value="ENTREGADO">ENTREGADO</option>
                                <option value="CANCELADO">CANCELADO</option>
                              </select>
                            </View>
                          ) : (
                            <View
                              style={[
                                styles.statusTag,
                                { backgroundColor: statusColors.bg },
                              ]}
                            >
                              <Text style={[styles.statusText, { color: statusColors.text }]}>
                                {order.estado}
                              </Text>
                            </View>
                          )}
                        </View>
                        {isTabletOrDesktop && (
                          <View style={[styles.tdActions, { width: colWidths.acciones }]}>
                            {userRole === 'usuario' && (
                              <>
                                <TouchableOpacity
                                  style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}
                                  onPress={() => handleOpenInfo(order)}
                                >
                                  <Feather name="info" size={14} color="#FFFFFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[
                                    styles.actionIcon,
                                    styles.editIcon,
                                    (order.estado !== 'PENDIENTE' || !isPeriodActive()) && { backgroundColor: '#CBD5E1', opacity: 0.5 }
                                  ]}
                                  disabled={order.estado !== 'PENDIENTE' || !isPeriodActive()}
                                  onPress={() => handleOpenEdit(order)}
                                >
                                  <Feather name="edit-2" size={14} color="#FFFFFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[
                                    styles.actionIcon,
                                    styles.deleteIcon,
                                    (order.estado !== 'PENDIENTE' || !isPeriodActive()) && { backgroundColor: '#CBD5E1', opacity: 0.5 }
                                  ]}
                                  disabled={order.estado !== 'PENDIENTE' || !isPeriodActive()}
                                  onPress={() => handleDelete(order.id_pedido)}
                                >
                                  <Feather name="trash-2" size={14} color="#FFFFFF" />
                                </TouchableOpacity>
                              </>
                            )}
                            {userRole === 'repartidor' && (
                              <>
                                <TouchableOpacity
                                  style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}
                                  onPress={() => handleOpenInfo(order)}
                                >
                                  <Feather name="info" size={14} color="#FFFFFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.actionIcon, { backgroundColor: '#10B981' }]}
                                  onPress={() => handleSaveOrderStatus(order.id_pedido)}
                                >
                                  <Feather name="save" size={14} color="#FFFFFF" />
                                </TouchableOpacity>
                              </>
                            )}
                            {(userRole === 'super_admin' || userRole === 'admin') && (
                              <>
                                <TouchableOpacity
                                  style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}
                                  onPress={() => handleOpenInfo(order)}
                                >
                                  <Feather name="info" size={14} color="#FFFFFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.actionIcon, styles.editIcon]}
                                  onPress={() => handleOpenEdit(order)}
                                >
                                  <Feather name="edit-2" size={14} color="#FFFFFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.actionIcon, styles.deleteIcon]}
                                  onPress={() => handleDelete(order.id_pedido)}
                                >
                                  <Feather name="trash-2" size={14} color="#FFFFFF" />
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        )}
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
              <Text style={styles.paginationCount}>({filteredOrders.length} registros)</Text>
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

      {/* Modal Details / Edit / Create */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, modalType !== 'info' && { maxWidth: 850, width: '95%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'info' && 'Detalles del Pedido'}
                {modalType === 'create' && 'Registrar Pedido'}
                {modalType === 'edit' && 'Editar Pedido'}
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

            {modalType === 'info' && selectedOrder ? (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID Pedido:</Text>
                  <Text style={styles.detailVal}>#{selectedOrder.id_pedido}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Operario:</Text>
                  <Text style={styles.detailVal}>{selectedOrder.operario}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Centro:</Text>
                  <Text style={styles.detailVal}>{selectedOrder.centro?.nombre || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ruta:</Text>
                  <Text style={styles.detailVal}>{selectedOrder.numero_ruta || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Estado:</Text>
                  <Text style={[styles.detailVal, { fontWeight: 'bold' }]}>
                    {selectedOrder.estado}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fecha:</Text>
                  <Text style={styles.detailVal}>{selectedOrder.fecha_creacion}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Observaciones:</Text>
                  <Text style={styles.detailVal}>{selectedOrder.observaciones || 'Ninguna'}</Text>
                </View>
                
                <Text style={[styles.label, { marginTop: 16 }]}>Productos en el Pedido:</Text>
                <View style={styles.modalProductsList}>
                  {selectedOrder.detalles.map((d, index) => (
                    <View key={index} style={styles.modalProductItem}>
                      <Text style={styles.modalProdName}>{d.producto?.nombre}</Text>
                      <Text style={styles.modalProdQty}>x{d.cantidad_solicitada} uds.</Text>
                    </View>
                  ))}
                  {selectedOrder.detalles.length === 0 && (
                    <Text style={styles.emptyText}>Sin productos asociados.</Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <View style={styles.centerBannerActive}>
                  <View style={styles.centerBannerLeft}>
                    <Feather name="map-pin" size={18} color="#0F766E" />
                    <View>
                      <Text style={styles.centerBannerLabel}>Pedido para el centro:</Text>
                      <Text style={styles.centerBannerTitle}>
                        {centers.find((c) => c.id_centro.toString() === formCenterId)?.nombre || 'Centro no seleccionado'}
                      </Text>
                    </View>
                  </View>
                  {userRole === 'usuario' && getUserAssignedCenters(userId).length > 1 && modalType === 'create' && (
                    <TouchableOpacity
                      style={styles.centerChangeBtn}
                      onPress={() => {
                        setModalVisible(false);
                        setCenterSelectionModalVisible(true);
                      }}
                    >
                      <Text style={styles.centerChangeBtnText}>Cambiar centro</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.formContainerSplit}>
                {/* Left Side: Product Catalog */}
                <View style={styles.catalogColumn}>
                  <Text style={styles.modalSectionTitle}>Catálogo de Productos</Text>
                  <Text style={styles.modalSectionSub}>Haz clic en la imagen de un producto para añadirlo o sumar cantidad</Text>
                  <ScrollView style={styles.catalogScroll}>
                    <View style={styles.catalogGrid}>
                      {products.map((p) => {
                        const existingItem = formItems.find(item => item.id_producto === p.id_producto);
                        const addedQty = existingItem ? existingItem.cantidad : 0;
                        return (
                          <TouchableOpacity
                            key={p.id_producto}
                            style={styles.productCard}
                            onPress={() => handleProductCardClick(p.id_producto)}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.productImagePlaceholder, { backgroundColor: getProductColor(p) }]}>
                              <Feather name={getProductIcon(p)} size={28} color={getProductIconColor(p)} />
                              {addedQty > 0 && (
                                <View style={styles.addedBadge}>
                                  <Text style={styles.addedBadgeText}>+{addedQty}</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.productCardInfo}>
                              <Text style={styles.productCardName} numberOfLines={2}>{p.nombre}</Text>
                              {Boolean(p.es_toxico) && (
                                <Text style={styles.toxicLabel}>⚠️ Tóxico</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                {/* Right Side: Order Summary / Checkout */}
                <View style={styles.cartColumn}>
                  <Text style={styles.modalSectionTitle}>Detalles del Pedido</Text>
                  <ScrollView style={styles.cartScroll}>
                    {modalType === 'create' && userRole !== 'usuario' && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={styles.label}>Seleccionar Operario *</Text>
                        <View style={styles.selectWrapper}>
                          <select
                            style={styles.htmlSelect}
                            value={formUserId}
                            onChange={(e) => {
                              const nextUid = e.target.value;
                              setFormUserId(nextUid);
                              const assigned = getUserAssignedCenters(parseInt(nextUid, 10));
                              if (assigned.length > 0) {
                                setFormCenterId(assigned[0].id_centro.toString());
                              }
                            }}
                          >
                            {users.map((u) => (
                              <option key={u.id_user} value={u.id_user}>
                                {u.nombre} ({u.rol})
                              </option>
                            ))}
                          </select>
                        </View>
                      </View>
                    )}

                    <Text style={styles.label}>Centro de Trabajo *</Text>
                    <View style={styles.selectWrapper}>
                      <select
                        style={styles.htmlSelect}
                        value={formCenterId}
                        onChange={(e) => setFormCenterId(e.target.value)}
                      >
                        {(userRole === 'usuario'
                          ? getUserAssignedCenters(userId)
                          : (getUserAssignedCenters(parseInt(formUserId, 10)).length > 0
                              ? getUserAssignedCenters(parseInt(formUserId, 10))
                              : centers)
                        ).map((c) => (
                          <option key={c.id_centro} value={c.id_centro}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </View>

                    <Text style={styles.label}>Productos Seleccionados</Text>
                    <View style={styles.cartList}>
                      {formItems.map((item) => {
                        const p = products.find((prod) => prod.id_producto === item.id_producto);
                        if (!p) return null;
                        return (
                          <View key={item.id_producto} style={styles.cartItemRow}>
                            <View style={styles.cartItemDetails}>
                              <Text style={styles.cartItemName} numberOfLines={1}>{p.nombre}</Text>
                            </View>
                            <View style={styles.cartQtyControls}>
                              <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => handleAdjustQuantity(item.id_producto, -1)}
                              >
                                <Feather name="minus" size={12} color="#475569" />
                              </TouchableOpacity>
                              <Text style={styles.qtyText}>{item.cantidad}</Text>
                              <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => handleAdjustQuantity(item.id_producto, 1)}
                              >
                                <Feather name="plus" size={12} color="#475569" />
                              </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                              style={styles.cartRemoveBtn}
                              onPress={() => handleRemoveProduct(item.id_producto)}
                            >
                              <Feather name="trash-2" size={14} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                      {formItems.length === 0 && (
                        <Text style={styles.emptyCartText}>Haz clic en los productos para agregarlos.</Text>
                      )}
                    </View>

                    <Text style={[styles.label, { marginTop: 12 }]}>Observaciones</Text>
                    <TextInput
                      style={[styles.modalInput, { height: 50, marginBottom: 12 }]}
                      multiline={true}
                      value={formObservaciones}
                      onChangeText={setFormObservaciones}
                      placeholder="Detalles de entrega, zona especial, etc."
                    />
                  </ScrollView>
                </View>
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

      {/* Modal Selección de Centro para Empleados con varios centros */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={centerSelectionModalVisible}
        onRequestClose={() => setCenterSelectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 580 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' }}>
                  <Feather name="map-pin" size={18} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>¿Para qué centro es el pedido?</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Debes realizar un pedido individual para cada uno de tus centros asignados.
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setCenterSelectionModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20, maxHeight: 420 }}>
              {getUserAssignedCenters(userId).map((c) => {
                const existingOrder = getOrderForCenter(c.id_centro, userId);
                const isSelected = formCenterId === c.id_centro.toString();

                return (
                  <TouchableOpacity
                    key={c.id_centro}
                    activeOpacity={0.8}
                    style={[
                      styles.centerSelectionCard,
                      isSelected && styles.centerSelectionCardActive,
                      existingOrder ? styles.centerSelectionCardCompleted : styles.centerSelectionCardPending,
                    ]}
                    onPress={() => handleStartCreateForCenter(c.id_centro)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Feather name="briefcase" size={16} color={existingOrder ? '#10B981' : '#F59E0B'} />
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                            {c.nombre}
                          </Text>
                        </View>
                        {c.direccion && (
                          <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                            📍 {c.direccion} {c.ciudad ? `(${c.ciudad})` : ''}
                          </Text>
                        )}
                        {existingOrder ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#DCFCE7' }}>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: '#15803D' }}>
                                ✓ Pedido #{existingOrder.id_pedido} registrado ({existingOrder.estado})
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#FEF3C7', alignSelf: 'flex-start', marginTop: 4 }}>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#B45309' }}>
                              ⚠️ Pendiente de realizar pedido
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={{ justifyContent: 'center' }}>
                        <View style={[styles.actionBtn, { height: 34, paddingHorizontal: 12, backgroundColor: existingOrder ? '#E2E8F0' : '#5C8E8D' }]}>
                          <Text style={[styles.btnText, { fontSize: 12, color: existingOrder ? '#475569' : '#FFFFFF' }]}>
                            {existingOrder ? 'Ver / Modificar' : 'Hacer Pedido'}
                          </Text>
                          <Feather name="arrow-right" size={14} color={existingOrder ? '#475569' : '#FFFFFF'} />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={[styles.modalFooter, { justifyContent: 'flex-end', backgroundColor: '#F8FAFC' }]}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => setCenterSelectionModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Siguiente Centro ("y luego hará los siguientes") */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={nextCenterModalVisible}
        onRequestClose={() => setNextCenterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 520 }]}>
            <View style={[styles.modalHeader, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <TouchableOpacity onPress={() => setNextCenterModalVisible(false)} style={{ marginLeft: 'auto' }}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
                <Feather name="check" size={32} color="#16A34A" />
              </View>

              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
                ¡Pedido de {justSavedCenterName} guardado!
              </Text>

              <Text style={{ fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                Recuerda que debes realizar <Text style={{ fontWeight: '700', color: '#0F172A' }}>un pedido por cada centro</Text> de trabajo asignado.
              </Text>

              <View style={[styles.nextCenterModalCard, { width: '100%' }]}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                  Centros restantes pendientes ({pendingCentersForNext.length}):
                </Text>
                {pendingCentersForNext.map((c) => (
                  <View key={c.id_centro} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#E2E8F0' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Feather name="map-pin" size={14} color="#F97316" />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E293B' }} numberOfLines={1}>
                        {c.nombre}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FDBA74' }}
                      onPress={() => handleStartCreateForCenter(c.id_centro)}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#C2410C' }}>Pedir ahora ➔</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {pendingCentersForNext.length > 0 && (
                <TouchableOpacity
                  style={[styles.nextCenterPrimaryBtn, { width: '100%' }]}
                  onPress={() => handleStartCreateForCenter(pendingCentersForNext[0].id_centro)}
                >
                  <Text style={styles.nextCenterPrimaryBtnText}>
                    Hacer Pedido para {pendingCentersForNext[0].nombre}
                  </Text>
                  <Feather name="arrow-right" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.nextCenterSecondaryBtn}
                onPress={() => setNextCenterModalVisible(false)}
              >
                <Text style={styles.nextCenterSecondaryBtnText}>Dejar para más tarde y ver pedidos</Text>
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


