import React from 'react';
import { View, Text, Modal, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../../css/OrdersView.styles';
import { Center, Product, User, FormItem } from './types';
import { STANDARD_PRODUCTS_LIST, STANDARD_PRODUCT_IMAGES } from './standardProductsList';

export const STANDARD_ORDER_NAMES = [
  'LEJIA',
  'AMONIACO',
  'FREGASUELOS',
  'LEJIA DETERGENTE',
  'AMBIENTADOR',
  'BAYETAS',
  'FREGONA',
  'FMICROFIS',
  'SACOS',
  'BOLSAS',
  'CEPILLOS',
  'PALOS',
  'RECOGEDOR',
  'FLOTA',
  'ARRIXACA',
  'PAPEL WC',
  'CRISTASOL',
  'CENTELLA',
  'SUPERBRILLO',
  'LIQUIDO MADERA',
  'GAMUZA',
  'PLUMERO',
  'SUPER FLAX',
  'CUBO',
  'ESTROPAJO',
  'SPRAY MOPA',
];

interface OrderFormModalProps {
  visible: boolean;
  modalType: 'create' | 'edit';
  onClose: () => void;
  onSave: () => void;
  successMessage: boolean;
  formCenterId: string;
  setFormCenterId: (id: string) => void;
  formUserId: string;
  setFormUserId: (id: string) => void;
  formObservaciones: string;
  setFormObservaciones: (obs: string) => void;
  formItems: FormItem[];
  centers: Center[];
  products: Product[];
  users: User[];
  userRole?: string;
  userId?: number;
  getUserAssignedCenters: (userId?: number) => Center[];
  onOpenCenterSelection: () => void;
  onProductCardClick: (id_producto: number) => void;
  onAdjustQuantity: (id_producto: number, delta: number) => void;
  onRemoveProduct: (id_producto: number) => void;
  getProductColor: (p: Product) => string;
  getProductIcon: (p: Product) => any;
  getProductIconColor: (p: Product) => string;
  baseUrl?: string;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  visible,
  modalType,
  onClose,
  onSave,
  successMessage,
  formCenterId,
  setFormCenterId,
  formUserId,
  setFormUserId,
  formObservaciones,
  setFormObservaciones,
  formItems,
  centers,
  products,
  users,
  userRole,
  userId,
  getUserAssignedCenters,
  onOpenCenterSelection,
  onProductCardClick,
  onAdjustQuantity,
  onRemoveProduct,
  getProductColor,
  getProductIcon,
  getProductIconColor,
  baseUrl = 'http://localhost:8000/api',
}) => {
  if (!visible) return null;

  const currentCenterName = centers.find((c) => c.id_centro.toString() === formCenterId)?.nombre || 'Centro no seleccionado';
  const assignedCenters = userRole === 'usuario'
    ? getUserAssignedCenters(userId)
    : (getUserAssignedCenters(parseInt(formUserId, 10)).length > 0
        ? getUserAssignedCenters(parseInt(formUserId, 10))
        : centers);

  const normalizeStandardName = (name: string) => {
    const upper = name.toUpperCase().trim();
    if (upper === 'FREGONAS') return 'FREGONA';
    if (upper === 'F. MICROFIBRA' || upper === 'F MICROFIBRA') return 'FMICROFIS';
    if (upper === 'LQ MADERA' || upper === 'LIQUIDO, MADERA') return 'LIQUIDO MADERA';
    return upper;
  };

  // Filtrar estrictamente para que en la cuadrícula de pedidos SOLO aparezcan los 26 productos estándar de la planilla
  const filtered = STANDARD_ORDER_NAMES.map((stdName) => {
    const found = products.find((p) => normalizeStandardName(p.nombre) === stdName);
    return found ? { ...found, nombre: stdName } : null;
  }).filter((p): p is Product => p !== null);

  const standardProducts = filtered.length === STANDARD_ORDER_NAMES.length ? filtered : STANDARD_PRODUCTS_LIST;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxWidth: 900, width: '95%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modalType === 'create' ? 'Registrar Pedido' : 'Editar Pedido'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {successMessage && (
            <View style={{ backgroundColor: '#DEF7EC', padding: 12, borderRadius: 8, marginHorizontal: 20, marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="check-circle" size={16} color="#03543F" />
              <Text style={{ color: '#03543F', fontSize: 14, fontWeight: '500' }}>Se han guardado los datos correctamente.</Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <View style={styles.centerBannerActive}>
              <View style={styles.centerBannerLeft}>
                <Feather name="map-pin" size={18} color="#0F766E" />
                <View>
                  <Text style={styles.centerBannerLabel}>Pedido para el centro:</Text>
                  <Text style={styles.centerBannerTitle}>{currentCenterName}</Text>
                </View>
              </View>
              {userRole === 'usuario' && getUserAssignedCenters(userId).length > 1 && modalType === 'create' && (
                <TouchableOpacity
                  style={styles.centerChangeBtn}
                  onPress={onOpenCenterSelection}
                >
                  <Text style={styles.centerChangeBtnText}>Cambiar centro</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formContainerSplit}>
              {/* Left Side: Product Catalog (26 Standard Products Only) */}
              <View style={styles.catalogColumn}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.modalSectionTitle}>Catálogo de Pedidos</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#1D4ED8' }}>26 Productos Estándar</Text>
                  </View>
                </View>
                <Text style={styles.modalSectionSub}>Haz clic sobre el producto para añadirlo o incrementar cantidad.</Text>
                
                <ScrollView style={styles.catalogScroll}>
                  <View style={styles.catalogGrid}>
                    {standardProducts.map((p) => {
                      const existingItem = formItems.find(item => item.id_producto === p.id_producto);
                      const addedQty = existingItem ? existingItem.cantidad : 0;
                      const upperName = p.nombre.toUpperCase().trim();
                      const mappedImage =
                        (p.imagen && p.imagen.includes('uploads/productos/') ? p.imagen : undefined) ||
                        STANDARD_PRODUCT_IMAGES[upperName];
                      const serverRoot = baseUrl.replace(/\/api\/?$/, '');
                      const imageUri = mappedImage
                        ? mappedImage.startsWith('http')
                          ? mappedImage
                          : `${serverRoot}/${encodeURI(mappedImage)}`
                        : null;

                      return (
                        <TouchableOpacity
                          key={p.id_producto}
                          style={styles.productCard}
                          onPress={() => onProductCardClick(p.id_producto)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.productImagePlaceholder,
                              { backgroundColor: imageUri ? '#FFFFFF' : getProductColor(p) },
                            ]}
                          >
                            {imageUri ? (
                              <Image
                                source={{ uri: imageUri }}
                                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                              />
                            ) : (
                              <Feather name={getProductIcon(p)} size={26} color={getProductIconColor(p)} />
                            )}
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
                      {assignedCenters.map((c) => (
                        <option key={c.id_centro} value={c.id_centro}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </View>

                  <Text style={styles.label}>Productos Seleccionados</Text>
                  <View style={styles.cartList}>
                    {formItems.map((item) => {
                      const p =
                        standardProducts.find((prod) => prod.id_producto === item.id_producto) ||
                        products.find((prod) => prod.id_producto === item.id_producto);
                      if (!p) return null;
                      return (
                        <View key={item.id_producto} style={styles.cartItemRow}>
                          <View style={styles.cartItemDetails}>
                            <Text style={styles.cartItemName} numberOfLines={1}>{p.nombre}</Text>
                          </View>
                          <View style={styles.cartQtyControls}>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => onAdjustQuantity(item.id_producto, -1)}
                            >
                              <Feather name="minus" size={12} color="#475569" />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{item.cantidad}</Text>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => onAdjustQuantity(item.id_producto, 1)}
                            >
                              <Feather name="plus" size={12} color="#475569" />
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            style={styles.cartRemoveBtn}
                            onPress={() => onRemoveProduct(item.id_producto)}
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

                  {/* Sección de Peticiones Excepcionales / Observaciones */}
                  <View style={{ marginTop: 14, padding: 12, borderRadius: 8, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Feather name="alert-triangle" size={14} color="#D97706" />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>
                        Peticiones Excepcionales y Observaciones
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#B45309', marginBottom: 8, lineHeight: 15 }}>
                      ¿Necesitas algún producto o insumo fuera de los 26 estándar anteriores? Pídelo aquí indicando nombre, cantidad y motivo.
                    </Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        {
                          height: 64,
                          marginBottom: 0,
                          backgroundColor: '#FFFFFF',
                          borderColor: '#FCD34D',
                          fontSize: 13,
                          padding: 8,
                          textAlignVertical: 'top',
                        },
                      ]}
                      multiline={true}
                      value={formObservaciones}
                      onChangeText={setFormObservaciones}
                      placeholder="Ej: Solicito de forma excepcional 1 garrafa de desengrasante químico especial 5L para limpieza profunda..."
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelModalBtn]}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.saveModalBtn]}
              onPress={onSave}
            >
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
