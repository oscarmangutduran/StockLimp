import React, { useState } from 'react';
import axios from 'axios';
import '../css/Login.css';

const Login = ({ onLoginSuccess }) => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);

    const handleInput = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const onFormSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('email', credentials.email);
        data.append('password', credentials.password);

        try {
            const res = await axios.post('http://localhost/stocklimp/back/index.php?resource=login', data);
            if (res.data.success) {
                localStorage.setItem('session_user', JSON.stringify(res.data.user));
                onLoginSuccess(res.data.user);
            }
        } catch (err) {
            setError("Email o clave incorrectos.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>StockLimp Admin</h2>
                <form className="login-form" onSubmit={onFormSubmit}>
                    <div className="input-group">
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="Correo electrónico" 
                            required 
                            onChange={handleInput} 
                        />
                    </div>
                    <div className="input-group">
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Contraseña" 
                            required 
                            onChange={handleInput} 
                        />
                    </div>
                    {error && <p className="error-text">{error}</p>}
                    <button type="submit" className="btn-submit">Entrar</button>
                </form>
            </div>
        </div>
    );
};

export default Login;