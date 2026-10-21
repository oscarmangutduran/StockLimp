import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../../css/OrdersView.styles';

interface CustomAlertModalProps {
  visible: boolean;
  type: 'info' | 'confirm';
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  onConfirm,
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
        <View style={[styles.modalContent, { maxWidth: 400 }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 0, paddingBottom: 10 }]}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.modalBody, { paddingTop: 10, alignItems: 'center', gap: 16 }]}>
            {type === 'confirm' ? (
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="alert-triangle" size={28} color="#EF4444" />
              </View>
            ) : (
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="info" size={28} color="#0284C7" />
              </View>
            )}
            <Text style={{ fontSize: 15, color: '#334155', textAlign: 'center', lineHeight: 22 }}>
              {message}
            </Text>
          </View>

          <View style={[styles.modalFooter, { borderTopWidth: 0, backgroundColor: '#FFFFFF', padding: 20, gap: 12 }]}>
            {type === 'confirm' ? (
              <>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelModalBtn, { flex: 1 }]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { flex: 1, backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    onClose();
                    if (onConfirm) onConfirm();
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14, textAlign: 'center' }}>Eliminar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveModalBtn, { width: '100%', backgroundColor: '#5C8E8D' }]}
                onPress={onClose}
              >
                <Text style={styles.saveBtnText}>Aceptar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
