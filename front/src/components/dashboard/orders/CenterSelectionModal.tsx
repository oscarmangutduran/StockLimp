import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../../css/OrdersView.styles';
import { Center, Order } from './types';

interface CenterSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  assignedCenters: Center[];
  formCenterId: string;
  userId?: number;
  getOrderForCenter: (centerId: number, userId?: number) => Order | undefined;
  onSelectCenter: (centerId: number) => void;
}

export const CenterSelectionModal: React.FC<CenterSelectionModalProps> = ({
  visible,
  onClose,
  assignedCenters,
  formCenterId,
  userId,
  getOrderForCenter,
  onSelectCenter,
}) => {
  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
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
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20, maxHeight: 420 }}>
            {assignedCenters.map((c) => {
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
                  onPress={() => onSelectCenter(c.id_centro)}
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
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
