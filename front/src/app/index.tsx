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
import { styles } from '../css/index.styles';

const cleaningWorkerImg = require('@/assets/images/cleaning_worker.png');

const PROD_URL = 'https://stocklimp-backend.onrender.com/api';
const DEV_URL = Platform.OS === 'web' ? 'http://localhost:8000/api' : 'http://10.0.2.2:8000/api';
const BASE_URL = __DEV__ ? DEV_URL : PROD_URL;

type TabType = 'productos' | 'pedidos' | 'centros' | 'alta' | 'control' | 'analitica' | 'perfil' | 'fichaje' | 'vacaciones';

export function HomeScreen({ initialTab }: { initialTab?: TabType } = {}) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [solicitaRestablecimiento, setSolicitaRestablecimiento] = useState(false);
  
  // Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{text: string, isUser: boolean}[]>([
    { text: "¡Hola! Antes de empezar, ¿cómo te llamas?", isUser: false }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatUserName, setChatUserName] = useState('');
  
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

  // Clear chat after 2 minutes of inactivity
  useEffect(() => {
    if (chatMessages.length > 1) {
      const timer = setTimeout(() => {
        setChatUserName('');
        setChatMessages([
          { text: "¡Hola! Antes de empezar, ¿cómo te llamas?", isUser: false }
        ]);
        setChatOpen(false); // Cerramos el chat para limpiar la pantalla
      }, 120000);
      return () => clearTimeout(timer);
    }
  }, [chatMessages]);

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

  const handleSendChat = (presetText?: string) => {
    const textToSend = typeof presetText === 'string' ? presetText : chatInput;
    if (!textToSend.trim()) return;
    
    const isFirstMessage = !chatUserName;
    if (isFirstMessage) {
      setChatUserName(textToSend.trim());
    }

    const newUserMsg = { text: textToSend, isUser: true };
    setChatMessages(prev => [...prev, newUserMsg]);
    if (typeof presetText !== 'string') setChatInput('');
    
    setTimeout(() => {
      if (isFirstMessage) {
        setChatMessages(prev => [...prev, {
          text: `¡Encantado, ${textToSend.trim()}!\n¿En qué puedo ayudarte?\n1. Contraseña olvidada\n2. Fechas de pedidos\n3. Falta un producto\n4. Pedir vacaciones\n5. Hasta pronto (cerrar)`,
          isUser: false
        }]);
        return;
      }

      const lowerInput = newUserMsg.text.toLowerCase();
      
      let responseText = "No he entendido bien tu pregunta. Por favor, escribe un número del 1 al 5, o descríbeme tu duda (contraseñas, pedidos, faltas, vacaciones).";
      
      if (lowerInput === '1' || lowerInput.includes('contraseña') || lowerInput.includes('password') || lowerInput.includes('olvid') || lowerInput.includes('recordar')) {
        responseText = "Si no recuerdas tu contraseña, debes escribir un correo a mangutduranoscar@gmail.com con el asunto 'Olvidado'.";
      } else if (lowerInput === '2' || (lowerInput.includes('pedido') && (lowerInput.includes('dia') || lowerInput.includes('fecha') || lowerInput.includes('modificar') || lowerInput.includes('cuando')))) {
        responseText = "Puedes hacer y modificar tus pedidos del 2 al 8 de cada mes.";
      } else if (lowerInput === '3' || (lowerInput.includes('falta') && (lowerInput.includes('producto') || lowerInput.includes('material')))) {
        responseText = "Si te falta algún producto, debes escribir a la persona encargada de entregar el pedido.";
      } else if (lowerInput === '4' || lowerInput.includes('vacacion') || lowerInput.includes('vacaciones') || lowerInput.includes('descanso')) {
        responseText = "Para pedir tus vacaciones, debes ir a la sección de 'Control Horario' (fichaje) dentro de la aplicación una vez inicies sesión.";
      } else if (lowerInput === '5' || lowerInput.includes('hasta pronto') || lowerInput.includes('adios') || lowerInput.includes('adiós') || lowerInput.includes('cerrar')) {
        setChatMessages(prev => [...prev, {
          text: "¡Hasta pronto! Que tengas un excelente día.",
          isUser: false
        }]);
        
        setTimeout(() => {
          setChatUserName('');
          setChatMessages([
            { text: "¡Hola! Antes de empezar, ¿cómo te llamas?", isUser: false }
          ]);
          setChatOpen(false);
        }, 1500);
        return;
      } else if (lowerInput.includes('pedido') || lowerInput.includes('producto')) {
        responseText = "Sobre pedidos: los puedes hacer del 2 al 8 de cada mes. Si falta algún producto, avisa a la persona encargada de entregarlo.";
      }

      setChatMessages(prev => [...prev, {
        text: responseText,
        isUser: false
      }]);
    }, 1000);
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
        case 'vacaciones':
          return <VacationsAdminView baseUrl={BASE_URL} userId={user.id_user} />;
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
                    : `${BASE_URL.replace('/api', '')}${user.foto_perfil}`
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
              style={[styles.menuItem, activeTab === 'vacaciones' && styles.menuItemActive]}
              onPress={() => {
                changeTab('vacaciones');
                setMobileMenuOpen(false);
              }}
            >
              {activeTab === 'vacaciones' && <View style={styles.activeBar} />}
              <Feather name="sun" size={18} color={activeTab === 'vacaciones' ? '#F97316' : '#94A3B8'} />
              <Text style={[styles.menuItemText, activeTab === 'vacaciones' && styles.menuItemTextActive]}>
                Vacaciones
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

      {/* Live Chat Widget */}
      <View style={styles.chatWidgetContainer}>
        {chatOpen ? (
          <View style={styles.chatWindow}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Chat de Soporte</Text>
              <TouchableOpacity onPress={() => setChatOpen(false)}>
                <Feather name="x" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.chatMessages} contentContainerStyle={{ padding: 12 }}>
              {chatMessages.map((msg, i) => (
                <View key={i} style={[styles.chatBubble, msg.isUser ? styles.chatBubbleUser : styles.chatBubbleBot]}>
                  <Text style={[styles.chatText, msg.isUser ? styles.chatTextUser : styles.chatTextBot]}>{msg.text}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatTextInput}
                placeholder="Escribe un mensaje..."
                placeholderTextColor="#94A3B8"
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={() => handleSendChat()}
              />
              <TouchableOpacity style={styles.chatSendBtn} onPress={() => handleSendChat()}>
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
