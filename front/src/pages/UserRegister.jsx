import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { userService } from '../services/api';
import Modal from '../components/Modal';
import '../css/UserRegister.css';

const UserRegister = () => {
    const activeUser = JSON.parse(localStorage.getItem('user'));

    // Si no es admin ni super_admin, redirigir
    if (!activeUser || (activeUser.rol !== 'admin' && activeUser.rol !== 'super_admin')) {
        return <Navigate to="/dashboard/productos" replace />;
    }

    const isSuperAdmin = activeUser.rol === 'super_admin';

    // Estados para la vista de Admin (Registro)
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '12345',
        rol: 'usuario'
    });
    const [errors, setErrors] = useState({});

    // Estados para la vista de Super Admin (Aprobación)
    const [pendingUsers, setPendingUsers] = useState([]);

    // Estados comunes
    const [loading, setLoading] = useState(false);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: 'Atención', message: '' });
    const [showPassword, setShowPassword] = useState(false);

    const showAlert = (message, title = 'Atención') => {
        setAlertModal({ isOpen: true, title, message });
    };

    // Cargar datos de pendientes para el Super Admin
    const loadPendingUsers = async () => {
        setLoading(true);
        try {
            const res = await userService.getAll();
            if (Array.isArray(res.data)) {
                const pending = res.data.filter(u => u.estado === 'pendiente');
                setPendingUsers(pending);
            }
        } catch (err) {
            console.error("Error al cargar usuarios pendientes:", err);
            showAlert("Ocurrió un error al cargar la lista de usuarios pendientes.", "Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isSuperAdmin) {
            loadPendingUsers();
        }
    }, [isSuperAdmin]);

    // Manejo de cambios en el formulario (Admin)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Validación del formulario (Admin)
    const validateForm = () => {
        const tempErrors = {};
        if (!formData.nombre.trim()) tempErrors.nombre = 'El nombre completo es obligatorio.';
        if (!formData.email.trim()) {
            tempErrors.email = 'El correo electrónico es obligatorio.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            tempErrors.email = 'El formato de correo no es válido.';
        }
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    // Envío de registro (Admin)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const res = await userService.create(formData);
            if (res.data && res.data.success) {
                showAlert('Usuario creado correctamente. Se encuentra pendiente de aprobación.', 'Registro Exitoso');
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

    // Aprobación de usuario (Super Admin)
    const handleApproveUser = async (userId) => {
        setLoading(true);
        try {
            await userService.approve(userId);
            // Remover de la lista local
            setPendingUsers(prev => prev.filter(u => u.id_user !== userId));
            showAlert("Usuario aprobado correctamente.", "Éxito");
        } catch (err) {
            console.error("Error al aprobar usuario:", err);
            showAlert("Ocurrió un error al intentar aprobar al usuario.", "Error");
        } finally {
            setLoading(false);
        }
    };

    // Rechazo de usuario (Super Admin)
    const handleRejectUser = async (userId) => {
        setLoading(true);
        try {
            await userService.reject(userId);
            // Remover de la lista local
            setPendingUsers(prev => prev.filter(u => u.id_user !== userId));
            showAlert("Usuario rechazado correctamente.", "Éxito");
        } catch (err) {
            console.error("Error al rechazar usuario:", err);
            showAlert("Ocurrió un error al intentar rechazar al usuario.", "Error");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return dateStr.split(' ')[0];
    };

    const getRoleName = (roleVal) => {
        switch (roleVal) {
            case 'super_admin': return 'Super Administrador';
            case 'admin': return 'Administrador';
            case 'usuario': return 'Usuario';
            case 'repartidor': return 'Repartidor';
            default: return roleVal;
        }
    };

    return (
        <div className="user-register-container">
            {/* Cabecera */}
            <div className="user-register-header">
                <h1 className="user-register-title">
                    {isSuperAdmin ? 'Usuarios por Aprobar' : 'Dar de Alta Usuario'}
                </h1>
            </div>

            {isSuperAdmin ? (
                /* VISTA SUPER ADMINISTRADOR: LISTA DE USUARIOS PENDIENTES */
                <div className="pending-table-card">
                    <div className="pending-card-header">
                        <svg className="pending-header-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>Bandeja de Aprobaciones de Personal</span>
                    </div>

                    <div className="pending-table-wrapper">
                        {loading && pendingUsers.length === 0 ? (
                            <div className="pending-empty">Cargando bandeja de entrada...</div>
                        ) : pendingUsers.length === 0 ? (
                            <div className="pending-empty">
                                No hay usuarios pendientes de aprobación en este momento.
                            </div>
                        ) : (
                            <table className="pending-users-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre Completo</th>
                                        <th>Email</th>
                                        <th>Rol Solicitado</th>
                                        <th>Fecha Solicitud</th>
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingUsers.map(u => (
                                        <tr key={u.id_user}>
                                            <td className="pending-cell-id"># {u.id_user}</td>
                                            <td className="pending-cell-name">{u.nombre}</td>
                                            <td className="pending-cell-email">{u.email}</td>
                                            <td>
                                                <span className={`pending-role-badge badge-role-${u.rol}`}>
                                                    {getRoleName(u.rol)}
                                                </span>
                                            </td>
                                            <td className="pending-cell-date">{formatDate(u.fecha_creacion)}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button
                                                        className="btn-approve-alta"
                                                        onClick={() => handleApproveUser(u.id_user)}
                                                        disabled={loading}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        <span>Aceptar</span>
                                                    </button>
                                                    <button
                                                        className="btn-reject-alta"
                                                        onClick={() => handleRejectUser(u.id_user)}
                                                        disabled={loading}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18" />
                                                            <line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                        <span>Rechazar</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : (
                /* VISTA ADMINISTRADOR: FORMULARIO DE REGISTRO */
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
                            <label htmlFor="rol">Rol del Usuario</label>
                            <select
                                id="rol"
                                name="rol"
                                value={formData.rol}
                                onChange={handleChange}
                            >
                                <option value="usuario">Usuario (Operario)</option>
                                <option value="repartidor">Repartidor</option>
                                <option value="admin">Administrador</option>
                                <option value="super_admin">Super Administrador</option>
                            </select>
                        </div>

                        <div className="register-actions">
                            <button type="submit" className="btn-register" disabled={loading}>
                                {loading ? (
                                    <span className="loader">Guardando...</span>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                            <polyline points="17 21 17 13 7 13 7 21" />
                                            <polyline points="7 3 7 8 15 8" />
                                        </svg>
                                        <span>Guardar</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

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
