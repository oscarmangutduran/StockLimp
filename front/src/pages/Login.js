import React, { useState } from 'react';
import axios from 'axios';
import '../css/Login.css'; 

const Login = ({ onLoginSuccess, onForgotPassword }) => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post('http://localhost/stocklimp/back/index.php?resource=login', {
                email: form.email,
                password: form.password
            });

            if (res.data && res.data.id_user) {
                localStorage.setItem('session_user', JSON.stringify(res.data));
                onLoginSuccess(res.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Email o contraseña incorrectos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>StockLimp Admin</h2>
                <form className="login-form" onSubmit={handleSubmit}>
                    <input type="email" placeholder="Email" required 
                        onChange={e => setForm({...form, email: e.target.value})} />
                    <input type="password" placeholder="Contraseña" required 
                        onChange={e => setForm({...form, password: e.target.value})} />
                    {error && <p className="error-text">{error}</p>}
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                    <p className="forgot-link" onClick={onForgotPassword}>
                        ¿Olvidaste tu contraseña?
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;