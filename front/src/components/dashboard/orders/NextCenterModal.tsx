import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../../css/OrdersView.styles';
import { Center } from './types';

interface NextCenterModalProps {
  visible: boolean;
  onClose: () => void;
  justSavedCenterName: string;
  pendingCentersForNext: Center[];
  onStartCreateForCenter: (centerId: number) => void;
}

export const NextCenterModal: React.FC<NextCenterModalProps> = ({
  visible,
  onClose,
  justSavedCenterName,
  pendingCentersForNext,
  onStartCreateForCenter,
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
        <View style={[styles.modalContent, { maxWidth: 520 }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <TouchableOpacity onPress={onClose} style={{ marginLeft: 'auto' }}>
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
                    onPress={() => onStartCreateForCenter(c.id_centro)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#C2410C' }}>Pedir ahora ➔</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {pendingCentersForNext.length > 0 && (
              <TouchableOpacity
                style={[styles.nextCenterPrimaryBtn, { width: '100%' }]}
                onPress={() => onStartCreateForCenter(pendingCentersForNext[0].id_centro)}
              >
                <Text style={styles.nextCenterPrimaryBtnText}>
                  Hacer Pedido para {pendingCentersForNext[0].nombre}
                </Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.nextCenterSecondaryBtn}
              onPress={onClose}
            >
              <Text style={styles.nextCenterSecondaryBtnText}>Dejar para más tarde y ver pedidos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
