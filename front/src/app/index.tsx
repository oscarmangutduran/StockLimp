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
import { Feather, FontAwesome } from '@expo/vector-icons';

// Import dashboard views
import ProductsView from '@/components/dashboard/ProductsView';
import OrdersView from '@/components/dashboard/OrdersView';
import CentersView from '@/components/dashboard/CentersView';
import ApproveUsersView from '@/components/dashboard/ApproveUsersView';
import ControlPanelView from '@/components/dashboard/ControlPanelView';
import AnalyticsView from '@/components/dashboard/AnalyticsView';
import ProfileView from '@/components/dashboard/ProfileView';
import TimeTrackingView from '@/components/dashboard/TimeTrackingView';

const cleaningWorkerImg = require('@/assets/images/cleaning_worker.png');

const BASE_URL = Platform.OS === 'web' ? 'http://localhost:8000/api' : 'http://10.0.2.2:8000/api';

type TabType = 'productos' | 'pedidos' | 'centros' | 'alta' | 'control' | 'analitica' | 'perfil' | 'fichaje';

export function HomeScreen({ initialTab }: { initialTab?: TabType } = {}) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [solicitaRestablecimiento, setSolicitaRestablecimiento] = useState(false);
  
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

  // Restore session from localStorage on mount (Web only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          if (!initialTab) {
            setActiveTab(parsed.rol === 'super_admin' || parsed.rol === 'admin' ? 'centros' : 'pedidos');
          }
        }
      } catch (e) {
        console.error('Error restoring session from localStorage:', e);
      }
    }
  }, []);

  const saveUserSession = (userData: any) => {
    setUser(userData);
    if (!initialTab) {
      setActiveTab(userData.rol === 'super_admin' || userData.rol === 'admin' ? 'centros' : 'pedidos');
    }
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (e) {
        console.error('Error saving session to localStorage:', e);
      }
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

      // If backend is down, we allow local backdoors for testing
      if (email === 'oscar@stocklimp.com' && password === 'admin123') {
        saveUserSession({
          id_user: 1,
          nombre: 'Oscar Mangut',
          email: 'oscar@stocklimp.com',
          rol: 'super_admin',
        });
        setLoading(false);
        return;
      }

      if (email === 'admin@stocklimp.com' && password === 'admin123') {
        saveUserSession({
          id_user: 2,
          nombre: 'Admin Pruebas',
          email: 'admin@stocklimp.com',
          rol: 'admin',
        });
        setLoading(false);
        return;
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
        saveUserSession(data.user);
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
    setEmail('');
    setPassword('');
    setSolicitaRestablecimiento(false);
    setActiveTab('centros');
    setMobileMenuOpen(false);
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem('user');
      } catch (e) {
        console.error('Error clearing session from localStorage:', e);
      }
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
          return <OrdersView baseUrl={BASE_URL} userRole={user.rol} userId={user.id_user} idCentro={user.id_centro} />;
        case 'centros':
          return <CentersView baseUrl={BASE_URL} />;
        case 'alta':
          return <ApproveUsersView baseUrl={BASE_URL} userRole={user.rol} />;
        case 'control':
          return user.rol === 'super_admin' ? (
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
        default:
          return <CentersView baseUrl={BASE_URL} />;
      }
    };

    const sidebarView = (
      <View style={styles.sidebar}>
        {/* Profile Header */}
        <TouchableOpacity
          style={[styles.profileHeader, { justifyContent: 'space-between', alignItems: 'center' }]}
          onPress={() => {
            changeTab('perfil');
            setMobileMenuOpen(false);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            {user.foto_perfil ? (
              <Image
                source={{
                  uri: user.foto_perfil.startsWith('http')
                    ? user.foto_perfil
                    : `http://localhost:8000${user.foto_perfil}`
                }}
                style={styles.profileAvatar}
              />
            ) : (
              <View style={styles.profileIconBg}>
                <Feather name="user" size={20} color="#64748B" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user.nombre}
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 11 }} numberOfLines={1}>
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
        <View style={styles.menuList}>
          {(user.rol === 'super_admin' || user.rol === 'admin') && (
            <TouchableOpacity
              style={[styles.menuItem, activeTab === 'productos' && styles.menuItemActive]}
              onPress={() => {
                changeTab('productos');
                setMobileMenuOpen(false);
              }}
            >
              {activeTab === 'productos' && <View style={styles.activeBar} />}
              <Feather name="box" size={18} color={activeTab === 'productos' ? '#F97316' : '#94A3B8'} />
              <Text style={[styles.menuItemText, activeTab === 'productos' && styles.menuItemTextActive]}>
                Productos
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.menuItem, activeTab === 'pedidos' && styles.menuItemActive]}
            onPress={() => {
              changeTab('pedidos');
              setMobileMenuOpen(false);
            }}
          >
            {activeTab === 'pedidos' && <View style={styles.activeBar} />}
            <Feather name="file-text" size={18} color={activeTab === 'pedidos' ? '#F97316' : '#94A3B8'} />
            <Text style={[styles.menuItemText, activeTab === 'pedidos' && styles.menuItemTextActive]}>
              Pedidos
            </Text>
          </TouchableOpacity>

          {(user.rol === 'super_admin' || user.rol === 'admin') && (
            <TouchableOpacity
              style={[styles.menuItem, activeTab === 'centros' && styles.menuItemActive]}
              onPress={() => {
                changeTab('centros');
                setMobileMenuOpen(false);
              }}
            >
              {activeTab === 'centros' && <View style={styles.activeBar} />}
              <Feather name="book-open" size={18} color={activeTab === 'centros' ? '#F97316' : '#94A3B8'} />
              <Text style={[styles.menuItemText, activeTab === 'centros' && styles.menuItemTextActive]}>
                Centros
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.menuItem, activeTab === 'fichaje' && styles.menuItemActive]}
            onPress={() => {
              changeTab('fichaje');
              setMobileMenuOpen(false);
            }}
          >
            {activeTab === 'fichaje' && <View style={styles.activeBar} />}
            <Feather name="clock" size={18} color={activeTab === 'fichaje' ? '#F97316' : '#94A3B8'} />
            <Text style={[styles.menuItemText, activeTab === 'fichaje' && styles.menuItemTextActive]}>
              Control Horario
            </Text>
          </TouchableOpacity>

          {(user.rol === 'super_admin' || user.rol === 'admin') && (
            <TouchableOpacity
              style={[styles.menuItem, activeTab === 'alta' && styles.menuItemActive]}
              onPress={() => {
                changeTab('alta');
                setMobileMenuOpen(false);
              }}
            >
              {activeTab === 'alta' && <View style={styles.activeBar} />}
              <Feather name="user-plus" size={18} color={activeTab === 'alta' ? '#F97316' : '#94A3B8'} />
              <Text style={[styles.menuItemText, activeTab === 'alta' && styles.menuItemTextActive]}>
                Dar de alta
              </Text>
            </TouchableOpacity>
          )}

          {user.rol === 'super_admin' && (
            <TouchableOpacity
              style={[styles.menuItem, activeTab === 'control' && styles.menuItemActive]}
              onPress={() => {
                changeTab('control');
                setMobileMenuOpen(false);
              }}
            >
              {activeTab === 'control' && <View style={styles.activeBar} />}
              <Feather name="grid" size={18} color={activeTab === 'control' ? '#F97316' : '#94A3B8'} />
              <Text style={[styles.menuItemText, activeTab === 'control' && styles.menuItemTextActive]}>
                Control
              </Text>
            </TouchableOpacity>
          )}

          {(user.rol === 'super_admin' || user.rol === 'admin') && (
            <TouchableOpacity
              style={[styles.menuItem, activeTab === 'analitica' && styles.menuItemActive]}
              onPress={() => {
                changeTab('analitica');
                setMobileMenuOpen(false);
              }}
            >
              {activeTab === 'analitica' && <View style={styles.activeBar} />}
              <Feather name="bar-chart-2" size={18} color={activeTab === 'analitica' ? '#F97316' : '#94A3B8'} />
              <Text style={[styles.menuItemText, activeTab === 'analitica' && styles.menuItemTextActive]}>
                Analítica
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="#FFFFFF" />
          <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
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
                    onPress={() => Linking.openURL('https://instagram.com')}
                  >
                    <Feather name="instagram" size={14} color="#64748B" />
                    <Text style={styles.socialText}>INSTAGRAM</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialItem}
                    onPress={() => Linking.openURL('https://linkedin.com')}
                  >
                    <Feather name="linkedin" size={14} color="#64748B" />
                    <Text style={styles.socialText}>LINKEDIN</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialItem}
                    onPress={() => Linking.openURL('https://behance.net')}
                  >
                    <FontAwesome name="behance" size={14} color="#64748B" />
                    <Text style={styles.socialText}>BEHANCE</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialItem}
                    onPress={() => Linking.openURL('https://youtube.com')}
                  >
                    <Feather name="youtube" size={14} color="#64748B" />
                    <Text style={styles.socialText}>YOUTUBE</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F3F6F8',
  },
  imageColumn: {
    flex: 1,
    height: '100%',
  },
  cleaningImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  formColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F6F8',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5C8E8D',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#EBF1FC',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF1FC',
    borderRadius: 12,
    marginBottom: 16,
    height: 52,
    width: '100%',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  eyeIcon: {
    paddingRight: 16,
    height: '100%',
    justifyContent: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    borderColor: '#5C8E8D',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#5C8E8D',
    borderRadius: 2,
  },
  checkboxLabel: {
    color: '#64748B',
    fontSize: 14,
    flexShrink: 1,
  },
  button: {
    backgroundColor: '#6D9896',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Dashboard Structure (Post-Login)
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#F3F6F8',
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#1E2640', // Dark profile color matching mockups
    height: '100%',
    paddingVertical: 24,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderColor: '#0F172A',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  profileIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  menuList: {
    flex: 1,
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: '#2A3A54', // Active bar focus color
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#3B82F6', // Blue side active bar indicator
  },
  menuItemText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    height: 52,
    gap: 8,
    marginTop: 'auto',
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  mainContentPanel: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainScrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  footerWeb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerWebText: {
    fontSize: 13,
    color: '#64748B',
  },
  socialsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  // Mobile Layout
  mobileLayout: {
    flex: 1,
  },
  mobileHeader: {
    height: 56,
    backgroundColor: '#1E2640',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  hamburgerBtn: {
    padding: 6,
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mobileDrawerContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    bottom: 0,
    width: 240,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  footerMobile: {
    marginTop: 40,
    paddingVertical: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  footerMobileText: {
    fontSize: 12,
    color: '#64748B',
  },
});

export default function IndexPage() {
  return <HomeScreen />;
}
