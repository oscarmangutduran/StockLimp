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
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import Svg, { Circle } from 'react-native-svg';
import ModalAlert from '@/components/common/ModalAlert';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sept.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
};
LocaleConfig.defaultLocale = 'es';

interface TimeTrackingViewProps {
  baseUrl: string;
  userId: number;
}

const formatSecondsHMS = (secs: number) => {
  const safe = Math.max(0, Math.floor(secs));
  const h = Math.floor(safe / 3600).toString().padStart(2, '0');
  const m = Math.floor((safe % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(safe % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const ShiftProgressRing = ({
  realizedSeconds,
  totalSeconds = 40 * 3600,
  isActive,
  isPaused,
}: {
  realizedSeconds: number;
  totalSeconds?: number;
  isActive: boolean;
  isPaused: boolean;
}) => {
  const size = 158;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? Math.min(realizedSeconds / totalSeconds, 1) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const remainingSeconds = Math.max(0, totalSeconds - realizedSeconds);
  const ringColor = !isActive && realizedSeconds === 0 ? '#1E5B55' : isPaused ? '#F59E0B' : '#5EEAD4';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 10, color: '#99F6E4', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>
          Restantes semana
        </Text>
        <Text style={{ fontSize: 23, fontWeight: '800', color: '#FFFFFF', fontVariant: ['tabular-nums'] }}>
          {formatSecondsHMS(remainingSeconds)}
        </Text>
        <Text style={{ fontSize: 10, color: '#CBD5E1', marginTop: 2, fontWeight: '600' }}>
          de {formatSecondsHMS(totalSeconds)}
        </Text>
      </View>
    </View>
  );
};

export default function TimeTrackingView({ baseUrl, userId }: TimeTrackingViewProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 960;

  const [loading, setLoading] = useState(false);
  const [activo, setActivo] = useState(false);
  const [estado, setEstado] = useState<'trabajando' | 'en_pausa' | null>(null);
  const [horaEntrada, setHoraEntrada] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [objetivoSemanaSegundos, setObjetivoSemanaSegundos] = useState(40 * 3600);
  const [realizadosSemanaPrevios, setRealizadosSemanaPrevios] = useState(0);

  // Modal pausar / finalizar
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAction, setModalAction] = useState<'pause' | 'stop'>('stop');
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
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title?: string;
    message: string;
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({ visible: false, message: '' });

  const showAlert = (message: string, title = 'Aviso') =>
    setAlertConfig({ visible: true, title, message, showCancel: false, onConfirm: undefined });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/fichajes/actual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_user: userId }),
      });
      const data = await res.json();
      if (data.resumen) {
        setObjetivoSemanaSegundos(data.resumen.objetivo_semana_segundos ?? 40 * 3600);
        setRealizadosSemanaPrevios(data.resumen.realizados_semana_segundos ?? 0);
      }
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
      const calcElapsed = () => {
        let start = 0;
        if (horaEntrada.includes('T')) {
          start = new Date(horaEntrada).getTime();
        } else {
          const parts = horaEntrada.split(' ');
          if (parts.length === 2) {
            const [y, m, d] = parts[0].split('-');
            const [h, min, s] = parts[1].split(':');
            start = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s)).getTime();
          } else {
            start = new Date(horaEntrada.replace(/-/g, '/')).getTime();
          }
        }
        if (isNaN(start)) start = new Date().getTime();
        const diff = Math.max(0, Math.floor((new Date().getTime() - start) / 1000));
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
      } else {
        showAlert(data.message || 'No se pudo iniciar la jornada.');
      }
    } catch (e) {
      console.log('Error iniciando', e);
      showAlert('Error de conexión al iniciar el turno.');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseOrResume = async () => {
    if (estado === 'trabajando') {
      setComentarios('');
      setDocumento(null);
      setModalAction('pause');
      setModalVisible(true);
      return;
    }

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
      } else {
        showAlert(data.message || 'No se pudo reanudar la jornada.');
      }
    } catch (e) {
      console.log('Error reanudando', e);
      showAlert('Error de conexión al reanudar.');
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

  const handleModalConfirm = async () => {
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

      const endpoint = modalAction === 'pause' ? `${baseUrl}/fichajes/pausar` : `${baseUrl}/fichajes/finalizar`;
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        if (modalAction === 'pause') {
          setEstado(data.fichaje.estado);
        } else {
          setActivo(false);
          setEstado(null);
          setHoraEntrada(null);
          setElapsedSeconds(0);
        }
        setModalVisible(false);
        setComentarios('');
        setDocumento(null);
      } else {
        showAlert(data.message || (modalAction === 'pause' ? 'No se pudo pausar el turno.' : 'No se pudo finalizar el turno.'));
      }
    } catch (e) {
      console.log('Error en acción de fichaje', e);
      showAlert('Error de conexión.');
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
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_user: userId,
          fecha_inicio: formatDateYYYYMMDD(fechaInicio),
          fecha_fin: formatDateYYYYMMDD(fechaFin),
          comentarios: vacationComments,
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
      showAlert('Error de conexión al enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditVacation = (vac: any) => {
    setEditingVacationId(vac.id_vacacion);
    const startD = new Date(vac.fecha_inicio.split(' ')[0] + 'T00:00:00');
    const endD = new Date(vac.fecha_fin.split(' ')[0] + 'T00:00:00');
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
        body: JSON.stringify({ id_user: userId }),
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

  const formatDateYYYYMMDD = (d: Date) =>
    `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

  const formatDateDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const formatDatePicker = (d: Date) =>
    `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

  const formatHoraEntradaDisplay = (raw: string | null) => {
    if (!raw) return '--:--';
    if (raw.includes('T')) {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? raw : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const parts = raw.split(' ');
    return parts.length === 2 ? parts[1].substring(0, 5) : raw;
  };

  const countBusinessDays = (startStr: string, endStr: string) => {
    const start = new Date(startStr.split(' ')[0] + 'T00:00:00');
    const end = new Date(endStr.split(' ')[0] + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  const handleDayPress = (day: any) => {
    const selectedDate = new Date(day.dateString + 'T00:00:00');
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
      const start = new Date(startStr.split(' ')[0] + 'T00:00:00');
      const end = new Date(endStr.split(' ')[0] + 'T00:00:00');

      let current = new Date(start);
      while (current <= end) {
        const dateString = formatDateYYYYMMDD(current);
        marked[dateString] = {
          color,
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
          color: '#0F766E',
          textColor: 'white',
          startingDay: current.getTime() === start.getTime(),
          endingDay: current.getTime() === end.getTime(),
        };
        current.setDate(current.getDate() + 1);
      }
    }
    return marked;
  };

  const currentYear = new Date().getFullYear();
  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);

  let enjoyedDays = 0;
  let acceptedDays = 0;
  vacaciones
    .filter((v) => v.estado === 'aprobada')
    .forEach((v) => {
      const start = new Date(v.fecha_inicio.split(' ')[0] + 'T00:00:00');
      const end = new Date(v.fecha_fin.split(' ')[0] + 'T00:00:00');
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
      const cur = new Date(start);
      while (cur <= end) {
        const d = cur.getDay();
        if (d !== 0 && d !== 6) {
          if (cur <= todayMid) {
            enjoyedDays++;
          } else {
            acceptedDays++;
          }
        }
        cur.setDate(cur.getDate() + 1);
      }
    });

  const approvedDays = enjoyedDays + acceptedDays;
  const pendingDays = vacaciones
    .filter((v) => v.estado === 'pendiente')
    .reduce((acc, v) => acc + countBusinessDays(v.fecha_inicio, v.fecha_fin), 0);
  const availableDays = diasDisponibles !== null ? diasDisponibles : Math.max(0, 22 - approvedDays - pendingDays);

  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const selectedModalDays = countBusinessDays(formatDateYYYYMMDD(fechaInicio), formatDateYYYYMMDD(fechaFin));

  const getStatusBadgeStyle = (st: string) => {
    switch (st) {
      case 'aprobada':
        return { bg: '#DCFCE7', border: '#BBF7D0', text: '#15803D', label: 'Aprobada' };
      case 'rechazada':
        return { bg: '#FEE2E2', border: '#FECACA', text: '#DC2626', label: 'Rechazada' };
      case 'cancelada':
        return { bg: '#F1F5F9', border: '#E2E8F0', text: '#64748B', label: 'Cancelada' };
      case 'solicita_cancelacion':
        return { bg: '#FFEDD5', border: '#FED7AA', text: '#C2410C', label: 'Cancelando' };
      default:
        return { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309', label: 'Pendiente' };
    }
  };

  const totalRealizadosSemana = realizadosSemanaPrevios + elapsedSeconds;
  const restantesSemana = Math.max(0, objetivoSemanaSegundos - totalRealizadosSemana);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* View Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.viewTitle}>CONTROL HORARIO Y VACACIONES</Text>
          <Text style={styles.viewSubtitle}>
            {todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1)}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchData} disabled={loading}>
          <Feather name="refresh-cw" size={15} color="#0F766E" />
          <Text style={styles.refreshBtnText}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      {/* Top Split Section: Live Shift Timer + Vacation Balance */}
      <View style={[styles.topGrid, isDesktop && styles.topGridDesktop]}>
        {/* Card 1: Live Shift Hero Card */}
        <View style={[styles.shiftCard, isDesktop && { flex: 1.2 }]}>
          <View style={styles.shiftCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.shiftIconBox}>
                <Feather name="clock" size={16} color="#5EEAD4" />
              </View>
              <Text style={styles.shiftTitle}>Jornada Laboral</Text>
            </View>
            <View
              style={[
                styles.liveStatusPill,
                !activo
                  ? styles.liveStatusIdle
                  : estado === 'en_pausa'
                  ? styles.liveStatusPaused
                  : styles.liveStatusActive,
              ]}
            >
              <View
                style={[
                  styles.liveDot,
                  {
                    backgroundColor: !activo
                      ? '#94A3B8'
                      : estado === 'en_pausa'
                      ? '#F59E0B'
                      : '#10B981',
                  },
                ]}
              />
              <Text style={styles.liveStatusText}>
                {!activo ? 'Sin turno activo' : estado === 'en_pausa' ? 'En pausa' : 'En jornada'}
              </Text>
            </View>
          </View>

          <View style={[styles.shiftBody, !isDesktop && { flexDirection: 'column', gap: 18 }]}>
            <ShiftProgressRing
              realizedSeconds={totalRealizadosSemana}
              totalSeconds={objetivoSemanaSegundos}
              isActive={activo}
              isPaused={estado === 'en_pausa'}
            />

            <View style={styles.shiftInfoCol}>
              <View style={styles.shiftMetaGrid}>
                <View style={styles.shiftMetaBox}>
                  <Text style={styles.shiftMetaLabel}>Total semanal</Text>
                  <Text style={styles.shiftMetaVal}>{formatSecondsHMS(objetivoSemanaSegundos)}</Text>
                </View>
                <View style={styles.shiftMetaBox}>
                  <Text style={styles.shiftMetaLabel}>Realizadas (semana)</Text>
                  <Text style={[styles.shiftMetaVal, { color: '#5EEAD4' }]}>
                    {formatSecondsHMS(totalRealizadosSemana)}
                  </Text>
                </View>
              </View>

              <View style={styles.shiftMetaGrid}>
                <View style={styles.shiftMetaBox}>
                  <Text style={styles.shiftMetaLabel}>Restantes semana</Text>
                  <Text style={[styles.shiftMetaVal, { color: '#FDE68A' }]}>
                    {formatSecondsHMS(restantesSemana)}
                  </Text>
                </View>
                <View style={styles.shiftMetaBox}>
                  <Text style={styles.shiftMetaLabel}>Hora de entrada</Text>
                  <Text style={styles.shiftMetaVal}>
                    {activo ? formatHoraEntradaDisplay(horaEntrada) : '--:--'}
                  </Text>
                </View>
              </View>

              <Text style={styles.shiftHint}>
                {!activo
                  ? 'Pulsa "Iniciar Jornada" para fichar tu entrada. Las horas trabajadas se irán restando automáticamente de tu objetivo semanal.'
                  : `Entrada registrada a las ${formatHoraEntradaDisplay(horaEntrada)}. El tiempo restante semanal se descuenta en tiempo real.`}
              </Text>

              {/* Action Buttons */}
              {!activo ? (
                <TouchableOpacity
                  style={styles.startShiftBtn}
                  onPress={handlePlay}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#042F2E" />
                  ) : (
                    <>
                      <Feather name="play" size={17} color="#042F2E" />
                      <Text style={styles.startShiftBtnText}>Iniciar Jornada (Fichar Entrada)</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.activeBtnsRow}>
                  <TouchableOpacity
                    style={[
                      styles.pauseBtn,
                      estado === 'en_pausa' && { backgroundColor: '#10B981', borderColor: '#10B981' },
                    ]}
                    onPress={handlePauseOrResume}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <Feather
                      name={estado === 'en_pausa' ? 'play' : 'pause'}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.pauseBtnText}>
                      {estado === 'en_pausa' ? 'Reanudar' : 'Pausar'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.stopShiftBtn}
                    onPress={() => {
                      setComentarios('');
                      setDocumento(null);
                      setModalAction('stop');
                      setModalVisible(true);
                    }}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <Feather name="square" size={15} color="#FFFFFF" />
                    <Text style={styles.stopShiftBtnText}>Finalizar Turno</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Card 2: Vacation Balance Card */}
        <View style={[styles.card, isDesktop && { flex: 0.85 }]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.cardIconBox}>
                <Feather name="sun" size={16} color="#D97706" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Balance de Vacaciones</Text>
                <Text style={styles.cardSub}>Año natural {currentYear} &bull; 22 días laborables</Text>
              </View>
            </View>
          </View>

          <View style={styles.vacStatsGrid}>
            <View style={[styles.vacStatBox, { backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }]}>
              <Text style={[styles.vacStatNum, { color: '#0F766E' }]}>{availableDays}</Text>
              <Text style={styles.vacStatLabel}>Disponibles</Text>
            </View>
            <View style={[styles.vacStatBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <Text style={[styles.vacStatNum, { color: '#B45309' }]}>{pendingDays}</Text>
              <Text style={styles.vacStatLabel}>Pendientes</Text>
            </View>
            <View style={[styles.vacStatBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <Text style={[styles.vacStatNum, { color: '#15803D' }]}>{acceptedDays}</Text>
              <Text style={styles.vacStatLabel}>Aceptados</Text>
            </View>
            <View style={[styles.vacStatBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Text style={[styles.vacStatNum, { color: '#1D4ED8' }]}>{enjoyedDays}</Text>
              <Text style={styles.vacStatLabel}>Disfrutados</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={{ marginTop: 16, marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>Uso del cupo anual</Text>
              <Text style={{ fontSize: 12, color: '#0F766E', fontWeight: '700' }}>
                {Math.min(22, approvedDays + pendingDays)} / 22 días
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  { backgroundColor: '#2563EB', height: '100%' },
                  { width: `${Math.min(100, (enjoyedDays / 22) * 100)}%` },
                ]}
              />
              <View
                style={[
                  styles.progressFillApproved,
                  { width: `${Math.min(100 - Math.min(100, (enjoyedDays / 22) * 100), (acceptedDays / 22) * 100)}%` },
                ]}
              />
              <View
                style={[
                  styles.progressFillPending,
                  { width: `${Math.min(100 - Math.min(100, (approvedDays / 22) * 100), (pendingDays / 22) * 100)}%` },
                ]}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.requestVacBtn}
            onPress={() => {
              setEditingVacationId(null);
              setFechaInicio(new Date());
              setFechaFin(new Date());
              setSelectionStep('complete');
              setVacationComments('');
              setVacationModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Feather name="calendar" size={16} color="#FFFFFF" />
            <Text style={styles.requestVacBtnText}>Solicitar Vacaciones</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Section: Vacations & Absences History */}
      <View style={[styles.card, { marginTop: 18 }]}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.cardIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Feather name="list" size={16} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Mis Solicitudes y Ausencias</Text>
              <Text style={styles.cardSub}>
                {vacaciones.length} {vacaciones.length === 1 ? 'solicitud registrada' : 'solicitudes registradas'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addSmallBtn}
            onPress={() => {
              setEditingVacationId(null);
              setFechaInicio(new Date());
              setFechaFin(new Date());
              setSelectionStep('complete');
              setVacationComments('');
              setVacationModalVisible(true);
            }}
          >
            <Feather name="plus" size={15} color="#0F766E" />
            <Text style={styles.addSmallBtnText}>Nueva Solicitud</Text>
          </TouchableOpacity>
        </View>

        {vacaciones.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="calendar" size={28} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Sin solicitudes de vacaciones</Text>
            <Text style={styles.emptySub}>
              Cuando solicites días libres aparecerán aquí junto con su estado de aprobación.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {vacaciones.map((vac) => {
              const badge = getStatusBadgeStyle(vac.estado);
              const dias = countBusinessDays(vac.fecha_inicio, vac.fecha_fin);
              return (
                <View key={vac.id_vacacion} style={styles.vacRowCard}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={styles.vacRowDates}>
                        {formatDateDDMMYYYY(vac.fecha_inicio)} — {formatDateDDMMYYYY(vac.fecha_fin)}
                      </Text>
                      <View style={styles.daysChip}>
                        <Text style={styles.daysChipText}>
                          {dias} {dias === 1 ? 'día laborable' : 'días laborables'}
                        </Text>
                      </View>
                    </View>
                    {vac.comentarios ? (
                      <Text style={styles.vacRowComments} numberOfLines={2}>
                        “{vac.comentarios}”
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.vacRowRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badge.bg, borderColor: badge.border },
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>

                    {vac.estado === 'pendiente' && (
                      <TouchableOpacity
                        style={styles.inlineActionBtn}
                        onPress={() => handleEditVacation(vac)}
                      >
                        <Feather name="edit-2" size={13} color="#2563EB" />
                        <Text style={[styles.inlineActionText, { color: '#2563EB' }]}>Editar</Text>
                      </TouchableOpacity>
                    )}

                    {vac.estado === 'aprobada' && (
                      <TouchableOpacity
                        style={styles.inlineActionBtn}
                        onPress={() => cancelVacation(vac.id_vacacion)}
                      >
                        <Feather name="x-circle" size={13} color="#EF4444" />
                        <Text style={[styles.inlineActionText, { color: '#EF4444' }]}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Modal Pausar / Finalizar Turno */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalAction === 'pause' ? 'Pausar Jornada' : 'Finalizar Jornada'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Comentarios u observaciones</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={comentarios}
              onChangeText={setComentarios}
              placeholder={
                modalAction === 'pause'
                  ? 'Ej: Pausa para descanso, comida o cita médica...'
                  : 'Ej: Salida anticipada por visita médica o incidencia en ruta...'
              }
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.label}>Justificante médico o documento (opcional)</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
              <Feather name="upload" size={18} color="#0F766E" />
              <Text style={styles.uploadBtnText} numberOfLines={1}>
                {documento ? documento.name : 'Adjuntar archivo PDF o imagen...'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  modalAction === 'pause' ? { backgroundColor: '#D97706' } : styles.saveBtn,
                ]}
                onPress={handleModalConfirm}
                disabled={loading}
              >
                <Text style={styles.saveBtnText}>
                  {modalAction === 'pause' ? 'Confirmar Pausa' : 'Confirmar Salida'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Solicitar / Editar Vacaciones */}
      <Modal animationType="fade" transparent={true} visible={vacationModalVisible} onRequestClose={() => setVacationModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500, maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingVacationId ? 'Editar Solicitud de Vacaciones' : 'Solicitar Vacaciones'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setVacationModalVisible(false);
                  setEditingVacationId(null);
                }}
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>Selecciona el rango en el calendario</Text>
                <Text style={{ fontSize: 12, color: '#0F766E', fontWeight: '700' }}>
                  {selectionStep === 'start' ? 'Pulsa fecha de fin' : `${selectedModalDays} día(s) laborables`}
                </Text>
              </View>

              <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <Calendar
                  markingType={'period'}
                  markedDates={generateMarkedDates()}
                  onDayPress={handleDayPress}
                  firstDay={1}
                  theme={{
                    todayTextColor: '#0F766E',
                    arrowColor: '#0F766E',
                    textMonthFontWeight: 'bold',
                    textDayFontSize: 13,
                    textMonthFontSize: 15,
                  }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 10, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 10, height: 10, backgroundColor: '#10B981', borderRadius: 3 }} />
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Aprobadas</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 10, height: 10, backgroundColor: '#F59E0B', borderRadius: 3 }} />
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Pendientes</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 10, height: 10, backgroundColor: '#0F766E', borderRadius: 3 }} />
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Selección</Text>
                </View>
              </View>

              <View style={styles.selectedRangeBar}>
                <View>
                  <Text style={styles.selectedRangeLabel}>Fecha inicio</Text>
                  <Text style={styles.selectedRangeVal}>{formatDatePicker(fechaInicio)}</Text>
                </View>
                <Feather name="arrow-right" size={16} color="#0F766E" />
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.selectedRangeLabel}>Fecha fin</Text>
                  <Text style={styles.selectedRangeVal}>{formatDatePicker(fechaFin)}</Text>
                </View>
              </View>

              <Text style={styles.label}>Comentarios (opcional)</Text>
              <TextInput
                style={[styles.textArea, { height: 76 }]}
                multiline
                numberOfLines={3}
                value={vacationComments}
                onChangeText={setVacationComments}
                placeholder="Ej: Vacaciones de verano / asunto personal..."
                placeholderTextColor="#94A3B8"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setVacationModalVisible(false);
                  setEditingVacationId(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#0F766E' }]}
                onPress={submitVacation}
                disabled={loading}
              >
                <Text style={styles.saveBtnText}>
                  {editingVacationId ? 'Guardar Cambios' : 'Enviar Solicitud'}
                </Text>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  contentContainer: { padding: 20, paddingBottom: 48 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 12,
  },
  viewTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  viewSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  refreshBtnText: { fontSize: 13, fontWeight: '600', color: '#0F766E' },

  topGrid: { gap: 18 },
  topGridDesktop: { flexDirection: 'row', alignItems: 'stretch' },

  // Hero Shift Card
  shiftCard: {
    backgroundColor: '#042F2E',
    borderRadius: 18,
    padding: 22,
    shadowColor: '#042F2E',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  shiftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  shiftIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(94, 234, 212, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  liveStatusIdle: { backgroundColor: 'rgba(148, 163, 184, 0.18)' },
  liveStatusActive: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  liveStatusPaused: { backgroundColor: 'rgba(245, 158, 11, 0.22)' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveStatusText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  shiftBody: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  shiftInfoCol: { flex: 1, width: '100%' },
  shiftMetaGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  shiftMetaBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    padding: 10,
  },
  shiftMetaLabel: { fontSize: 11, color: '#99F6E4', marginBottom: 2 },
  shiftMetaVal: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  shiftHint: { fontSize: 12, color: '#CBD5E1', lineHeight: 17, marginBottom: 16 },

  startShiftBtn: {
    backgroundColor: '#5EEAD4',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startShiftBtnText: { color: '#042F2E', fontSize: 14, fontWeight: '800' },

  activeBtnsRow: { flexDirection: 'row', gap: 10 },
  pauseBtn: {
    flex: 1,
    backgroundColor: '#D97706',
    borderWidth: 1,
    borderColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pauseBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  stopShiftBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stopShiftBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Standard White Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
    flexWrap: 'wrap',
  },
  cardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#64748B', marginTop: 1 },

  vacStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vacStatBox: {
    flex: 1,
    minWidth: 92,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  vacStatNum: { fontSize: 22, fontWeight: '800' },
  vacStatLabel: { fontSize: 11, color: '#475569', fontWeight: '600', marginTop: 2 },

  progressTrack: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFillApproved: { backgroundColor: '#10B981', height: '100%' },
  progressFillPending: { backgroundColor: '#F59E0B', height: '100%' },

  requestVacBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  requestVacBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  addSmallBtnText: { fontSize: 12, fontWeight: '700', color: '#0F766E' },

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#334155', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, maxWidth: 360 },

  vacRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    flexWrap: 'wrap',
  },
  vacRowDates: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  daysChip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  daysChipText: { fontSize: 11, fontWeight: '700', color: '#0369A1' },
  vacRowComments: { fontSize: 12, color: '#64748B', marginTop: 4, fontStyle: 'italic' },
  vacRowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },

  inlineActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 6 },
  inlineActionText: { fontSize: 12, fontWeight: '700' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  modalContent: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 440, borderRadius: 16, padding: 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  textArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    height: 96,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    gap: 10,
  },
  uploadBtnText: { color: '#0F766E', fontSize: 13, fontWeight: '600', flex: 1 },

  selectedRangeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  selectedRangeLabel: { fontSize: 11, color: '#0F766E', fontWeight: '600' },
  selectedRangeVal: { fontSize: 14, fontWeight: '800', color: '#042F2E', marginTop: 2 },

  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  cancelBtn: { backgroundColor: '#F1F5F9' },
  cancelBtnText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  saveBtn: { backgroundColor: '#EF4444' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
