import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { styles } from '../../css/DownloadsView.styles';

interface DownloadsViewProps {
  baseUrl: string;
  userRole?: string;
}

type RoleType = 'operario' | 'admin' | 'super_admin';

interface RoleManualConfig {
  role: RoleType;
  roleBadge: string;
  title: string;
  subtitle: string;
  filename: string;
  pagesCount: string;
  highlights: string[];
  screens: {
    id: string;
    label: string;
    icon: keyof typeof Feather.glyphMap;
    screenTitle: string;
    screenUrl: string;
    annotations: { num: string; title: string; desc: string }[];
  }[];
}

const ROLE_MANUALS: Record<RoleType, RoleManualConfig> = {
  operario: {
    role: 'operario',
    roleBadge: 'ROL OPERARIO',
    title: 'Manual de Usuario — Rol Operario',
    subtitle:
      'Guía oficial adaptada a tus permisos: control horario en vivo, registro de pausas justificadas con foto/PDF, seguimiento de la meta semanal de 40 horas, realización de pedidos de limpieza (del 2 al 20) y consulta del desglose de tus vacaciones.',
    filename: 'Manual_Usuario_Operario.pdf',
    pagesCount: '4 Páginas',
    highlights: ['Control Horario 40h', 'Pausas con Justificante', 'Pedidos Mensuales (2 al 20)', 'Vacaciones en 4 Estados', 'Foto Permanente'],
    screens: [
      {
        id: 'fichaje',
        label: '1. Fichaje en Vivo',
        icon: 'clock',
        screenTitle: 'Control Horario y Meta Semanal de 40h',
        screenUrl: 'https://stocklimp.adarvelimpiezas.net/fichaje',
        annotations: [
          {
            num: '1',
            title: 'Inicio de Turno con Centro',
            desc: 'Al llegar a tu puesto de trabajo pulsa "Iniciar Turno" marcando el centro correspondiente.',
          },
          {
            num: '2',
            title: 'Meta Semanal de 40 Horas',
            desc: 'El velocímetro calcula de lunes a domingo las horas realizadas y resta en vivo las horas pendientes.',
          },
        ],
      },
      {
        id: 'pausas',
        label: '2. Pausas Justificadas',
        icon: 'pause-circle',
        screenTitle: 'Registro de Pausas con Justificante',
        screenUrl: 'https://stocklimp.adarvelimpiezas.net/fichaje#pausa',
        annotations: [
          {
            num: '1',
            title: 'Motivo y Comentario',
            desc: 'Indica la causa de tu pausa (almuerzo, consulta médica, desplazamiento o descanso legal).',
          },
          {
            num: '2',
            title: 'Subida de Justificante',
            desc: 'Ahora puedes adjuntar un archivo (foto o documento PDF) directamente desde tu teléfono o PC.',
          },
        ],
      },
      {
        id: 'pedidos',
        label: '3. Pedidos (2 al 20)',
        icon: 'shopping-bag',
        screenTitle: 'Catálogo de Suministros y Pedidos Mensuales',
        screenUrl: 'https://stocklimp.adarvelimpiezas.net/pedidos',
        annotations: [
          {
            num: '1',
            title: 'Ventana Mensual del 2 al 20',
            desc: 'Los pedidos deben realizarse dentro de este plazo para coordinar el reparto a tus centros.',
          },
          {
            num: '2',
            title: 'Selección de Unidades',
            desc: 'Escoge los productos estándar con sus fotos reales y ajusta las unidades necesarias.',
          },
        ],
      },
      {
        id: 'vacaciones',
        label: '4. Saldo Vacaciones',
        icon: 'sun',
        screenTitle: 'Consulta de Días en 4 Estados',
        screenUrl: 'https://stocklimp.adarvelimpiezas.net/fichaje#vacaciones',
        annotations: [
          {
            num: '1',
            title: '4 Estados en Tiempo Real',
            desc: 'Disponibles (22 base anuales), Pendientes de revisión, Aceptados y ya Disfrutados.',
          },
          {
            num: '2',
            title: 'Aprobación por Admin',
            desc: 'Tus peticiones son revisadas y validadas directamente por los administradores de la empresa.',
          },
        ],
      },
      {
        id: 'perfil',
        label: '5. Mi Perfil',
        icon: 'user',
        screenTitle: 'Foto de Usuario y Datos Personales',
        screenUrl: 'https://stocklimp.adarvelimpiezas.net/perfil',
        annotations: [
          {
            num: '1',
            title: 'Foto Permanente',
            desc: 'La foto de perfil que subas se almacena en el servidor y no se pierde al cerrar sesión.',
          },
          {
            num: '2',
            title: 'Cambio de Clave',
            desc: 'Actualiza tu clave temporal inicial (12345) por una contraseña personal y segura.',
          },
        ],
      },
    ],
  },

  admin: {
    role: 'admin',
    roleBadge: 'ROL ADMINISTRADOR',
    title: 'Manual de Usuario — Rol Administrador',
    subtitle:
      'Guía oficial para administradores: alta directa de operarios (activación inmediata sin validación de super admin), validación y aprobación de vacaciones de los empleados, control y cambio de estado de pedidos, mantenimiento de centros y analítica de consumo.',
    filename: 'Manual_Usuario_Admin.pdf',
    pagesCount: '4 Páginas',
    highlights: ['Alta Directa sin Super Admin', 'Aprobación de Vacaciones', 'Supervisión de Pedidos', 'Centros y Fichas', 'Analítica de Consumo'],
    screens: [
      {
        id: 'alta_directa',
        label: '1. Alta Directa',
        icon: 'user-plus',
        screenTitle: 'Creación Directa de Trabajadores Activos',
        screenUrl: 'https://stocklimp.adarvelimpiezas.net/alta',
        annotations: [
          {
            num: '1',
            title: 'Activación Inmediata',
            desc: 'Como Administrador creas al trabajador en estado ACTIVO directamente, sin requerir validación previa de super_admin.',
          },
          {
            num: '2',
            title: 'Clave Temporal Automática',
            desc: 'El usuario queda listo para acceder con su email y la clave temporal estándar 12345.',
          },
        ],
      },
      {
        id: 'vacaciones_admin',
        label: '2. Aprobación Vacaciones',
        icon: 'check-circle',
        screenTitle: 'Validación de Solicitudes de Personal',
        screenUrl: 'https://stocklimp.adarvelimpiezas.net/vacaciones',
        annotations: [
          {
            num: '1',
            title: 'Aprobación de Días',
            desc: 'Revisa las peticiones enviadas por los operarios y apruébalas o recházalas con un clic.',
          },
          {
            num: '2',
            title: 'Actualización Inmediata de Saldo',
            desc: 'Al aceptar la solicitud, los días pasan automáticamente al estado "Aceptados" en el panel del trabajador.',
          },
        ],
      },
      {
        id: 'pedidos_admin',
        label: '3. Control de Pedidos',
        icon: 'file-text',
        screenTitle: 'Gestión de Pedidos de los Centros',
        screenUrl: 'https://stocklimp.adarvelimpiezas.net/pedidos#admin',
        annotations: [
          {
            num: '1',
            title: 'Supervisión Mensual',
            desc: 'Revisa las cantidades pedidas por cada operario para sus centros antes del día 20.',
          },
          {
            num: '2',
            title: 'Cambio de Estado',
            desc: 'Actualiza el estado a "Aprobado", "En preparación" o "Entregado" para coordinar almacén.',
          },
        ],
      },
      {
        id: 'centros_admin',
        label: '4. Centros y Catálogo',
        icon: 'book-open',
        screenTitle: 'Mantenimiento de Centros y Productos',
        screenUrl: 'https://stocklimp.adarvelimpiezas.net/centros',
        annotations: [
          {
            num: '1',
            title: 'Centros de Trabajo',
            desc: 'Crea nuevas ubicaciones y define si son atendidas por uno o varios operarios (multicentro).',
          },
          {
            num: '2',
            title: 'Fichas Técnicas (FDS)',
            desc: 'Sube y actualiza las fichas de seguridad de cada producto de limpieza.',
          },
        ],
      },
      {
        id: 'analitica_admin',
        label: '5. Analítica',
        icon: 'bar-chart-2',
        screenTitle: 'Informes de Consumo y Fichajes',
        screenUrl: 'https://stocklimp.adarvelimpiezas.net/analitica',
        annotations: [
          {
            num: '1',
            title: 'Gráficos Comparativos',
            desc: 'Consulta la evolución mensual del gasto en suministros entre 2025 y 2026.',
          },
          {
            num: '2',
            title: 'Exportación a PDF',
            desc: 'Genera balances imprimibles de consumo para la dirección de la empresa.',
          },
        ],
      },
    ],
  },

  super_admin: {
    role: 'super_admin',
    roleBadge: 'ROL SUPER ADMIN',
    title: 'Manual de Usuario — Rol Super Administrador',
    subtitle:
      'Guía maestra de gobernanza y control global: Panel de Control (ControlPanelView), auditoría de roles y permisos, control de base de datos MySQL, métricas de servidores y supervisión general de la suite StockLimp.',
    filename: 'Manual_Usuario_SuperAdmin.pdf',
    pagesCount: '3 Páginas',
    highlights: ['Panel de Control Maestro', 'Auditoría Global de Roles', 'Métricas de Servidor', 'Base de Datos MySQL', 'Gobernanza Total'],
    screens: [
      {
        id: 'control_maestro',
        label: '1. Panel Maestro',
        icon: 'grid',
        screenTitle: 'ControlPanelView y Estado del Servidor',
        screenUrl: 'https://stocklimp.adarvelimpiezas.net/control',
        annotations: [
          {
            num: '1',
            title: 'Monitor de Infraestructura',
            desc: 'Supervisión en tiempo real de la base de datos MySQL, endpoints API y servicios locales/cloud.',
          },
          {
            num: '2',
            title: 'Métricas Globales',
            desc: 'Total de cuentas registradas, centros operativos y volumen mensual de fichajes.',
          },
        ],
      },
      {
        id: 'roles_permisos',
        label: '2. Gestión de Roles',
        icon: 'shield',
        screenTitle: 'Auditoría de Roles y Permisos',
        screenUrl: 'https://stocklimp.adarvelimpiezas.net/control#roles',
        annotations: [
          {
            num: '1',
            title: 'Jerarquía de Usuarios',
            desc: 'Asignación de roles super_admin, admin y operarios con auditoría de accesos.',
          },
          {
            num: '2',
            title: 'Seguridad de Sesiones',
            desc: 'Gestión de tokens Bearer de autenticación y claves seguras en servidor.',
          },
        ],
      },
      {
        id: 'mantenimiento',
        label: '3. Mantenimiento',
        icon: 'server',
        screenTitle: 'Backups, Migraciones y Comandos',
        screenUrl: 'https://stocklimp.adarvelimpiezas.net/control#sistema',
        annotations: [
          {
            num: '1',
            title: 'Mantenimiento del Backend',
            desc: 'Comandos oficiales para Laravel (artisan serve, migrate, seed) y gestión de subidas.',
          },
          {
            num: '2',
            title: 'Persistencia de Archivos',
            desc: 'Rutas seguras para fotos de perfil, justificantes de pausas y manuales en PDF.',
          },
        ],
      },
    ],
  },
};

