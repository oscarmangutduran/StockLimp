import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome, FontAwesome6 } from '@expo/vector-icons';

// Import dashboard views
import ProductsView from '@/components/dashboard/ProductsView';
import OrdersView from '@/components/dashboard/OrdersView';
import CentersView from '@/components/dashboard/CentersView';
import ApproveUsersView from '@/components/dashboard/ApproveUsersView';
import ControlPanelView from '@/components/dashboard/ControlPanelView';
import AnalyticsView from '@/components/dashboard/AnalyticsView';
import ProfileView from '@/components/dashboard/ProfileView';
import TimeTrackingView from '@/components/dashboard/TimeTrackingView';
import VacationsAdminView from '@/components/dashboard/VacationsAdminView';
import DownloadsView from '@/components/dashboard/DownloadsView';
import { styles } from '../css/index.styles';

const cleaningWorkerImg = require('../images/equipo.jpg');

const PROD_URL = 'https://stocklimp-backend.onrender.com/api';
const DEV_URL = Platform.OS === 'web' ? 'http://localhost:8000/api' : 'http://10.0.2.2:8000/api';
const BASE_URL = __DEV__ ? DEV_URL : PROD_URL;

type TabType = 'productos' | 'pedidos' | 'centros' | 'alta' | 'control' | 'analitica' | 'perfil' | 'fichaje' | 'vacaciones' | 'descargas';

