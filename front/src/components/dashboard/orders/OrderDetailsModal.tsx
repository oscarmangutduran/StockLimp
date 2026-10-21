import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../../css/OrdersView.styles';
import { Order } from './types';

interface OrderDetailsModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  visible,
  order,
  onClose,
}) => {
  if (!visible || !order) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles del Pedido</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID Pedido:</Text>
              <Text style={styles.detailVal}>#{order.id_pedido}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Operario:</Text>
              <Text style={styles.detailVal}>{order.operario}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Centro:</Text>
              <Text style={styles.detailVal}>{order.centro?.nombre || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ruta:</Text>
              <Text style={styles.detailVal}>{order.numero_ruta || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estado:</Text>
              <Text style={[styles.detailVal, { fontWeight: 'bold' }]}>
                {order.estado}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fecha:</Text>
              <Text style={styles.detailVal}>{order.fecha_creacion}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Observaciones:</Text>
              <Text style={styles.detailVal}>{order.observaciones || 'Ninguna'}</Text>
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Productos en el Pedido:</Text>
            <View style={styles.modalProductsList}>
              {order.detalles && order.detalles.length > 0 ? (
                order.detalles.map((d, index) => (
                  <View key={index} style={styles.modalProductItem}>
                    <Text style={styles.modalProdName}>{d.producto?.nombre || `Producto #${d.id_producto}`}</Text>
                    <Text style={styles.modalProdQty}>x{d.cantidad_solicitada} uds.</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Sin productos asociados.</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
