import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { styles } from '../../css/DownloadsView.styles';

interface DownloadsViewProps {
  baseUrl: string;
  userRole?: string;
}

type ScreenTab = 'login' | 'fichaje' | 'pedidos' | 'vacaciones' | 'perfil';

export default function DownloadsView({ baseUrl, userRole = 'operario' }: DownloadsViewProps) {
  const manualFilename = 'Manual_Usuario_StockLimp.pdf';
  const [activeScreen, setActiveScreen] = useState<ScreenTab>('login');
  const [showAppleModal, setShowAppleModal] = useState<boolean>(false);
  const [androidDownloadStarted, setAndroidDownloadStarted] = useState<boolean>(false);

  const getManualUrl = () => {
    if (Platform.OS === 'web') {
      return `/downloads/${manualFilename}`;
    }
    return `${baseUrl.replace('/api', '')}/downloads/${manualFilename}`;
  };

  const handleDownload = () => {
    const url = getManualUrl();
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = url;
      a.download = manualFilename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      Linking.openURL(url);
    }
  };

  const handlePreview = () => {
    const url = getManualUrl();
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const handleDownloadAndroid = () => {
    const apkFilename = 'StockLimp.apk';
    const url = Platform.OS === 'web' ? `/downloads/${apkFilename}` : `${baseUrl.replace('/api', '')}/downloads/${apkFilename}`;
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = url;
      a.download = apkFilename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      Linking.openURL(url);
    }
    setAndroidDownloadStarted(true);
    setTimeout(() => setAndroidDownloadStarted(false), 4000);
  };

  const handleDownloadApple = () => {
    setShowAppleModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.titleCol}>
          <View style={styles.viewTitleRow}>
            <View style={styles.titleIconBg}>
              <Feather name="arrow-down" size={22} color="#0F766E" />
            </View>
            <View>
              <Text style={styles.viewTitle}>Descargas</Text>
              <Text style={styles.viewSub}>
                Manual Oficial de Usuario Ilustrado con capturas de pantalla y explicaciones paso a paso.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Manual Hero Card */}
      <View style={styles.manualHeroCard}>
        <View style={styles.heroContentRow}>
          <View style={styles.pdfIconLargeBg}>
            <Feather name="file-text" size={38} color="#99F6E4" />
          </View>

          <View style={styles.heroDetails}>
            <View style={styles.badgeRow}>
              <View style={styles.badgeOfficial}>
                <Text style={styles.badgeOfficialText}>MANUAL ILUSTRADO</Text>
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>PDF 5 Páginas</Text>
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>Capturas de Pantalla Reales</Text>
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>Versión 2026</Text>
              </View>
            </View>

            <Text style={styles.manualTitle}>Manual de Usuario Ilustrado — StockLimp</Text>
            <Text style={styles.manualSubtitle}>
              Guía oficial para operarios y encargados: contiene capturas de pantalla de la interfaz, instrucciones de fichaje, pausas con justificante, pedidos del 2 al 20 y cálculo de vacaciones.
            </Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.primaryDownloadBtn}
                onPress={handleDownload}
                accessibilityLabel="Descargar Manual de Usuario"
              >
                <Feather name="arrow-down" size={18} color="#FFFFFF" />
                <Text style={styles.primaryDownloadBtnText}>Descargar Manual de Usuario</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handlePreview}
                accessibilityLabel="Visualizar en el Navegador"
              >
                <Feather name="external-link" size={16} color="#FFFFFF" />
                <Text style={styles.secondaryBtnText}>Visualizar Online</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Official Mobile Apps Download Section (Android & Apple) */}
      <View style={styles.mobileAppsSection}>
        <View style={styles.mobileAppsTop}>
          <View style={styles.mobileAppsBadge}>
            <Text style={styles.mobileAppsBadgeText}>APP MÓVIL DISPONIBLE</Text>
          </View>
          <Text style={styles.mobileAppsTitle}>Descarga la App de StockLimp en tu Móvil</Text>
          <Text style={styles.mobileAppsSub}>
            Lleva el control de tus turnos, realiza pausas justificadas con cámara y gestiona pedidos mensuales directamente desde tu teléfono smartphone.
          </Text>
        </View>

        <View style={styles.storeButtonsRow}>
          {/* Android Official Store Button */}
          <TouchableOpacity
            style={styles.storeBtn}
            onPress={handleDownloadAndroid}
            activeOpacity={0.85}
            accessibilityLabel="Descargar app para Android"
          >
            <View style={styles.storeIconBox}>
              <FontAwesome name="android" size={32} color="#3DDC84" />
            </View>
            <View style={styles.storeTextCol}>
              <Text style={styles.storeTopText}>DESCARGAR PARA</Text>
              <Text style={styles.storeBottomText}>Android (APK)</Text>
            </View>
            <Feather name="arrow-down" size={16} color="#3DDC84" />
          </TouchableOpacity>

          {/* Apple Official Store Button */}
          <TouchableOpacity
            style={styles.storeBtn}
            onPress={handleDownloadApple}
            activeOpacity={0.85}
            accessibilityLabel="Descargar app para Apple"
          >
            <View style={styles.storeIconBox}>
              <FontAwesome name="apple" size={34} color="#FFFFFF" />
            </View>
            <View style={styles.storeTextCol}>
              <Text style={styles.storeTopText}>CONSIGUE LA APP EN EL</Text>
              <Text style={styles.storeBottomText}>App Store</Text>
            </View>
            <Feather name="external-link" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {androidDownloadStarted && (
          <View style={{ marginTop: 12, backgroundColor: 'rgba(61, 220, 132, 0.15)', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#3DDC84', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="check-circle" size={16} color="#3DDC84" />
            <Text style={{ color: '#CCFBF1', fontSize: 12, fontWeight: '600' }}>
              ✓ Iniciando descarga de StockLimp.apk para Android.
            </Text>
          </View>
        )}
      </View>

      {/* Apple App Installation Modal */}
      {showAppleModal && (
        <View style={styles.appleModalOverlay}>
          <View style={styles.appleModalCard}>
            <View style={styles.appleModalHeader}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                <FontAwesome name="apple" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.appleModalTitle}>StockLimp para Apple iOS</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>Instalación en iPhone y iPad</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAppleModal(false)} style={{ padding: 4 }}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.appleModalBodyText}>
              Puedes utilizar la versión oficial de StockLimp en tu dispositivo Apple de dos formas:
            </Text>

            <View style={styles.appleInstructionStep}>
              <View style={styles.appleStepBadge}><Text style={styles.appleStepBadgeText}>1</Text></View>
              <Text style={styles.appleStepText}>
                <Text style={{ fontWeight: '700' }}>Acceso directo Web App (Recomendado): </Text>
                Abre esta web en Safari, pulsa el botón Compartir y elige "Añadir a la pantalla de inicio".
              </Text>
            </View>

            <View style={styles.appleInstructionStep}>
              <View style={styles.appleStepBadge}><Text style={styles.appleStepBadgeText}>2</Text></View>
              <Text style={styles.appleStepText}>
                <Text style={{ fontWeight: '700' }}>Distribución Empresarial / TestFlight: </Text>
                Disponible a través de la gestión de dispositivos corporativos de Adarve Limpiezas S.L.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.appleModalBtnClose}
              onPress={() => setShowAppleModal(false)}
            >
              <Text style={styles.appleModalBtnCloseText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Interactive Screenshot Walkthrough Gallery */}
      <View style={styles.screenshotsContainer}>
        <View style={styles.screenshotsHeader}>
          <View>
            <Text style={styles.screenshotsTitle}>📸 Capturas de Pantalla del Manual (Vista Previa)</Text>
            <Text style={styles.screenshotsSub}>
              Haz clic en cada pestaña para explorar las pantallas explicadas en el manual antes de descargarlo.
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeScreen === 'login' && styles.tabBtnActive]}
            onPress={() => setActiveScreen('login')}
          >
            <Feather name="log-in" size={15} color={activeScreen === 'login' ? '#FFF' : '#0F766E'} />
            <Text style={[styles.tabBtnText, activeScreen === 'login' && styles.tabBtnTextActive]}>
              1. Login y Acceso
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeScreen === 'fichaje' && styles.tabBtnActive]}
            onPress={() => setActiveScreen('fichaje')}
          >
            <Feather name="clock" size={15} color={activeScreen === 'fichaje' ? '#FFF' : '#0F766E'} />
            <Text style={[styles.tabBtnText, activeScreen === 'fichaje' && styles.tabBtnTextActive]}>
              2. Fichajes y Pausas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeScreen === 'pedidos' && styles.tabBtnActive]}
            onPress={() => setActiveScreen('pedidos')}
          >
            <Feather name="shopping-bag" size={15} color={activeScreen === 'pedidos' ? '#FFF' : '#0F766E'} />
            <Text style={[styles.tabBtnText, activeScreen === 'pedidos' && styles.tabBtnTextActive]}>
              3. Pedidos (2 al 20)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeScreen === 'vacaciones' && styles.tabBtnActive]}
            onPress={() => setActiveScreen('vacaciones')}
          >
            <Feather name="sun" size={15} color={activeScreen === 'vacaciones' ? '#FFF' : '#0F766E'} />
            <Text style={[styles.tabBtnText, activeScreen === 'vacaciones' && styles.tabBtnTextActive]}>
              4. Vacaciones (4 Estados)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeScreen === 'perfil' && styles.tabBtnActive]}
            onPress={() => setActiveScreen('perfil')}
          >
            <Feather name="user" size={15} color={activeScreen === 'perfil' ? '#FFF' : '#0F766E'} />
            <Text style={[styles.tabBtnText, activeScreen === 'perfil' && styles.tabBtnTextActive]}>
              5. Foto Permanente
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mockup Frame displaying the active screen */}
        <View style={styles.mockupFrame}>
          {/* Browser Chrome Header */}
          <View style={styles.mockupChrome}>
            <View style={styles.windowDots}>
              <View style={styles.dotRed} />
              <View style={styles.dotYellow} />
              <View style={styles.dotGreen} />
            </View>
            <View style={styles.urlBar}>
              <Text style={styles.urlText}>
                https://stocklimp.adarvelimpiezas.net/{activeScreen === 'login' ? 'login' : activeScreen}
              </Text>
            </View>
          </View>

          {/* Screen Content Body */}
          <View style={styles.mockupContent}>
            {activeScreen === 'login' && (
              <View>
                <View style={styles.mockLoginCard}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F766E', textAlign: 'center' }}>
                    STOCKLIMP
                  </Text>
                  <View style={styles.mockInput}>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>Email Corporativo</Text>
                    <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '600' }}>usuario.prueba@stocklimp.com</Text>
                  </View>
                  <View style={styles.mockInput}>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>Contraseña</Text>
                    <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '600' }}>••••••••••••</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="check-square" size={14} color="#0F766E" />
                    <Text style={{ fontSize: 12, color: '#475569' }}>Recordar usuario y contraseña</Text>
                  </View>
                  <View style={styles.mockBtnPrimary}>
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Ingresar</Text>
                  </View>
                </View>

                {/* Annotations */}
                <View style={styles.annotationsRow}>
                  <View style={styles.annotationItem}>
                    <View style={styles.badgeNumber}><Text style={styles.badgeNumberText}>1</Text></View>
                    <View style={styles.annotationTextCol}>
                      <Text style={styles.annotationTitle}>Email y Clave Inicial</Text>
                      <Text style={styles.annotationDesc}>Introduce tu dirección corporativa. La clave inicial es 12345 (puedes cambiarla en Mi Perfil).</Text>
                    </View>
                  </View>
                  <View style={styles.annotationItem}>
                    <View style={styles.badgeNumber}><Text style={styles.badgeNumberText}>2</Text></View>
                    <View style={styles.annotationTextCol}>
                      <Text style={styles.annotationTitle}>Recordar Sesión</Text>
                      <Text style={styles.annotationDesc}>Marca esta casilla para no tener que volver a ingresar tus credenciales en tu teléfono.</Text>
                    </View>
                  </View>
                  <View style={styles.annotationItem}>
                    <View style={styles.badgeNumber}><Text style={styles.badgeNumberText}>3</Text></View>
                    <View style={styles.annotationTextCol}>
                      <Text style={styles.annotationTitle}>Chat Flotante de Recuperación</Text>
                      <Text style={styles.annotationDesc}>Si olvidas tu clave, pulsa el botón del chat inferior para obtener soporte inmediato.</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {activeScreen === 'fichaje' && (
              <View>
                <View style={styles.mockClockCard}>
                  <Text style={{ color: '#CCFBF1', fontSize: 13, fontWeight: '700' }}>
                    Centro: CC RUTA DE LA PLATA (CÁCERES)
                  </Text>
                  <View style={styles.mockClockRing}>
                    <Text style={styles.mockClockTimer}>05:32:14</Text>
                    <Text style={styles.mockClockStatus}>TURNO ACTIVO</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>⏸ Pausar Turno</Text>
                    </View>
                    <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>⏹ Finalizar Turno</Text>
                    </View>
                  </View>
                  <View style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 8 }}>
                    <Text style={{ color: '#99F6E4', fontSize: 11, fontWeight: '700' }}>
                      Objetivo Semanal (40:00:00): Llevas 28:15:00 • Restan 11:45:00
                    </Text>
                  </View>
                </View>

                {/* Annotations */}
                <View style={styles.annotationsRow}>
                  <View style={styles.annotationItem}>
                    <View style={styles.badgeNumber}><Text style={styles.badgeNumberText}>1</Text></View>
                    <View style={styles.annotationTextCol}>
                      <Text style={styles.annotationTitle}>Inicio de Turno</Text>
                      <Text style={styles.annotationDesc}>Pulsa al llegar al centro de trabajo para activar el cronometraje exacto de tu jornada.</Text>
                    </View>
                  </View>
                  <View style={styles.annotationItem}>
                    <View style={styles.badgeNumber}><Text style={styles.badgeNumberText}>2</Text></View>
                    <View style={styles.annotationTextCol}>
                      <Text style={styles.annotationTitle}>Pausas con Justificante</Text>
                      <Text style={styles.annotationDesc}>Al pausar tu turno puedes indicar el motivo (descanso, médico) y adjuntar una foto o justificante en PDF.</Text>
                    </View>
                  </View>
                  <View style={styles.annotationItem}>
                    <View style={styles.badgeNumber}><Text style={styles.badgeNumberText}>3</Text></View>
                    <View style={styles.annotationTextCol}>
                      <Text style={styles.annotationTitle}>Cálculo Semanal Restante</Text>
                      <Text style={styles.annotationDesc}>El sistema computa tus horas desde el lunes y te descuenta en vivo el tiempo restante hasta 40 horas.</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {activeScreen === 'pedidos' && (
              <View>
                <View style={{ backgroundColor: '#CCFBF1', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#5EEAD4' }}>
                  <Text style={{ color: '#0F766E', fontWeight: '700', fontSize: 12 }}>
                    ✓ Periodo Habilitado: Del 2 al 20 de cada mes
                  </Text>
                </View>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontWeight: '700', fontSize: 13, color: '#0F172A' }}>Lejía Concentrada 5L</Text>
                    <Text style={{ color: '#0F766E', fontWeight: '800' }}>[ - ] 4 Uds [ + ]</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontWeight: '700', fontSize: 13, color: '#0F172A' }}>Fregona Industrial Microfibra</Text>
                    <Text style={{ color: '#0F766E', fontWeight: '800' }}>[ - ] 2 Uds [ + ]</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Text style={{ fontWeight: '700', fontSize: 13, color: '#0F172A' }}>Bolsas de Basura 100L Negras</Text>
                    <Text style={{ color: '#0F766E', fontWeight: '800' }}>[ - ] 5 Paq [ + ]</Text>
                  </View>
                </View>

                {/* Annotations */}
                <View style={styles.annotationsRow}>
                  <View style={styles.annotationItem}>
                    <View style={styles.badgeNumber}><Text style={styles.badgeNumberText}>1</Text></View>
                    <View style={styles.annotationTextCol}>
                      <Text style={styles.annotationTitle}>Plazo Estricto (2 al 20)</Text>
                      <Text style={styles.annotationDesc}>Realiza o modifica tus pedidos dentro de esta ventana para garantizar la entrega puntual.</Text>
                    </View>
                  </View>
                  <View style={styles.annotationItem}>
                    <View style={styles.badgeNumber}><Text style={styles.badgeNumberText}>2</Text></View>
                    <View style={styles.annotationTextCol}>
                      <Text style={styles.annotationTitle}>Catálogo con Fotos y Fichas</Text>
                      <Text style={styles.annotationDesc}>Visualiza el producto exacto y descarga su ficha técnica para verificar su uso correcto.</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {activeScreen === 'vacaciones' && (
              <View>
                <View style={styles.mockStatRow}>
                  <View style={[styles.mockStatCard, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>DISPONIBLES</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#065F46' }}>14 Días</Text>
                    <Text style={{ fontSize: 9, color: '#047857' }}>22 días base anuales</Text>
                  </View>
                  <View style={[styles.mockStatCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#F59E0B' }}>PENDIENTES</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#92400E' }}>3 Días</Text>
                    <Text style={{ fontSize: 9, color: '#B45309' }}>En revisión por admin</Text>
                  </View>
                  <View style={[styles.mockStatCard, { backgroundColor: '#E0F2FE', borderColor: '#0EA5E9' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#0EA5E9' }}>ACEPTADOS</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#075985' }}>5 Días</Text>
                    <Text style={{ fontSize: 9, color: '#0369A1' }}>A disfrutar próximamente</Text>
                  </View>
                  <View style={[styles.mockStatCard, { backgroundColor: '#F1F5F9', borderColor: '#64748B' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>DISFRUTADOS</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B' }}>3 Días</Text>
                    <Text style={{ fontSize: 9, color: '#475569' }}>Días ya consumidos</Text>
                  </View>
                </View>

                {/* Annotations */}
                <View style={styles.annotationsRow}>
                  <View style={styles.annotationItem}>
                    <View style={styles.badgeNumber}><Text style={styles.badgeNumberText}>1</Text></View>
                    <View style={styles.annotationTextCol}>
                      <Text style={styles.annotationTitle}>Desglose en 4 Estados</Text>
                      <Text style={styles.annotationDesc}>Consulta en todo momento tus días disponibles, pendientes de aprobar, aceptados y ya disfrutados.</Text>
                    </View>
                  </View>
                  <View style={styles.annotationItem}>
                    <View style={styles.badgeNumber}><Text style={styles.badgeNumberText}>2</Text></View>
                    <View style={styles.annotationTextCol}>
                      <Text style={styles.annotationTitle}>Aprobación por Rol Admin</Text>
                      <Text style={styles.annotationDesc}>Las solicitudes enviadas son validadas directamente por los administradores de la empresa.</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {activeScreen === 'perfil' && (
              <View>
                <View style={{ backgroundColor: '#FFF', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#0F766E', justifyContent: 'center', alignItems: 'center' }}>
                    <Feather name="user" size={24} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>Usuario Prueba</Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>usuario.prueba@stocklimp.com • Operario</Text>
                    <Text style={{ fontSize: 11, color: '#0F766E', fontWeight: '700', marginTop: 2 }}>
                      ✓ Foto guardada permanentemente en servidor
                    </Text>
                  </View>
                </View>

                {/* Annotations */}
                <View style={styles.annotationsRow}>
                  <View style={styles.annotationItem}>
                    <View style={styles.badgeNumber}><Text style={styles.badgeNumberText}>1</Text></View>
                    <View style={styles.annotationTextCol}>
                      <Text style={styles.annotationTitle}>Foto de Perfil Persistente</Text>
                      <Text style={styles.annotationDesc}>Sube tu foto desde el móvil o PC; se almacena de forma permanente y no se perderá al cerrar sesión.</Text>
                    </View>
                  </View>
                  <View style={styles.annotationItem}>
                    <View style={styles.badgeNumber}><Text style={styles.badgeNumberText}>2</Text></View>
                    <View style={styles.annotationTextCol}>
                      <Text style={styles.annotationTitle}>Actualización de Clave</Text>
                      <Text style={styles.annotationDesc}>Cambia tu contraseña temporal por una personal y segura en cualquier momento.</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            Adarve Limpiezas S.L. • Manual Oficial StockLimp v2.0 • Edición Ilustrada 2026
          </Text>
          <TouchableOpacity onPress={handleDownload} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="arrow-down" size={14} color="#0F766E" />
            <Text style={{ fontSize: 13, color: '#0F766E', fontWeight: '700' }}>
              Descargar Manual de Usuario
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
