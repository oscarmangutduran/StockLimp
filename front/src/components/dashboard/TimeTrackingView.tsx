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
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import ModalAlert from '@/components/common/ModalAlert';

interface TimeTrackingViewProps {
  baseUrl: string;
  userId: number;
}

export default function TimeTrackingView({ baseUrl, userId }: TimeTrackingViewProps) {
  const [loading, setLoading] = useState(false);
  const [activo, setActivo] = useState(false);
  const [estado, setEstado] = useState<'trabajando' | 'en_pausa' | null>(null);
  const [horaEntrada, setHoraEntrada] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [comentarios, setComentarios] = useState('');
  const [documento, setDocumento] = useState<any>(null);

  // Vacaciones state
  const [vacaciones, setVacaciones] = useState<any[]>([]);
  const [vacationModalVisible, setVacationModalVisible] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [vacationComments, setVacationComments] = useState('');
  const [showPicker, setShowPicker] = useState<'inicio' | 'fin' | null>(null);
  const [diasDisponibles, setDiasDisponibles] = useState<number | null>(null);

  // Custom Alert state
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title?: string; message: string; showCancel?: boolean; onConfirm?: () => void }>({ visible: false, message: '' });
  const showAlert = (message: string, title = 'Aviso') => setAlertConfig({ visible: true, title, message, showCancel: false, onConfirm: undefined });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Estado de fichaje
      const res = await fetch(`${baseUrl}/fichajes/actual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_user: userId }),
      });
      const data = await res.json();
      if (data.success && data.activo) {
        setActivo(true);
        setEstado(data.fichaje.estado);
        setHoraEntrada(data.fichaje.hora_entrada);
      } else {
        setActivo(false);
        setEstado(null);
        setHoraEntrada(null);
        setElapsedSeconds(0);
      }

      // Vacaciones y días disponibles
      const vacRes = await fetch(`${baseUrl}/vacaciones/mis-vacaciones?id_user=${userId}`);
      const vacData = await vacRes.json();
      if (vacData.success) {
        setVacaciones(vacData.vacaciones);
      }
      
      const diasRes = await fetch(`${baseUrl}/vacaciones/disponibles?id_user=${userId}`);
      const diasData = await diasRes.json();
      if (diasData.success) {
        setDiasDisponibles(diasData.dias_disponibles);
      }
    } catch (e) {
      console.log('Error fetching data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: any;
    if (activo && horaEntrada) {
      // Calculate immediately so it doesn't wait 1s to show
      const calcElapsed = () => {
        let start = 0;
        
        // Custom parse to avoid NaN on different browsers/engines
        if (horaEntrada.includes('T')) {
          start = new Date(horaEntrada).getTime();
        } else {
          const parts = horaEntrada.split(' ');
          if (parts.length === 2) {
            const [y, m, d] = parts[0].split('-');
            const [h, min, s] = parts[1].split(':');
            start = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s)).getTime();
          } else {
            const safeDate = horaEntrada.replace(/-/g, '/');
            start = new Date(safeDate).getTime();
          }
        }

        if (isNaN(start)) {
          start = new Date().getTime(); // fallback
        }

        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((now - start) / 1000));
        setElapsedSeconds(diff);
      };
      calcElapsed();
      interval = setInterval(calcElapsed, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activo, horaEntrada, estado]);

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
        setHoraEntrada(data.fichaje.hora_entrada);
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
        setHoraEntrada(null);
        setElapsedSeconds(0);
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

  const requestVacation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/vacaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_user: userId,
          fecha_inicio: fechaInicio.toISOString().split('T')[0],
          fecha_fin: fechaFin.toISOString().split('T')[0],
          comentarios: vacationComments
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVacationModalVisible(false);
        setVacationComments('');
        fetchData();
      } else {
        showAlert(data.message || 'Error al solicitar');
      }
    } catch (e) {
      console.log('Error pidiendo vacaciones', e);
    } finally {
      setLoading(false);
    }
  };

  const cancelVacation = async (id_vacacion: number) => {
    try {
      const res = await fetch(`${baseUrl}/vacaciones/${id_vacacion}/cancelar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_user: userId })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        showAlert(data.message || 'Error al cancelar');
      }
    } catch (e) {
      console.log('Error cancelando', e);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'web') {
      setShowPicker(null);
    }
    if (selectedDate) {
      if (showPicker === 'inicio') setFechaInicio(selectedDate);
      if (showPicker === 'fin') setFechaFin(selectedDate);
    }
  };

  const formatTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatElapsed = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.viewTitle}>CONTROL HORARIO Y VACACIONES</Text>
      
      <View style={styles.card}>
        <View style={styles.clockContainer}>
          {activo ? (
            <>
              <Text style={styles.clockText}>{formatElapsed(elapsedSeconds)}</Text>
              <Text style={styles.statusText}>
                {estado === 'trabajando' ? 'Tiempo Trabajado' : 'En pausa'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.clockText}>{formatTime()}</Text>
              <Text style={styles.statusText}>Fuera de turno</Text>
            </>
          )}
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

      <View style={[styles.card, { marginTop: 24, padding: 24 }]}>
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.cardTitle, { marginBottom: 4 }]}>Mis Vacaciones</Text>
          {diasDisponibles !== null && (
            <Text style={{ color: '#64748B', marginBottom: 12, fontWeight: '500' }}>
              Días laborables disponibles: <Text style={{ color: diasDisponibles > 0 ? '#10B981' : '#EF4444' }}>{diasDisponibles} de 22</Text>
            </Text>
          )}
          <TouchableOpacity style={[styles.requestBtn, { alignSelf: 'flex-start' }]} onPress={() => setVacationModalVisible(true)}>
            <Feather name="calendar" size={16} color="#fff" />
            <Text style={styles.requestBtnText}>Solicitar Vacaciones</Text>
          </TouchableOpacity>
        </View>

        {vacaciones.length === 0 ? (
          <Text style={{ color: '#64748B', textAlign: 'center', marginVertical: 20 }}>No tienes solicitudes de vacaciones.</Text>
        ) : (
          <View style={{ width: '100%' }}>
            {vacaciones.map((vac) => (
              <View key={vac.id_vacacion} style={styles.vacationItem}>
                <View>
                  <Text style={styles.vacationDates}>
                    {vac.fecha_inicio} hasta {vac.fecha_fin}
                  </Text>
                  {vac.comentarios ? <Text style={styles.vacationComments}>{vac.comentarios}</Text> : null}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <View style={[
                    styles.statusBadge,
                    vac.estado === 'aprobada' ? styles.statusApproved : 
                    vac.estado === 'rechazada' || vac.estado === 'cancelada' ? styles.statusRejected : 
                    vac.estado === 'solicita_cancelacion' ? { backgroundColor: '#E0E7FF' } : styles.statusPending
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      vac.estado === 'aprobada' ? styles.statusApprovedText : 
                      vac.estado === 'rechazada' || vac.estado === 'cancelada' ? styles.statusRejectedText : 
                      vac.estado === 'solicita_cancelacion' ? { color: '#4338CA' } : styles.statusPendingText
                    ]}>
                      {vac.estado === 'solicita_cancelacion' ? 'PIDIENDO CANCELAR' : vac.estado.toUpperCase()}
                    </Text>
                  </View>
                  {(vac.estado === 'pendiente' || vac.estado === 'aprobada') && (
                    <TouchableOpacity onPress={() => cancelVacation(vac.id_vacacion)}>
                      <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '600' }}>Cancelar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Modal Fichaje */}
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

      {/* Modal Vacaciones */}
      <Modal animationType="slide" transparent={true} visible={vacationModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Solicitar Vacaciones</Text>

            <Text style={styles.label}>Fecha Inicio</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }}
                value={fechaInicio.toISOString().split('T')[0]}
                onChange={(e) => setFechaInicio(new Date(e.target.value))}
              />
            ) : (
              <>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('inicio')}>
                  <Text>{fechaInicio.toISOString().split('T')[0]}</Text>
                </TouchableOpacity>
                {showPicker === 'inicio' && (
                  <DateTimePicker value={fechaInicio} mode="date" display="default" onChange={onDateChange} />
                )}
              </>
            )}

            <Text style={styles.label}>Fecha Fin</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }}
                value={fechaFin.toISOString().split('T')[0]}
                onChange={(e) => setFechaFin(new Date(e.target.value))}
              />
            ) : (
              <>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('fin')}>
                  <Text>{fechaFin.toISOString().split('T')[0]}</Text>
                </TouchableOpacity>
                {showPicker === 'fin' && (
                  <DateTimePicker value={fechaFin} mode="date" display="default" onChange={onDateChange} />
                )}
              </>
            )}

            <Text style={styles.label}>Comentarios</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={3}
              value={vacationComments}
              onChangeText={setVacationComments}
              placeholder="Ej: Viaje familiar..."
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setVacationModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#10B981' }]} onPress={requestVacation} disabled={loading}>
                <Text style={styles.saveBtnText}>Enviar Solicitud</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ModalAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  viewTitle: { fontSize: 24, fontWeight: '700', color: '#334155', marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  clockContainer: { alignItems: 'center', marginBottom: 40 },
  clockText: { fontSize: 48, fontWeight: 'bold', color: '#1E293B' },
  statusText: { fontSize: 18, color: '#64748B', marginTop: 8 },
  controlsRow: { flexDirection: 'row', gap: 24 },
  controlBtn: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  playBtn: { backgroundColor: '#10B981' },
  pauseBtn: { backgroundColor: '#F59E0B' },
  stopBtn: { backgroundColor: '#EF4444' },
  
  requestBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
  requestBtnText: { color: '#fff', fontWeight: '600' },
  
  vacationItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  vacationDates: { fontSize: 14, fontWeight: '600', color: '#334155' },
  vacationComments: { fontSize: 13, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusApproved: { backgroundColor: '#D1FAE5' },
  statusRejected: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  statusPendingText: { color: '#D97706' },
  statusApprovedText: { color: '#059669' },
  statusRejectedText: { color: '#DC2626' },

  dateBtn: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, backgroundColor: '#F8FAFC' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', maxWidth: 400, borderRadius: 12, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, color: '#475569', marginBottom: 8, marginTop: 16 },
  textArea: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, height: 100, textAlignVertical: 'top' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 8, gap: 12 },
  uploadBtnText: { color: '#64748B', flex: 1 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelBtn: { backgroundColor: '#F1F5F9' },
  cancelBtnText: { color: '#64748B', fontWeight: '600' },
  saveBtn: { backgroundColor: '#EF4444' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
