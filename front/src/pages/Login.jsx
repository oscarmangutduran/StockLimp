import React, { useState } from 'react';
import { authService } from '../services/api';
import '../css/Login.css'; 

// Subcomponente interno para renderizar dinámicamente el SVG del ojo
const EyeIcon = ({ open }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {open ? (
            <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </>
        ) : (
            <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </>
        )}
    </svg>
);

const Login = ({ onLoginSuccess }) => {
    const [loginData, setLoginData] = useState({ user: '', pass: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Petición POST directa hacia Laravel usando el servicio centralizado
            const res = await authService.login(loginData.user, loginData.pass);
            
            if (res.data && res.data.success) {
                // Si el backend responde éxito, inyectamos los datos del usuario hacia el estado global
                onLoginSuccess(res.data.user);
            } else {
                alert(res.data?.message || "Credenciales incorrectas");
            }
        } catch (err) {
            console.error("Error detallado en la conexión:", err.response || err);
            alert("No se pudo conectar con el servidor. Revisa si Apache y MySQL están activos en XAMPP.");
        }
    };

    return (
        <div className="login-container">
            <form className="login-card" onSubmit={handleLogin}>
                <h1 className="login-logo">STOCKLIMP</h1>
                
                {/* Input de Identificación */}
                <div className="login-input-group">
                    <input 
                        type="text" 
                        className="login-input"
                        placeholder="Email o Usuario" 
                        autoComplete="username"
                        onChange={e => setLoginData({...loginData, user: e.target.value})} 
                        required 
                    />
                </div>
                
                {/* Input de Contraseña */}
                <div className="login-input-group">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        className="login-input"
                        placeholder="Contraseña" 
                        autoComplete="current-password"
                        onChange={e => setLoginData({...loginData, pass: e.target.value})} 
                        required 
                    />
                    {/* Botón interactivo para alternar el tipo de input */}
                    <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                        <EyeIcon open={showPassword} />
                    </span>
                </div>
                
                <button type="submit" className="btn-login">Ingresar</button>
            </form>
        </div>
    );
};

export default Login;