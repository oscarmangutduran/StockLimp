import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../../css/OrdersView.styles';
import { Order } from './types';

interface OrdersTableProps {
  paginatedOrders: Order[];
  filteredOrdersCount: number;
  selectedOrderIds: number[];
  tableMinWidth: number;
  colWidths: {
    id: number;
    operario: number;
    productos: number;
    fecha: number;
    centro: number;
    estado: number;
    acciones: number;
  };
  isDesktop: boolean;
  isTabletOrDesktop: boolean;
  userRole?: string;
  orderStatuses: { [id_pedido: number]: string };
  setOrderStatuses: React.Dispatch<React.SetStateAction<{ [id_pedido: number]: string }>>;
  itemsPerPage: number;
  setItemsPerPage: (num: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  isPeriodActive: () => boolean;
  toggleSelectOrder: (id: number) => void;
  toggleSelectAll: (orders: Order[]) => void;
  getStatusStyle: (status: string) => { bg: string; text: string };
  handleOpenInfo: (order: Order) => void;
  handleOpenEdit: (order: Order) => void;
  handleDelete: (id: number) => void;
  handleSaveOrderStatus: (id: number) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  paginatedOrders,
  filteredOrdersCount,
  selectedOrderIds,
  tableMinWidth,
  colWidths,
  isDesktop,
  isTabletOrDesktop,
  userRole,
  orderStatuses,
  setOrderStatuses,
  itemsPerPage,
  setItemsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
  isPeriodActive,
  toggleSelectOrder,
  toggleSelectAll,
  getStatusStyle,
  handleOpenInfo,
  handleOpenEdit,
  handleDelete,
  handleSaveOrderStatus,
}) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 1240;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scrollContainer} horizontal={true} contentContainerStyle={{ flexGrow: 1, minWidth: '100%' }}>
        <View style={[styles.tableContainer, { minWidth: tableMinWidth, width: '100%' }]}>
          {/* Table Header */}
          <View style={[styles.tableHeader, isCompact && { paddingHorizontal: 10, paddingVertical: 10 }]}>
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
            <Text style={[styles.thText, { flex: 0.65, minWidth: 0 }, isCompact && { fontSize: 11 }]}>ID Pedido</Text>
            {userRole !== 'usuario' && <Text style={[styles.thText, { flex: 0.9, minWidth: 0 }, isCompact && { fontSize: 11 }]}>Operario</Text>}
            <Text style={[styles.thText, { flex: 1.6, minWidth: 0 }, isCompact && { fontSize: 11 }]}>Productos Pedidos</Text>
            <Text style={[styles.thText, { flex: 0.9, minWidth: 0 }, isCompact && { fontSize: 11 }]}>Fecha de pedido</Text>
            {isDesktop && <Text style={[styles.thText, { flex: 1.1, minWidth: 0 }, isCompact && { fontSize: 11 }]}>Centro Destino</Text>}
            <Text style={[styles.thText, { flex: 1, minWidth: 0 }, isCompact && { fontSize: 11 }]}>Estado</Text>
            {isTabletOrDesktop && <Text style={[styles.thText, { flex: 0.95, minWidth: 0, textAlign: 'center' }, isCompact && { fontSize: 11 }]}>Acciones</Text>}
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
                      style={{ flex: 0.65, minWidth: 0 }}
                      onPress={() => handleOpenInfo(order)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tdText, { fontWeight: '600', color: '#5C8E8D', textDecorationLine: 'underline' }, isCompact && { fontSize: 12 }]}>
                        #{order.id_pedido}
                      </Text>
                    </TouchableOpacity>
                    {userRole !== 'usuario' && (
                      <Text style={[styles.tdText, { flex: 0.9, minWidth: 0, fontWeight: '500', paddingRight: 6 }, isCompact && { fontSize: 12 }]} numberOfLines={2}>
                        {order.operario}
                      </Text>
                    )}
                    <View style={{ flex: 1.6, minWidth: 0, paddingRight: 8 }}>
                      <Text style={[styles.totalUdsText, { color: '#5C8E8D', fontWeight: 'bold' }, isCompact && { fontSize: 12 }]}>{totalUds} uds.</Text>
                      <Text style={[styles.detailsText, isCompact && { fontSize: 11 }]} numberOfLines={2}>
                        {detailString || 'Sin productos'}
                      </Text>
                    </View>
                    <Text style={[styles.tdText, { flex: 0.9, minWidth: 0, color: '#475569' }, isCompact && { fontSize: 11 }]}>
                      {order.fecha_creacion}
                    </Text>
                    {isDesktop && (
                      <Text style={[styles.tdText, { flex: 1.1, minWidth: 0, fontWeight: '500', color: '#0F172A', paddingRight: 6 }, isCompact && { fontSize: 12 }]} numberOfLines={2}>
                        {order.centro?.nombre || 'N/A'}
                      </Text>
                    )}
                    <View style={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
                      {userRole === 'repartidor' ? (() => {
                        const currentVal = orderStatuses[order.id_pedido] !== undefined ? orderStatuses[order.id_pedido] : order.estado;
                        const activeColors = getStatusStyle(currentVal);
                        return (
                          <View
                            style={{
                              position: 'relative',
                              height: 32,
                              width: '100%',
                              maxWidth: 165,
                              borderRadius: 16,
                              backgroundColor: activeColors.bg,
                              borderWidth: 1,
                              borderColor: `${activeColors.text}33`,
                              justifyContent: 'center',
                              overflow: 'hidden',
                            }}
                          >
                            <select
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: activeColors.text,
                                fontSize: isCompact ? 11 : 12,
                                fontWeight: '700',
                                padding: '0 26px 0 12px',
                                outline: 'none',
                                cursor: 'pointer',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                textOverflow: 'ellipsis',
                              } as any}
                              value={currentVal}
                              onChange={(e) => {
                                setOrderStatuses({
                                  ...orderStatuses,
                                  [order.id_pedido]: e.target.value
                                });
                              }}
                            >
                              <option value="PENDIENTE" style={{ color: '#1E293B', backgroundColor: '#FFFFFF' }}>PENDIENTE</option>
                              <option value="EN_PREPARACION" style={{ color: '#1E293B', backgroundColor: '#FFFFFF' }}>EN PREPARACIÓN</option>
                              <option value="ENTREGADO" style={{ color: '#1E293B', backgroundColor: '#FFFFFF' }}>ENTREGADO</option>
                              <option value="CANCELADO" style={{ color: '#1E293B', backgroundColor: '#FFFFFF' }}>CANCELADO</option>
                            </select>
                            <View
                              pointerEvents="none"
                              style={{
                                position: 'absolute',
                                right: 9,
                                top: 0,
                                bottom: 0,
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <Feather name="chevron-down" size={14} color={activeColors.text} />
                            </View>
                          </View>
                        );
                      })() : (
                        <View
                          style={[
                            styles.statusTag,
                            { backgroundColor: statusColors.bg },
                          ]}
                        >
                          <Text style={[styles.statusText, { color: statusColors.text }]}>
                            {order.estado === 'EN_PREPARACION' ? 'EN PREPARACIÓN' : order.estado}
                          </Text>
                        </View>
                      )}
                    </View>
                    {isTabletOrDesktop && (
                      <View style={[styles.tdActions, { flex: 0.95, minWidth: 0 }, isCompact && { gap: 4 }]}>
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
          <Text style={styles.paginationCount}>({filteredOrdersCount} registros)</Text>
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
  );
};
