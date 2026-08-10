import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

interface TimeTrackingViewProps {
  baseUrl: string;
  userId: number;
}

export default function TimeTrackingView({ baseUrl, userId }: TimeTrackingViewProps) {
  const [loading, setLoading] = useState(false);
  const [activo, setActivo] = useState(false);
  const [estado, setEstado] = useState<'trabajando' | 'en_pausa' | null>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [comentarios, setComentarios] = useState('');
  const [documento, setDocumento] = useState<any>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/fichajes/actual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_user: userId }),
      });
      const data = await res.json();
      if (data.success && data.activo) {
        setActivo(true);
        setEstado(data.fichaje.estado);
      } else {
        setActivo(false);
        setEstado(null);
      }
    } catch (e) {
      console.log('Error fetching status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handlePlay = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/fichajes/iniciar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_user: userId }),
      });
      const data = await res.json();
      if (data.success) {
        setActivo(true);
        setEstado('trabajando');
      }
    } catch (e) {
      console.log('Error iniciando', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/fichajes/pausar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_user: userId }),
      });
      const data = await res.json();
      if (data.success) {
        setEstado(data.fichaje.estado);
      }
    } catch (e) {
      console.log('Error pausando', e);
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocumento(result.assets[0]);
      }
    } catch (e) {
      console.log('Error picking document', e);
    }
  };

  const handleStopConfirm = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('id_user', userId.toString());
      formData.append('comentarios', comentarios);
      
      if (documento) {
        if (Platform.OS === 'web') {
          const res = await fetch(documento.uri);
          const blob = await res.blob();
          formData.append('documento', blob, documento.name);
        } else {
          formData.append('documento', {
            uri: documento.uri,
            name: documento.name,
            type: documento.mimeType || 'application/octet-stream',
          } as any);
        }
      }

      const res = await fetch(`${baseUrl}/fichajes/finalizar`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (data.success) {
        setActivo(false);
        setEstado(null);
        setModalVisible(false);
        setComentarios('');
        setDocumento(null);
      }
    } catch (e) {
      console.log('Error finalizando', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.viewTitle}>CONTROL HORARIO</Text>
      <View style={styles.card}>
        <View style={styles.clockContainer}>
          <Text style={styles.clockText}>{formatTime()}</Text>
          <Text style={styles.statusText}>
            {estado === 'trabajando' ? 'Trabajando' : estado === 'en_pausa' ? 'En pausa' : 'Fuera de turno'}
          </Text>
        </View>

        <View style={styles.controlsRow}>
          {!activo ? (
            <TouchableOpacity style={[styles.controlBtn, styles.playBtn]} onPress={handlePlay} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Feather name="play" size={32} color="#fff" />}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={[styles.controlBtn, estado === 'en_pausa' ? styles.playBtn : styles.pauseBtn]} onPress={handlePause} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Feather name={estado === 'en_pausa' ? 'play' : 'pause'} size={32} color="#fff" />}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, styles.stopBtn]} onPress={() => setModalVisible(true)} disabled={loading}>
                <Feather name="square" size={32} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Finalizar Turno</Text>
            
            <Text style={styles.label}>Comentarios u observaciones</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={comentarios}
              onChangeText={setComentarios}
              placeholder="Ej: Salí 10 mins antes por urgencia..."
            />

            <Text style={styles.label}>Justificante médico o documento</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
              <Feather name="upload" size={20} color="#64748B" />
              <Text style={styles.uploadBtnText}>
                {documento ? documento.name : 'Seleccionar archivo...'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleStopConfirm}>
                <Text style={styles.saveBtnText}>Finalizar Turno</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  viewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  clockContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  clockText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statusText: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  controlBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  playBtn: {
    backgroundColor: '#10B981',
  },
  pauseBtn: {
    backgroundColor: '#F59E0B',
  },
  stopBtn: {
    backgroundColor: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    marginTop: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 8,
    gap: 12,
  },
  uploadBtnText: {
    color: '#64748B',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#EF4444',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
