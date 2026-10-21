import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
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
  return (
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
