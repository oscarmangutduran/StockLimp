import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { userService } from '../services/api';
import Modal from '../components/Modal';
import '../css/UserRegister.css';

const UserRegister = () => {
    const activeUser = JSON.parse(localStorage.getItem('user'));

    // Si no es admin, redirigir
    if (!activeUser || activeUser.rol !== 'admin') {
        return <Navigate to="/dashboard/productos" replace />;
    }

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'usuario'
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: 'Atención', message: '' });

    const showAlert = (message, title = 'Atención') => {
        setAlertModal({ isOpen: true, title, message });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const tempErrors = {};
        if (!formData.nombre.trim()) tempErrors.nombre = 'El nombre completo es obligatorio.';
        if (!formData.email.trim()) {
            tempErrors.email = 'El correo electrónico es obligatorio.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            tempErrors.email = 'El formato de correo no es válido.';
        }
        if (!formData.password) {
            tempErrors.password = 'La contraseña es obligatoria.';
        } else if (formData.password.length < 4) {
            tempErrors.password = 'La contraseña debe tener al menos 4 caracteres.';
        }
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const res = await userService.create(formData);
            if (res.data && res.data.success) {
                showAlert('Usuario creado correctamente.', 'Éxito');
                setFormData({
                    nombre: '',
                    email: '',
                    password: '',
                    rol: 'usuario'
                });
            } else {
                showAlert(res.data.message || 'Ocurrió un error al registrar al usuario.', 'Error');
            }
        } catch (err) {
            console.error("Error al registrar usuario:", err);
            if (err.response && err.response.data && err.response.data.errors) {
                const apiErrors = err.response.data.errors;
                const tempErrors = {};
                if (apiErrors.email) {
                    tempErrors.email = 'Este correo electrónico ya está registrado.';
                }
                setErrors(tempErrors);
            } else {
                showAlert(err.response?.data?.message || 'Error de conexión con el servidor.', 'Error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-register-container">
            {/* Cabecera */}
            <div className="user-register-header">
                <h1 className="user-register-title">Dar de Alta Usuario</h1>
            </div>

            {/* Formulario */}
            <div className="register-card">
                <div className="register-card-header">
                    <svg className="register-header-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    <span>Registro de Nuevo Personal</span>
                </div>

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="form-group">
                        <label htmlFor="nombre">Nombre Completo</label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            placeholder="Ej. Juan Pérez"
                            value={formData.nombre}
                            onChange={handleChange}
                            className={errors.nombre ? 'input-error' : ''}
                        />
                        {errors.nombre && <span className="error-message">{errors.nombre}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Correo Electrónico</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Ej. juan@stocklimp.com"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'input-error' : ''}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña Temporal</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Mínimo 4 caracteres"
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? 'input-error' : ''}
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="rol">Rol del Usuario</label>
                        <select
                            id="rol"
                            name="rol"
                            value={formData.rol}
                            onChange={handleChange}
                        >
                            <option value="usuario">Usuario (Operario)</option>
                            <option value="admin">Administrador</option>
                            <option value="super_admin">Super Administrador</option>
                        </select>
                    </div>

                    <div className="register-actions">
                        <button type="submit" className="btn-register" disabled={loading}>
                            {loading ? (
                                <span className="loader">Cargando...</span>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12l5 5L20 7" />
                                    </svg>
                                    <span>Registrar Usuario</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <footer className="footer-container">
                <div className="footer-copyright">© 2026 StockLimp. Todos los derechos reservados.</div>
            </footer>

            {/* Modal de Alerta */}
            <Modal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ ...alertModal, isOpen: false })} title={alertModal.title}>
                <div style={{ textAlign: 'left', padding: '10px 0' }}>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text)' }}>
                        {alertModal.message}
                    </p>
                    <div className="form-actions" style={{ marginTop: '24px' }}>
                        <button type="button" className="btn-submit" onClick={() => setAlertModal({ ...alertModal, isOpen: false })}>
                            Aceptar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default UserRegister;
