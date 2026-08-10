import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ModalAlertProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export default function ModalAlert({
  visible,
  title = 'Aviso',
  message,
  onClose,
  onConfirm,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  showCancel = false,
}: ModalAlertProps) {
  return (
    <Modal animationType="fade" transparent={true} visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {showCancel && (
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]} 
              onPress={() => {
                if (onConfirm) onConfirm();
                else onClose();
              }}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 350,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