export default function DownloadsView({ baseUrl, userRole = 'operario' }: DownloadsViewProps) {
  // Normalize current user role
  const initialRole: RoleType =
    userRole === 'super_admin' ? 'super_admin' : userRole === 'admin' ? 'admin' : 'operario';

  // Selected manual role (defaults to the logged-in user's role)
  const [selectedRole, setSelectedRole] = useState<RoleType>(initialRole);

  const activeConfig = ROLE_MANUALS[selectedRole] || ROLE_MANUALS.operario;
  const [activeScreenId, setActiveScreenId] = useState<string>(activeConfig.screens[0]?.id || 'fichaje');

  // If role changes, reset screen to first
  const handleRoleChange = (newRole: RoleType) => {
    setSelectedRole(newRole);
    setActiveScreenId(ROLE_MANUALS[newRole].screens[0]?.id || '');
  };

  const activeScreen = activeConfig.screens.find((s) => s.id === activeScreenId) || activeConfig.screens[0];

  const [showAppleModal, setShowAppleModal] = useState<boolean>(false);
  const [androidDownloadStarted, setAndroidDownloadStarted] = useState<boolean>(false);

  const getManualUrl = (filename: string) => {
    if (Platform.OS === 'web') {
      return `/downloads/${filename}`;
    }
    return `${baseUrl.replace('/api', '')}/downloads/${filename}`;
  };

  const handleDownload = () => {
    const url = getManualUrl(activeConfig.filename);
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = url;
      a.download = activeConfig.filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      Linking.openURL(url);
    }
  };

  const handlePreview = () => {
    const url = getManualUrl(activeConfig.filename);
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

  const isPrivilegedUser = initialRole === 'admin' || initialRole === 'super_admin';

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
                Manuales oficiales adaptados a los permisos de cada rol y acceso a la app móvil.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Role Selector Card (For Admin & Super Admin to consult/download any role's manual) */}
      {isPrivilegedUser && (
        <View style={styles.roleSelectorCard}>
          <Text style={styles.roleSelectorLabel}>Manual adaptado según rol:</Text>
          <View style={styles.roleSelectorPills}>
            <TouchableOpacity
              style={[styles.rolePillBtn, selectedRole === 'operario' && styles.rolePillBtnActive]}
              onPress={() => handleRoleChange('operario')}
            >
              <Text style={[styles.rolePillBtnText, selectedRole === 'operario' && styles.rolePillBtnTextActive]}>
                Operario
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rolePillBtn, selectedRole === 'admin' && styles.rolePillBtnActive]}
              onPress={() => handleRoleChange('admin')}
            >
              <Text style={[styles.rolePillBtnText, selectedRole === 'admin' && styles.rolePillBtnTextActive]}>
                Administrador
              </Text>
            </TouchableOpacity>

            {initialRole === 'super_admin' && (
              <TouchableOpacity
                style={[styles.rolePillBtn, selectedRole === 'super_admin' && styles.rolePillBtnActive]}
                onPress={() => handleRoleChange('super_admin')}
              >
                <Text style={[styles.rolePillBtnText, selectedRole === 'super_admin' && styles.rolePillBtnTextActive]}>
                  Super Admin
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Dynamic Role Manual Hero Card */}
      <View style={styles.manualHeroCard}>
        <View style={styles.heroContentRow}>
          <View style={styles.pdfIconLargeBg}>
            <Feather name="file-text" size={38} color="#99F6E4" />
          </View>

          <View style={styles.heroDetails}>
            <View style={styles.badgeRow}>
              <View style={styles.badgeOfficial}>
                <Text style={styles.badgeOfficialText}>{activeConfig.roleBadge}</Text>
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{activeConfig.pagesCount}</Text>
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>PDF Ilustrado</Text>
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>Permisos Oficiales</Text>
              </View>
            </View>

            <Text style={styles.manualTitle}>{activeConfig.title}</Text>
            <Text style={styles.manualSubtitle}>{activeConfig.subtitle}</Text>

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Image
              source={require('@/assets/images/favicon.png')}
              style={{
                width: 58,
                height: 58,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: '#2DD4BF',
              }}
            />
            <View style={{ flex: 1 }}>
              <View style={styles.mobileAppsBadge}>
                <Text style={styles.mobileAppsBadgeText}>APP MÓVIL DISPONIBLE</Text>
              </View>
              <Text style={styles.mobileAppsTitle}>Descarga la App de StockLimp en tu Móvil</Text>
              <Text style={styles.mobileAppsSub}>
                Lleva el control de tus turnos, realiza pausas justificadas con cámara y gestiona pedidos mensuales directamente desde tu teléfono smartphone.
              </Text>
            </View>
          </View>
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
            <View style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' }}>
              <Image
                source={require('@/assets/images/favicon.png')}
                style={{ width: '100%', height: '100%' }}
              />
            </View>
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
            <View style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' }}>
              <Image
                source={require('@/assets/images/favicon.png')}
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          </TouchableOpacity>
        </View>

        {androidDownloadStarted && (
          <View style={{ marginTop: 14, backgroundColor: 'rgba(61, 220, 132, 0.15)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#3DDC84', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image
              source={require('@/assets/images/favicon.png')}
              style={{ width: 24, height: 24, borderRadius: 6 }}
            />
            <Text style={{ color: '#CCFBF1', fontSize: 13, fontWeight: '700' }}>
              ✓ Descargando StockLimp.apk con el icono oficial de la web.
            </Text>
          </View>
        )}
      </View>

      {/* Interactive Screenshot Walkthrough Gallery Tailored to the Selected Role */}
      <View style={styles.screenshotsContainer}>
        <View style={styles.screenshotsHeader}>
          <View>
            <Text style={styles.screenshotsTitle}>
              📸 Capturas del {activeConfig.title}
            </Text>
            <Text style={styles.screenshotsSub}>
              Módulos y pantallas disponibles según los permisos de este rol:
            </Text>
          </View>
        </View>

        {/* Tabs for active role */}
        <View style={styles.tabsRow}>
          {activeConfig.screens.map((screen) => {
            const isActive = activeScreenId === screen.id;
            return (
              <TouchableOpacity
                key={screen.id}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveScreenId(screen.id)}
              >
                <Feather name={screen.icon} size={15} color={isActive ? '#FFF' : '#0F766E'} />
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                  {screen.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mockup Frame displaying active screen */}
        {activeScreen && (
          <View style={styles.mockupFrame}>
            <View style={styles.mockupChrome}>
              <View style={styles.windowDots}>
                <View style={styles.dotRed} />
                <View style={styles.dotYellow} />
                <View style={styles.dotGreen} />
              </View>
              <View style={styles.urlBar}>
                <Text style={styles.urlText}>{activeScreen.screenUrl}</Text>
              </View>
            </View>

            <View style={styles.mockupContent}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 }}>
                {activeScreen.screenTitle}
              </Text>

              {/* Explanatory Step Annotations */}
              <View style={styles.annotationsRow}>
                {activeScreen.annotations.map((ann, idx) => (
                  <View key={idx} style={styles.annotationItem}>
                    <View style={styles.badgeNumber}>
                      <Text style={styles.badgeNumberText}>{ann.num}</Text>
                    </View>
                    <View style={styles.annotationTextCol}>
                      <Text style={styles.annotationTitle}>{ann.title}</Text>
                      <Text style={styles.annotationDesc}>{ann.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            Adarve Limpiezas S.L. • {activeConfig.filename} • Edición Oficial 2026
          </Text>
          <TouchableOpacity onPress={handleDownload} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="arrow-down" size={14} color="#0F766E" />
            <Text style={{ fontSize: 13, color: '#0F766E', fontWeight: '700' }}>
              Descargar Manual de Usuario ({activeConfig.roleBadge})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Apple App Installation Modal */}
      {showAppleModal && (
        <View style={styles.appleModalOverlay}>
          <View style={styles.appleModalCard}>
            <View style={styles.appleModalHeader}>
              <View style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#2DD4BF' }}>
                <Image
                  source={require('@/assets/images/favicon.png')}
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.appleModalTitle}>StockLimp para Apple iOS</Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>Instalación con el icono oficial en iPhone y iPad</Text>
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
    </View>
  );
}
