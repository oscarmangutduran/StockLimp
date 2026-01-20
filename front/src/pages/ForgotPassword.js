import React, { useState } from 'react';
import axios from 'axios';
import '../css/ForgotPassword.css'; // Importación específica de sus estilos

const ForgotPassword = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Petición al backend para procesar el correo
            const res = await axios.post('http://localhost/stocklimp/back/index.php?resource=reset_password', {
                email: email
            });

            if (res.data.success) {
                setMessage({ 
                    type: 'success', 
                    text: 'Se han enviado las instrucciones a tu correo.' 
                });
            }
        } catch (err) {
            setMessage({ 
                type: 'error', 
                text: 'No se pudo procesar la solicitud. Verifica el email.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-container">
            <div className="forgot-card">
                <h2>Recuperar Contraseña</h2>
                <p className="forgot-subtitle">Introduce tu email para recibir un enlace de restablecimiento.</p>
                
                <form onSubmit={handleReset}>
                    <div className="input-group">
                        <input 
                            type="email" 
                            placeholder="Correo electrónico" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {message.text && (
                        <div className={`message-alert ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <button type="submit" className="btn-reset" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar enlace'}
                    </button>
                </form>

                <button className="btn-back" onClick={onBack}>
                    ← Volver al Login
                </button>
            </div>
        </div>
    );
};

export default ForgotPassword;