export function HomeScreen({ initialTab }: { initialTab?: TabType } = {}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { width, height } = useWindowDimensions();
  const isDesktop = mounted && Platform.OS === 'web' && width >= 1024;
  const isCompactMenu = height < 760 || width < 1200;
  const isVeryShort = height < 620;

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [solicitaRestablecimiento, setSolicitaRestablecimiento] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // AI Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{text: string, isUser: boolean}[]>([
    { text: "¡Hola! Soy el asistente IA de StockLimp. ¿En qué puedo ayudarte hoy?", isUser: false }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = React.useRef<ScrollView>(null);
  
  // App states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Simulated login for local testing or backend integration
  const [user, setUser] = useState<any | null>(null);
  
  // Active dashboard tab
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'centros');
  
  // Mobile sidebar menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to '/centros' if logged in and on the root path '/'
  useEffect(() => {
    if (user && !initialTab) {
      if (user.rol === 'super_admin' || user.rol === 'admin') {
        router.replace('/centros');
      } else {
        router.replace('/pedidos');
      }
    }
  }, [user, initialTab]);

  // Restore session from sessionStorage on mount and remembered credentials from localStorage (Web only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const savedUser = sessionStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          if (!initialTab) {
            setActiveTab(parsed.rol === 'super_admin' || parsed.rol === 'admin' ? 'centros' : 'pedidos');
          }
          const savedToken = sessionStorage.getItem('token') || parsed.token;
          if (savedToken) {
            fetch(`${BASE_URL}/usuarios/me`, {
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${savedToken}`,
              },
            })
              .then((res) => (res.ok ? res.json() : null))
              .then((meData) => {
                if (meData && meData.success && meData.user) {
                  const refreshed = { ...parsed, ...meData.user, token: savedToken };
                  setUser(refreshed);
                  sessionStorage.setItem('user', JSON.stringify(refreshed));
                }
              })
              .catch(() => {});
          }
        }
      } catch (e) {
        console.error('Error restoring session from sessionStorage:', e);
      }

      try {
        const savedCreds = localStorage.getItem('stocklimp_remember_creds');
        if (savedCreds) {
          const parsed = JSON.parse(savedCreds);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.password) setPassword(parsed.password);
          setRememberMe(true);
        }
      } catch (e) {
        console.error('Error restoring credentials from localStorage:', e);
      }
    }
  }, []);

  // Clear chat after 2 minutes of inactivity
  useEffect(() => {
    if (chatMessages.length > 1) {
      const timer = setTimeout(() => {
        setChatMessages([
          { text: "¡Hola! Soy el asistente IA de StockLimp. ¿En qué puedo ayudarte hoy?", isUser: false }
        ]);
        setChatOpen(false);
      }, 120000);
      return () => clearTimeout(timer);
    }
  }, [chatMessages]);

  const handleToggleRememberMe = () => {
    const nextVal = !rememberMe;
    setRememberMe(nextVal);
    if (!nextVal && Platform.OS === 'web') {
      try {
        localStorage.removeItem('stocklimp_remember_creds');
      } catch (e) {
        console.error('Error removing credentials from localStorage:', e);
      }
    }
  };

  const saveUserSession = (userData: any, token?: string) => {
    setUser((prevUser: any) => {
      const preservedToken = token || userData.token || prevUser?.token;
      const mergedUser = {
        ...(prevUser || {}),
        ...userData,
        ...(preservedToken ? { token: preservedToken } : {}),
      };
      if (Platform.OS === 'web') {
        try {
          sessionStorage.setItem('user', JSON.stringify(mergedUser));
          if (preservedToken) {
            sessionStorage.setItem('token', preservedToken);
          }
          if (rememberMe && email && password) {
            localStorage.setItem('stocklimp_remember_creds', JSON.stringify({ email, password }));
          } else if (!rememberMe) {
            localStorage.removeItem('stocklimp_remember_creds');
          }
        } catch (e) {
          console.error('Error saving session to sessionStorage / localStorage:', e);
        }
      }
      return mergedUser;
    });
    if (!initialTab) {
      setActiveTab(userData.rol === 'super_admin' || userData.rol === 'admin' ? 'centros' : 'pedidos');
    }
  };

  const changeTab = (newTab: TabType) => {
    setActiveTab(newTab);
    if (Platform.OS === 'web') {
      try {
        window.history.replaceState(null, '', `/${newTab}`);
      } catch (e) {
        console.error('Error updating URL history:', e);
      }
    }
  };

  const handleSendChat = async (presetText?: string) => {
    const textToSend = (typeof presetText === 'string' ? presetText : chatInput).trim();
    if (!textToSend || chatLoading) return;

    const historyPayload = chatMessages.slice(1).slice(-6).map((m) => ({
      role: m.isUser ? 'user' : 'model',
      text: m.text,
    }));

    const newUserMsg = { text: textToSend, isUser: true };
    setChatMessages((prev) => [...prev, newUserMsg]);
    if (typeof presetText !== 'string') setChatInput('');
    setChatLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // En Web usamos streaming SSE para mostrar la respuesta conforme se genera
      if (Platform.OS === 'web') {
        const streamRes = await fetch(`${BASE_URL}/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
          body: JSON.stringify({
            message: textToSend,
            history: historyPayload,
          }),
          signal: controller.signal,
        });

        if (streamRes.ok && streamRes.body) {
          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let sseBuffer = '';
          let botBubbleCreated = false;
          let streamError: string | null = null;

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split('\n');
            sseBuffer = lines.pop() || '';

            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line.startsWith('data:')) continue;
              const jsonStr = line.slice(5).trim();
              if (!jsonStr) continue;

              try {
                const evt = JSON.parse(jsonStr);
                if (evt.chunk) {
                  if (!botBubbleCreated) {
                    botBubbleCreated = true;
                    setChatMessages((prev) => [...prev, { text: evt.chunk, isUser: false }]);
                  } else {
                    setChatMessages((prev) => {
                      const updated = [...prev];
                      const lastIdx = updated.length - 1;
                      if (lastIdx >= 0 && !updated[lastIdx].isUser) {
                        updated[lastIdx] = { ...updated[lastIdx], text: updated[lastIdx].text + evt.chunk };
                      }
                      return updated;
                    });
                  }
                } else if (evt.error) {
                  streamError = evt.error;
                }
              } catch {
                // Ignorar líneas incompletas
              }
            }
          }

          clearTimeout(timeoutId);
          if (!botBubbleCreated) {
            setChatMessages((prev) => [
              ...prev,
              { text: streamError || 'No se pudo obtener respuesta del asistente IA.', isUser: false },
            ]);
          }
          return;
        }
      }

      // Fallback JSON rápido (Android / iOS o si no hay stream)
      const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const rawText = await response.text();
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { message: 'Respuesta no válida del servidor.' };
      }

      if (response.ok && data.success && data.reply) {
        setChatMessages((prev) => [...prev, { text: data.reply, isUser: false }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { text: data.message || 'No se pudo obtener respuesta del asistente IA.', isUser: false },
        ]);
      }
    } catch (err: any) {
      console.error('Error en chat IA:', err);
      const isTimeout = err?.name === 'AbortError';
      setChatMessages((prev) => [
        ...prev,
        {
          text: isTimeout
            ? 'El asistente tardó demasiado en responder. Inténtalo de nuevo.'
            : 'Error de conexión con el servidor del asistente IA. Asegúrate de que el backend esté encendido en http://localhost:8000.',
          isUser: false,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (solicitaRestablecimiento) {
        await fetch(`${BASE_URL}/usuarios/solicitar-restablecimiento`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
      }

      const response = await fetch(`${BASE_URL}/usuarios/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        saveUserSession(data.user, data.token || data.access_token);
      } else {
        setError(data.message || 'Las credenciales no coinciden.');
      }
    } catch (err) {
      console.log('Error authenticating, checking local mock credentials:', err);
      // Backdoors for offline testing
      if (email === 'oscar@stocklimp.com' && password === 'admin123') {
        saveUserSession({
          id_user: 1,
          nombre: 'Oscar Mangut',
          email: 'oscar@stocklimp.com',
          rol: 'super_admin',
        });
      } else if (email === 'admin@stocklimp.com' && password === 'admin123') {
        saveUserSession({
          id_user: 2,
          nombre: 'Admin Pruebas',
          email: 'admin@stocklimp.com',
          rol: 'admin',
        });
      } else {
        setError('No se pudo conectar con el servidor. Usa oscar@stocklimp.com o admin@stocklimp.com con clave admin123.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSolicitaRestablecimiento(false);
    setActiveTab('centros');
    setMobileMenuOpen(false);
    if (Platform.OS === 'web') {
      try {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        const savedCreds = localStorage.getItem('stocklimp_remember_creds');
        if (savedCreds) {
          const parsed = JSON.parse(savedCreds);
          setEmail(parsed.email || '');
          setPassword(parsed.password || '');
          setRememberMe(true);
        } else {
          setEmail('');
          setPassword('');
          setRememberMe(false);
        }
      } catch (e) {
        console.error('Error clearing session from sessionStorage:', e);
        setEmail('');
        setPassword('');
        setRememberMe(false);
      }
    } else {
      setEmail('');
      setPassword('');
      setRememberMe(false);
    }
    router.replace({
      pathname: '/',
    });
  };

  // If logged in, render the admin dashboard layout
  if (user) {
    const renderContent = () => {
      switch (activeTab) {
        case 'productos':
          return <ProductsView baseUrl={BASE_URL} />;
        case 'pedidos':
          return <OrdersView baseUrl={BASE_URL} userRole={user.rol} userId={user.id_user} idCentro={user.id_centro} currentUser={user} />;
        case 'centros':
          return <CentersView baseUrl={BASE_URL} />;
        case 'alta':
          return <ApproveUsersView baseUrl={BASE_URL} userRole={user.rol} />;
        case 'control':
          return (user.rol === 'super_admin' || user.rol === 'admin') ? (
            <ControlPanelView baseUrl={BASE_URL} currentUser={user} />
          ) : (
            <CentersView baseUrl={BASE_URL} />
          );
        case 'analitica':
          return <AnalyticsView baseUrl={BASE_URL} />;
        case 'perfil':
          return <ProfileView baseUrl={BASE_URL} user={user} onUpdateUser={saveUserSession} />;
        case 'fichaje':
          return <TimeTrackingView baseUrl={BASE_URL} userId={user.id_user} />;
        case 'vacaciones':
          return <VacationsAdminView baseUrl={BASE_URL} userId={user.id_user} />;
        case 'descargas':
          return <DownloadsView baseUrl={BASE_URL} userRole={user.rol} />;
        default:
          return <CentersView baseUrl={BASE_URL} />;
      }
    };

    const menuIconSize = isCompactMenu ? 16 : 18;
    const compactItemStyle = isCompactMenu
      ? { paddingVertical: isVeryShort ? 7 : 9, paddingHorizontal: 16, gap: 10 }
      : undefined;
    const compactTextStyle = isCompactMenu ? { fontSize: 13 } : undefined;

    const sidebarView = (
      <View
        style={[
          styles.sidebar,
          isCompactMenu && {
            paddingVertical: isVeryShort ? 10 : 14,
            width: isDesktop && width < 1200 ? 210 : 240,
          },
        ]}
      >
        {/* Profile Header */}
        <TouchableOpacity
          style={[
            styles.profileHeader,
            { justifyContent: 'space-between', alignItems: 'center' },
            isCompactMenu && { marginBottom: isVeryShort ? 8 : 14, paddingHorizontal: 16 },
          ]}
          onPress={() => {
            changeTab('perfil');
            setMobileMenuOpen(false);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            {user.foto_perfil ? (
              <Image
                source={{
                  uri: user.foto_perfil.startsWith('http')
                    ? user.foto_perfil
                    : `${BASE_URL.replace('/api', '')}${user.foto_perfil}`
                }}
                style={[styles.profileAvatar, isCompactMenu && { width: 34, height: 34, borderRadius: 17 }]}
              />
            ) : (
              <View style={[styles.profileIconBg, isCompactMenu && { width: 34, height: 34, borderRadius: 17 }]}>
                <Feather name="user" size={isCompactMenu ? 17 : 20} color="#64748B" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, isCompactMenu && { fontSize: 14 }]} numberOfLines={1}>
                {user.nombre}
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: isCompactMenu ? 10 : 11 }} numberOfLines={1}>
                Ver / Editar Perfil
              </Text>
            </View>
          </View>
          {!isDesktop && (
            <TouchableOpacity onPress={() => setMobileMenuOpen(false)} style={{ padding: 4 }}>
              <Feather name="x" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Navigation Items */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.menuList, { flex: 0 }, isCompactMenu && { gap: 2 }]}
          showsVerticalScrollIndicator={false}
        >
          {(user.rol === 'super_admin' || user.rol === 'admin') && (
            <TouchableOpacity
              style={[styles.menuItem, compactItemStyle, activeTab === 'productos' && styles.menuItemActive]}
              onPress={() => {
                changeTab('productos');
                setMobileMenuOpen(false);
              }}
            >
              {activeTab === 'productos' && <View style={styles.activeBar} />}
              <Feather name="box" size={menuIconSize} color={activeTab === 'productos' ? '#F97316' : '#94A3B8'} />
              <Text style={[styles.menuItemText, compactTextStyle, activeTab === 'productos' && styles.menuItemTextActive]}>
                Productos
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.menuItem, compactItemStyle, activeTab === 'pedidos' && styles.menuItemActive]}
            onPress={() => {
              changeTab('pedidos');
              setMobileMenuOpen(false);
            }}
          >
            {activeTab === 'pedidos' && <View style={styles.activeBar} />}
            <Feather name="file-text" size={menuIconSize} color={activeTab === 'pedidos' ? '#F97316' : '#94A3B8'} />
            <Text style={[styles.menuItemText, compactTextStyle, activeTab === 'pedidos' && styles.menuItemTextActive]}>
              Pedidos
            </Text>
          </TouchableOpacity>

          {(user.rol === 'super_admin' || user.rol === 'admin') && (
            <TouchableOpacity
              style={[styles.menuItem, compactItemStyle, activeTab === 'centros' && styles.menuItemActive]}
              onPress={() => {
                changeTab('centros');
                setMobileMenuOpen(false);
              }}
            >
              {activeTab === 'centros' && <View style={styles.activeBar} />}
              <Feather name="book-open" size={menuIconSize} color={activeTab === 'centros' ? '#F97316' : '#94A3B8'} />
              <Text style={[styles.menuItemText, compactTextStyle, activeTab === 'centros' && styles.menuItemTextActive]}>
                Centros
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.menuItem, compactItemStyle, activeTab === 'fichaje' && styles.menuItemActive]}
            onPress={() => {
              changeTab('fichaje');
              setMobileMenuOpen(false);
            }}
          >
            {activeTab === 'fichaje' && <View style={styles.activeBar} />}
            <Feather name="clock" size={menuIconSize} color={activeTab === 'fichaje' ? '#F97316' : '#94A3B8'} />
            <Text style={[styles.menuItemText, compactTextStyle, activeTab === 'fichaje' && styles.menuItemTextActive]}>
              Control Horario
            </Text>
          </TouchableOpacity>

          {(user.rol === 'super_admin' || user.rol === 'admin') && (
            <TouchableOpacity
              style={[styles.menuItem, compactItemStyle, activeTab === 'alta' && styles.menuItemActive]}
              onPress={() => {
                changeTab('alta');
                setMobileMenuOpen(false);
              }}
            >
              {activeTab === 'alta' && <View style={styles.activeBar} />}
              <Feather name="user-plus" size={menuIconSize} color={activeTab === 'alta' ? '#F97316' : '#94A3B8'} />
              <Text style={[styles.menuItemText, compactTextStyle, activeTab === 'alta' && styles.menuItemTextActive]}>
                Dar de alta
              </Text>
            </TouchableOpacity>
          )}

          {(user.rol === 'super_admin' || user.rol === 'admin') && (
            <TouchableOpacity
              style={[styles.menuItem, compactItemStyle, activeTab === 'control' && styles.menuItemActive]}
              onPress={() => {
                changeTab('control');
                setMobileMenuOpen(false);
              }}
            >
              {activeTab === 'control' && <View style={styles.activeBar} />}
              <Feather name="grid" size={menuIconSize} color={activeTab === 'control' ? '#F97316' : '#94A3B8'} />
              <Text style={[styles.menuItemText, compactTextStyle, activeTab === 'control' && styles.menuItemTextActive]}>
                Control
              </Text>
            </TouchableOpacity>
          )}

          {(user.rol === 'super_admin' || user.rol === 'admin') && (
            <TouchableOpacity
              style={[styles.menuItem, compactItemStyle, activeTab === 'vacaciones' && styles.menuItemActive]}
              onPress={() => {
                changeTab('vacaciones');
                setMobileMenuOpen(false);
              }}
            >
              {activeTab === 'vacaciones' && <View style={styles.activeBar} />}
              <Feather name="sun" size={menuIconSize} color={activeTab === 'vacaciones' ? '#F97316' : '#94A3B8'} />
              <Text style={[styles.menuItemText, compactTextStyle, activeTab === 'vacaciones' && styles.menuItemTextActive]}>
                Vacaciones
              </Text>
            </TouchableOpacity>
          )}

          {(user.rol === 'super_admin' || user.rol === 'admin') && (
            <TouchableOpacity
              style={[styles.menuItem, compactItemStyle, activeTab === 'analitica' && styles.menuItemActive]}
              onPress={() => {
                changeTab('analitica');
                setMobileMenuOpen(false);
              }}
            >
              {activeTab === 'analitica' && <View style={styles.activeBar} />}
              <Feather name="bar-chart-2" size={menuIconSize} color={activeTab === 'analitica' ? '#F97316' : '#94A3B8'} />
              <Text style={[styles.menuItemText, compactTextStyle, activeTab === 'analitica' && styles.menuItemTextActive]}>
                Analítica
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.menuItem, compactItemStyle, activeTab === 'descargas' && styles.menuItemActive]}
            onPress={() => {
              changeTab('descargas');
              setMobileMenuOpen(false);
            }}
          >
            {activeTab === 'descargas' && <View style={styles.activeBar} />}
            <Feather name="arrow-down" size={menuIconSize} color={activeTab === 'descargas' ? '#F97316' : '#94A3B8'} />
            <Text style={[styles.menuItemText, compactTextStyle, activeTab === 'descargas' && styles.menuItemTextActive]}>
              Descargas
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, isCompactMenu && { height: 42 }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={menuIconSize} color="#FFFFFF" />
          <Text style={[styles.logoutBtnText, isCompactMenu && { fontSize: 14 }]}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <SafeAreaView style={styles.dashboardContainer} edges={['top']}>
        {isDesktop ? (
          <View style={styles.desktopLayout}>
            {sidebarView}
            <View style={styles.mainContentPanel}>
              <ScrollView contentContainerStyle={styles.mainScrollContent}>
                {renderContent()}
              </ScrollView>
              <View style={styles.footerWeb}>
                <Text style={styles.footerWebText}>© 2026 StockLimp. Todos los derechos reservados.</Text>
                <View style={styles.socialsRow}>
                  <TouchableOpacity
                    style={styles.socialItem}
                    onPress={() => Linking.openURL('https://www.instagram.com/adarvelimpiezas/')}
                  >
                    <Feather name="instagram" size={14} color="#64748B" />
                    <Text style={styles.socialText}>INSTAGRAM</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialItem}
                    onPress={() => Linking.openURL('https://www.facebook.com/profile.php?id=61578877810946&locale=es_ES')}
                  >
                    <Feather name="facebook" size={14} color="#64748B" />
                    <Text style={styles.socialText}>FACEBOOK</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialItem}
                    onPress={() => Linking.openURL('https://www.linkedin.com/in/adarve-limpiezas-sl-02329237a/')}
                  >
                    <Feather name="linkedin" size={14} color="#64748B" />
                    <Text style={styles.socialText}>LINKEDIN</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialItem}
                    onPress={() => Linking.openURL('https://x.com/adarvelimpiezas')}
                  >
                    <FontAwesome6 name="x-twitter" size={14} color="#64748B" />
                    <Text style={styles.socialText}>X</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.mobileLayout}>
            {/* Mobile Header Bar */}
            <View style={styles.mobileHeader}>
              <TouchableOpacity onPress={() => setMobileMenuOpen(!mobileMenuOpen)} style={styles.hamburgerBtn}>
                <Feather name={mobileMenuOpen ? 'x' : 'menu'} size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.mobileHeaderTitle}>StockLimp</Text>
              <View style={{ width: 24 }} /> {/* Balance space */}
            </View>

            {/* Mobile Menu Drawer Overlay */}
            {mobileMenuOpen && (
              <View style={styles.mobileDrawerContainer}>
                {sidebarView}
              </View>
            )}

            <ScrollView contentContainerStyle={[styles.mainScrollContent, { padding: 12, paddingBottom: 30 }]}>
              {renderContent()}
              <View style={styles.footerMobile}>
                <Text style={styles.footerMobileText}>© 2026 StockLimp. Todos los derechos reservados.</Text>
              </View>
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {isDesktop && (
        <View style={styles.imageColumn}>
          <Image source={cleaningWorkerImg} style={styles.cleaningImage} />
        </View>
      )}

      <View style={styles.formColumn}>
        <View style={styles.card}>
          <Text style={styles.title}>STOCKLIMP</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.passwordInputWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Contraseña"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Feather
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.checkboxContainer, { marginBottom: 12 }]}
            activeOpacity={0.8}
            onPress={handleToggleRememberMe}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.checkboxLabel}>Recordar usuario y contraseña</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxContainer}
            activeOpacity={0.8}
            onPress={() => setSolicitaRestablecimiento(!solicitaRestablecimiento)}
          >
            <View style={[styles.checkbox, solicitaRestablecimiento && styles.checkboxChecked]}>
              {solicitaRestablecimiento && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.checkboxLabel}>Solicitar restablecimiento de contraseña</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Ingresar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Live AI Chat Widget */}
      <View style={styles.chatWidgetContainer}>
        {chatOpen ? (
          <View style={styles.chatWindow}>
            <View style={styles.chatHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="cpu" size={17} color="#fff" />
                <Text style={styles.chatTitle}>Asistente IA StockLimp</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity
                  onPress={() =>
                    setChatMessages([
                      { text: "¡Hola! Soy el asistente IA de StockLimp. ¿En qué puedo ayudarte hoy?", isUser: false },
                    ])
                  }
                >
                  <Feather name="refresh-cw" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setChatOpen(false)}>
                  <Feather name="x" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatMessages}
              contentContainerStyle={{ padding: 12 }}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
            >
              {chatMessages.map((msg, i) => (
                <View key={i} style={[styles.chatBubble, msg.isUser ? styles.chatBubbleUser : styles.chatBubbleBot]}>
                  <Text style={[styles.chatText, msg.isUser ? styles.chatTextUser : styles.chatTextBot]}>{msg.text}</Text>
                </View>
              ))}
              {chatLoading && (chatMessages.length === 0 || chatMessages[chatMessages.length - 1].isUser) && (
                <View style={[styles.chatBubble, styles.chatBubbleBot, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <ActivityIndicator size="small" color="#5C8E8D" />
                  <Text style={[styles.chatText, styles.chatTextBot]}>Pensando...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatTextInput}
                placeholder="Pregúntame lo que necesites..."
                placeholderTextColor="#94A3B8"
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={() => handleSendChat()}
                editable={!chatLoading}
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, chatLoading && { opacity: 0.6 }]}
                onPress={() => handleSendChat()}
                disabled={chatLoading}
              >
                <Feather name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.chatFab} onPress={() => setChatOpen(true)}>
            <Feather name="message-circle" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}



export default function IndexPage() {
  return <HomeScreen />;
}
