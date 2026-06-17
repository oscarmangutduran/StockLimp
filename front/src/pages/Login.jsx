import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 2. Función que se ejecuta al pulsar el botón de "Ingresar"
  const handleSubmit = (e) => {
    e.preventDefault(); // Evita que la página se recargue por defecto
    setError('');
    setLoading(true);

    // 🚀 Aquí es donde incluyes tu bloque de Axios apuntando al nuevo Laravel 11
    axios.post('http://127.0.0.1:8000/api/usuarios/login', {
        email: email,       // Enviamos el email del estado
        password: password  // Enviamos la contraseña del estado
    })
    .then(response => {
        setLoading(false);
        
        if (response.data.success) {
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

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-logo">STOCKLIMP</h2>
        
        {error && <div className="error-alert">{error}</div>}

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

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Comprobando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;