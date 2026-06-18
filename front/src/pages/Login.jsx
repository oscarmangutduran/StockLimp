import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requestReset, setRequestReset] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para el flujo obligatorio de cambio de contraseña
  const [debeCambiarPassword, setDebeCambiarPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [userIdToReset, setUserIdToReset] = useState(null);

  const navigate = useNavigate();

  // 2. Función que se ejecuta al pulsar el botón de "Ingresar" o "Solicitar Restablecimiento"
  const handleSubmit = (e) => {
    e.preventDefault(); // Evita que la página se recargue por defecto
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (requestReset) {
      axios.post('http://127.0.0.1:8000/api/usuarios/solicitar-restablecimiento', {
          email: email
      })
      .then(response => {
          setLoading(false);
          if (response.data.success) {
              setSuccessMsg('Solicitud enviada al Super Administrador. Recibirás un correo cuando se restablezca tu contraseña.');
              setRequestReset(false);
          }
      })
      .catch(err => {
          setLoading(false);
          if (err.response && err.response.data) {
              setError(err.response.data.message || 'El correo electrónico no existe en el sistema.');
          } else {
              setError('Error de conexión con el servidor.');
          }
      });
      return;
    }

    // 🚀 Aquí es donde incluyes tu bloque de Axios apuntando al nuevo Laravel 11
    axios.post('http://127.0.0.1:8000/api/usuarios/login', {
        email: email,       // Enviamos el email del estado
        password: password  // Enviamos la contraseña del estado
    })
    .then(response => {
        setLoading(false);
        
        if (response.data.success) {
            if (response.data.debe_cambiar_password) {
                setDebeCambiarPassword(true);
                setUserIdToReset(response.data.user.id_user);
                setSuccessMsg('Por razones de seguridad, debes cambiar tu contraseña por defecto para poder acceder.');
                return;
            }

            // Guardamos los datos del usuario o el rol en el LocalStorage para saber que está logueado
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            console.log("Bienvenido ", response.data.user.name);
            
            // Redirigimos automáticamente a la pestaña de productos dentro del Dashboard
            navigate('/dashboard/productos');
        }
    })
    .catch(err => {
        setLoading(false);
        // Si Laravel devuelve un error 401 (Credenciales incorrectas), lo pintamos en la pantalla
        if (err.response && err.response.data) {
            setError(err.response.data.message);
        } else {
            setError('Error de conexión con el servidor.');
        }
    });
  };

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 4) {
      setError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPassword === '12345') {
      setError('No puedes usar la contraseña por defecto "12345". Elige otra.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    axios.post('http://127.0.0.1:8000/api/usuarios/cambiar-password-obligatorio', {
        id_user: userIdToReset,
        password: newPassword
    })
    .then(response => {
        setLoading(false);
        if (response.data.success) {
            // Autologin despues de cambiar contraseña
            axios.post('http://127.0.0.1:8000/api/usuarios/login', {
                email: email,
                password: newPassword
            })
            .then(loginRes => {
                if (loginRes.data.success) {
                    localStorage.setItem('user', JSON.stringify(loginRes.data.user));
                    navigate('/dashboard/productos');
                }
            })
            .catch(() => {
                setSuccessMsg('Contraseña cambiada. Por favor inicia sesión con tu nueva contraseña.');
                setDebeCambiarPassword(false);
                setPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
            });
        }
    })
    .catch(err => {
        setLoading(false);
        if (err.response && err.response.data) {
            setError(err.response.data.message || 'Error al cambiar la contraseña.');
        } else {
            setError('Error de conexión.');
        }
    });
  };

  if (debeCambiarPassword) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-logo">NUEVA CONTRASEÑA</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px', textAlign: 'left', lineHeight: '1.5' }}>
            Tu cuenta ha sido creada con la contraseña temporal por defecto. Por favor, introduce tu nueva contraseña personalizada para continuar.
          </p>

          {error && <div className="error-alert">{error}</div>}
          {successMsg && <div className="success-alert" style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', textAlign: 'left' }}>{successMsg}</div>}

          <form onSubmit={handleChangePasswordSubmit} className="login-form">
            <div className="login-input-group">
              <input 
                type={showNewPassword ? "text" : "password"} 
                className="login-input"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Nueva contraseña"
                required 
              />
              <span 
                className="password-toggle-icon"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </span>
            </div>

            <div className="login-input-group">
              <input 
                type={showNewPassword ? "text" : "password"} 
                className="login-input"
                value={confirmNewPassword} 
                onChange={(e) => setConfirmNewPassword(e.target.value)} 
                placeholder="Confirmar nueva contraseña"
                required 
              />
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar y Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-logo">STOCKLIMP</h2>
        
        {error && <div className="error-alert">{error}</div>}
        {successMsg && <div className="success-alert" style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', textAlign: 'left' }}>{successMsg}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <input 
              type="email" 
              className="login-input"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="pepe@stocklimp.com"
              required 
            />
          </div>

          {!requestReset && (
            <div className="login-input-group">
              <input 
                type={showPassword ? "text" : "password"} 
                className="login-input"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
              <span 
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </span>
            </div>
          )}

          <div className="login-checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0 20px 0', fontSize: '13px', textAlign: 'left' }}>
            <input 
              type="checkbox" 
              id="requestReset" 
              checked={requestReset} 
              onChange={(e) => {
                setRequestReset(e.target.checked);
                setError('');
                setSuccessMsg('');
              }} 
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="requestReset" style={{ cursor: 'pointer', userSelect: 'none', color: '#64748b' }}>
              Solicitar restablecimiento de contraseña
            </label>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Procesando...' : (requestReset ? 'Solicitar Restablecimiento' : 'Ingresar')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;