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
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import Svg, { Circle } from 'react-native-svg';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sept.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
};
LocaleConfig.defaultLocale = 'es';
import ModalAlert from '@/components/common/ModalAlert';

const CircularProgress = ({ label, current, total }: { label: string, current: number, total: number }) => {
  const radius = 35;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(current / total, 1) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const h = Math.floor(current / 3600).toString().padStart(2, '0');
  const m = Math.floor((current % 3600) / 60).toString().padStart(2, '0');

  const totalH = Math.floor(total / 3600).toString().padStart(2, '0');
  const totalM = Math.floor((total % 3600) / 60).toString().padStart(2, '0');

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 13, color: '#5C8E8D', marginBottom: 12, fontWeight: '600' }}>{label}</Text>
      <View style={{ position: 'relative', width: (radius + strokeWidth) * 2, height: (radius + strokeWidth) * 2, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={(radius + strokeWidth) * 2} height={(radius + strokeWidth) * 2} style={{ position: 'absolute' }}>
          <Circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="#D4E4E4"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="#5C8E8D"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${radius + strokeWidth}, ${radius + strokeWidth}`}
          />
        </Svg>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>{h}:{m}</Text>
          <Text style={{ fontSize: 10, color: '#94A3B8' }}>{totalH}:{totalM}</Text>
        </View>
      </View>
    </View>
  );
};

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
  const [editingVacationId, setEditingVacationId] = useState<number | null>(null);
  const [selectionStep, setSelectionStep] = useState<'start' | 'end' | 'complete'>('complete');
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

  const submitVacation = async () => {
    setLoading(true);
    try {
      const url = editingVacationId 
        ? `${baseUrl}/vacaciones/${editingVacationId}`
        : `${baseUrl}/vacaciones`;
      const method = editingVacationId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_user: userId,
          fecha_inicio: formatDateYYYYMMDD(fechaInicio),
          fecha_fin: formatDateYYYYMMDD(fechaFin),
          comentarios: vacationComments
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVacationModalVisible(false);
        setVacationComments('');
        setEditingVacationId(null);
        fetchData();
      } else {
        showAlert(data.message || 'Error al procesar solicitud');
      }
    } catch (e) {
      console.log('Error pidiendo/editando vacaciones', e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditVacation = (vac: any) => {
    setEditingVacationId(vac.id_vacacion);
    const startD = new Date(vac.fecha_inicio.split(' ')[0] + "T00:00:00");
    const endD = new Date(vac.fecha_fin.split(' ')[0] + "T00:00:00");
    setFechaInicio(startD);
    setFechaFin(endD);
    setSelectionStep('complete');
    setVacationComments(vac.comentarios || '');
    setVacationModalVisible(true);
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

  const formatTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateYYYYMMDD = (d: Date) => {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

  const formatDateDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatDatePicker = (d: Date) => {
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handleDayPress = (day: any) => {
    const selectedDate = new Date(day.dateString + "T00:00:00");
    if (selectionStep === 'complete' || selectionStep === 'end') {
      setFechaInicio(selectedDate);
      setFechaFin(selectedDate);
      setSelectionStep('start');
    } else if (selectionStep === 'start') {
      if (selectedDate < fechaInicio) {
        setFechaInicio(selectedDate);
        setFechaFin(selectedDate);
      } else {
        setFechaFin(selectedDate);
        setSelectionStep('complete');
      }
    }
  };

  const generateMarkedDates = () => {
    let marked: any = {};
    
    const markPeriod = (startStr: string, endStr: string, color: string) => {
      const start = new Date(startStr.split(' ')[0] + "T00:00:00");
      const end = new Date(endStr.split(' ')[0] + "T00:00:00");
      
      let current = new Date(start);
      while (current <= end) {
        const dateString = formatDateYYYYMMDD(current);
        marked[dateString] = {
          color: color,
          textColor: 'white',
          startingDay: current.getTime() === start.getTime(),
          endingDay: current.getTime() === end.getTime(),
        };
        current.setDate(current.getDate() + 1);
      }
    };

    vacaciones.forEach((vac: any) => {
      if (vac.id_vacacion === editingVacationId) return;
      if (vac.estado === 'aprobada') {
        markPeriod(vac.fecha_inicio, vac.fecha_fin, '#10B981');
      } else if (vac.estado === 'pendiente') {
        markPeriod(vac.fecha_inicio, vac.fecha_fin, '#F59E0B');
      }
    });

    if (fechaInicio) {
       const start = new Date(fechaInicio);
       const end = new Date(fechaFin || fechaInicio);
       
       let current = new Date(start);
       while (current <= end) {
         const dateString = formatDateYYYYMMDD(current);
         marked[dateString] = {
           color: '#3B82F6',
           textColor: 'white',
           startingDay: current.getTime() === start.getTime(),
           endingDay: current.getTime() === end.getTime(),
         };
         current.setDate(current.getDate() + 1);
       }
    }
    return marked;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* RINGS CARD */}
      <View style={styles.card}>
        <View style={styles.ringsRow}>
          <CircularProgress label="Hoy" current={elapsedSeconds} total={8 * 3600} />
          <CircularProgress label="Semana" current={14 * 3600 + 59 * 60} total={40 * 3600} />
          <CircularProgress label="Mes" current={14 * 3600 + 59 * 60} total={160 * 3600} />
        </View>
      </View>

      {/* CUENTA DE HORAS CARD */}
      <View style={[styles.card, { marginTop: 16 }]}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Cuenta de horas</Text>
          <TouchableOpacity>
            <Text style={styles.cardLinkText}>Ver detalles</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Periodo pasado</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>05:30</Text>
            <Text style={styles.statSub}>1/24/23</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Actual</Text>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>-00:25</Text>
            <Text style={styles.statSub}>Desde 1/25/23</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>05:05</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.previewBtn, activo ? styles.previewBtnActive : {}]} 
          onPress={activo ? () => setModalVisible(true) : handlePlay} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : 
            <Text style={styles.previewBtnText}>{activo ? 'Detener Turno' : 'Comenzar (Fichar)'}</Text>
          }
        </TouchableOpacity>
      </View>

      {/* CUENTA DE VACACIONES CARD */}
      <View style={[styles.card, { marginTop: 16 }]}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Cuenta de vacaciones</Text>
          <Text style={styles.cardDateRange}>1/1/24 - 31/12/24 &gt;</Text>
        </View>
        
        <View style={styles.statsRow}>
           <View style={styles.statColumn}>
             <Text style={styles.statLabel}>Consumido</Text>
             <Text style={[styles.statValue, { color: '#1E293B' }]}>
               {vacaciones.filter(v => v.estado === 'aprobada').length * 2} días
             </Text>
           </View>
           <View style={styles.statColumn}>
             <Text style={styles.statLabel}>Planeado</Text>
             <Text style={[styles.statValue, { color: '#1E293B' }]}>
               {vacaciones.filter(v => v.estado === 'pendiente').length * 2} días
             </Text>
           </View>
           <View style={styles.statColumn}>
             <Text style={styles.statLabel}>Restantes</Text>
             <Text style={[styles.statValue, { color: '#10B981' }]}>{diasDisponibles ?? 22} días</Text>
           </View>
        </View>
      </View>

      {/* SOLICITUDES Y AUSENCIAS */}
      <View style={[styles.card, { marginTop: 16, marginBottom: 40 }]}>
        <View style={[styles.cardHeaderRow, { marginBottom: 16 }]}>
          <Text style={styles.cardTitle}>Solicitudes y ausencias</Text>
          <TouchableOpacity onPress={() => {
            setEditingVacationId(null);
            setFechaInicio(new Date());
            setFechaFin(new Date());
            setSelectionStep('complete');
            setVacationComments('');
            setVacationModalVisible(true);
          }}>
            <Feather name="plus" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {vacaciones.length === 0 ? (
          <Text style={{ color: '#64748B', textAlign: 'center', marginVertical: 20 }}>No tienes solicitudes.</Text>
        ) : (
          <View style={{ width: '100%' }}>
            {vacaciones.map((vac) => (
              <View key={vac.id_vacacion} style={styles.timrVacationItem}>
                <View>
                  <Text style={styles.timrVacationTitle}>Vacaciones</Text>
                  <Text style={styles.timrVacationDates}>
                    {formatDateDDMMYYYY(vac.fecha_inicio)} - {formatDateDDMMYYYY(vac.fecha_fin)}
                  </Text>
                  {vac.estado === 'pendiente' && (
                    <TouchableOpacity onPress={() => handleEditVacation(vac)} style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 12, color: '#3B82F6', fontWeight: '600' }}>Editar</Text>
                    </TouchableOpacity>
                  )}
                  {vac.estado === 'aprobada' && (
                    <TouchableOpacity onPress={() => cancelVacation(vac.id_vacacion)} style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '600' }}>Solicitar Cancelación</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[
                    styles.timrBadge,
                    vac.estado === 'aprobada' ? styles.timrBadgeApproved : 
                    vac.estado === 'rechazada' || vac.estado === 'cancelada' ? styles.timrBadgeRejected : 
                    styles.timrBadgePending
                  ]}>
                  <Text style={[
                      styles.timrBadgeText,
                      vac.estado === 'aprobada' ? styles.timrBadgeApprovedText : 
                      vac.estado === 'rechazada' || vac.estado === 'cancelada' ? styles.timrBadgeRejectedText : 
                      styles.timrBadgePendingText
                    ]}>
                      {vac.estado === 'solicita_cancelacion' ? 'Cancelando' : vac.estado.charAt(0).toUpperCase() + vac.estado.slice(1)}
                  </Text>
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
          <View style={[styles.modalContent, { width: Platform.OS === 'web' ? 500 : '95%' }]}>
            <Text style={styles.modalTitle}>{editingVacationId ? 'Editar Vacaciones' : 'Solicitar Vacaciones'}</Text>

            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={styles.label}>Selecciona los días en el calendario</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>
                  {selectionStep === 'start' ? 'Selecciona fin' : ''}
                </Text>
              </View>
              
              <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                <Calendar
                  markingType={'period'}
                  markedDates={generateMarkedDates()}
                  onDayPress={handleDayPress}
                  firstDay={1}
                  theme={{
                    todayTextColor: '#3B82F6',
                    arrowColor: '#3B82F6',
                    textMonthFontWeight: 'bold',
                    textDayFontSize: 14,
                    textMonthFontSize: 16,
                  }}
                />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 12, height: 12, backgroundColor: '#10B981', borderRadius: 2 }} />
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Aprobadas</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 12, height: 12, backgroundColor: '#F59E0B', borderRadius: 2 }} />
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Pendientes</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 12, height: 12, backgroundColor: '#3B82F6', borderRadius: 2 }} />
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Selección</Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={styles.label}>Inicio</Text>
                <Text style={{ fontSize: 14, fontWeight: '600' }}>{formatDatePicker(fechaInicio)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.label}>Fin</Text>
                <Text style={{ fontSize: 14, fontWeight: '600' }}>{formatDatePicker(fechaFin)}</Text>
              </View>
            </View>

            <Text style={styles.label}>Comentarios (Opcional)</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={3}
              value={vacationComments}
              onChangeText={setVacationComments}
              placeholder="Ej: Viaje familiar..."
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => {
                setVacationModalVisible(false);
                setEditingVacationId(null);
              }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#10B981' }]} onPress={submitVacation} disabled={loading}>
                <Text style={styles.saveBtnText}>{editingVacationId ? 'Guardar Cambios' : 'Enviar Solicitud'}</Text>
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
  container: { flex: 1, backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingTop: 16 },
  
  // Tabs Header
  tabsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#5C8E8D', paddingBottom: 8 },
  tabActiveText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  tabInactive: { paddingBottom: 8 },
  tabInactiveText: { fontSize: 15, fontWeight: '500', color: '#64748B' },

  // Cards
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardLinkText: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  cardDateRange: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },

  // Rings
  ringsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statColumn: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  statSub: { fontSize: 11, color: '#94A3B8' },

  // Buttons
  previewBtn: { backgroundColor: '#EAF1F1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  previewBtnActive: { backgroundColor: '#FEF2F2' },
  previewBtnText: { color: '#5C8E8D', fontWeight: '700', fontSize: 15 },
  
  // Vacations List
  timrVacationItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  timrVacationTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  timrVacationDates: { fontSize: 13, color: '#64748B', marginTop: 4 },
  
  timrBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  timrBadgePending: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  timrBadgeApproved: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  timrBadgeRejected: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  
  timrBadgeText: { fontSize: 12, fontWeight: '600' },
  timrBadgePendingText: { color: '#D97706' },
  timrBadgeApprovedText: { color: '#16A34A' },
  timrBadgeRejectedText: { color: '#DC2626' },

  // Modals
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
