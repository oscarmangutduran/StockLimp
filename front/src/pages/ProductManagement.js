import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx'; 
import '../css/ProductManagement.css';

// Componente de Icono Vectorial para la contraseña
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

const ProductManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // ESTADOS DE AUTENTICACIÓN
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loginData, setLoginData] = useState({ user: '', pass: '' });
    const [showPassword, setShowPassword] = useState(false);

    // ESTADOS DE UI
    const activeTab = location.pathname.split('/')[1] || 'productos';
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showFooter, setShowFooter] = useState(true); 
    
    // ESTADOS DE MODALES
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false); 
    
    const [selectedRow, setSelectedRow] = useState(null);
    const [newRow, setNewRow] = useState({});
    // eslint-disable-next-line no-unused-vars
    const [components, setComponents] = useState([]); 

    useEffect(() => {
        if (isLoggedIn) {
            loadData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, isLoggedIn]);

    const loadData = async () => {
        try {
            const res = await axios.get(`http://localhost/StockLimp/back/index.php?resource=${activeTab}`);
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (e) { 
            console.error("Error al cargar datos"); 
            setData([]);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`http://localhost/StockLimp/back/index.php?resource=login`, loginData);
            if (res.data && res.data.success) { 
                setUserData(res.data.user); 
                setIsLoggedIn(true);
                navigate('/productos'); 
            } else { alert(res.data?.message || "Credenciales incorrectas"); }
        } catch (e) { alert("Error de conexión"); }
    };

    const exportToExcel = () => {
        if (data.length === 0) return alert("No hay datos para exportar");
        const excelData = data.map(row => {
            const cleanRow = {};
            Object.keys(row).forEach(key => {
                const friendlyName = key.replace(/_/g, ' ').toUpperCase();
                cleanRow[friendlyName] = row[key];
            });
            return cleanRow;
        });
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.toUpperCase());
        XLSX.writeFile(workbook, `StockLimp_${activeTab}.xlsx`);
    };

    const showInfo = async (row) => {
        setSelectedRow(row);
        setIsInfoModalOpen(true);
        if (activeTab === 'productos') {
            try {
                const res = await axios.get(`http://localhost/StockLimp/back/index.php?resource=componentes&id_producto=${row.id_producto}`);
                setComponents(res.data || []);
            } catch (e) { setComponents([]); }
        }
    };

    const executeAction = async (action, payload) => {
        try {
            const cleanPayload = Object.keys(payload).reduce((acc, key) => {
                let value = payload[key];
                if (value === null || value === undefined) value = "";
                if (key.toLowerCase().includes('fecha') && String(value).length > 10) {
                    value = String(value).substring(0, 10);
                }
                acc[key] = value;
                return acc;
            }, {});

            const res = await axios.post(
                `http://localhost/StockLimp/back/index.php?resource=${activeTab}&action=${action}`, 
                cleanPayload
            );

            if (res.data && res.data.success) {
                setIsAddModalOpen(false); 
                setIsEditModalOpen(false); 
                setIsDeleteModalOpen(false);
                loadData();
            } else {
                alert(`Error: ${res.data?.message || "La base de datos rechazó los datos."}`);
            }
        } catch (e) { 
            alert("Error de conexión. Revisa que el servidor PHP esté corriendo."); 
        }
    };

    const formatValue = (key, value) => {
        if (value === null || value === undefined) return '-';
        if (key === 'es_toxico') return value === 1 || value === "1" ? "SÍ" : "NO";
        if (key.toLowerCase().includes('fecha') && String(value).length > 10) {
            return value.substring(0, 10);
        }
        if (key.toLowerCase().includes('precio') || key.toLowerCase().includes('total')) return `${parseFloat(value).toFixed(2)}€`;
        if (key.toLowerCase().includes('stock') || key.toLowerCase().includes('cantidad')) return Math.floor(value);
        return value;
    };

    const renderInput = (key, value, onChange, isDisabled = false) => {
        const isDateField = key.toLowerCase().includes('fecha');
        const isToxicField = key === 'es_toxico';
        const isStatusEdit = key.toLowerCase() === 'estado' && activeTab === 'pedidos' && isEditModalOpen;

        if (isStatusEdit) {
            return (
                <div className="form-group" key={key}>
                    <label>{key.replace(/_/g, ' ').toUpperCase()}</label>
                    <select value={value} onChange={onChange} disabled={isDisabled}>
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="EN_PREPARACION">EN PREPARACIÓN</option>
                        <option value="DESPACHADO">DESPACHADO</option>
                        <option value="ENTREGADO">ENTREGADO</option>
                        <option value="CANCELADO">CANCELADO</option>
                    </select>
                </div>
            );
        }

        let displayValue = value || '';
        if (isDateField && displayValue.length > 10) displayValue = displayValue.substring(0, 10);

        return (
            <div className="form-group" key={key}>
                <label>{key.replace(/_/g, ' ').toUpperCase()}</label>
                {isToxicField ? (
                    <select value={value || '0'} onChange={onChange} disabled={isDisabled}>
                        <option value="1">SÍ</option>
                        <option value="0">NO</option>
                    </select>
                ) : (
                    <input type={isDateField ? "date" : "text"} value={displayValue} disabled={isDisabled} onChange={onChange} />
                )}
            </div>
        );
    };

    // VISTA DE LOGIN
    if (!isLoggedIn) {
        return (
            <div className="login-container">
                <form className="login-card" onSubmit={handleLogin}>
                    <h1 className="login-logo">STOCKLIMP</h1>
                    <div className="login-input-group">
                        <input 
                            type="text" 
                            placeholder="Email" 
                            onChange={e => setLoginData({...loginData, user: e.target.value})} 
                            required 
                        />
                    </div>
                    <div className="login-input-group">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Contraseña" 
                            onChange={e => setLoginData({...loginData, pass: e.target.value})} 
                            required 
                        />
                        <span 
                            className="password-toggle-icon" 
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <EyeIcon open={showPassword} />
                        </span>
                    </div>
                    <button type="submit" className="btn-login">Ingresar</button>
                </form>
            </div>
        );
    }

    // VISTA PRINCIPAL
    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-logo">STOCKLIMP</div>
                <div className="user-info-top">
                    <span className="user-icon">👤</span>
                    <span className="user-name-text">{userData?.nombre}</span>
                </div>
                <nav className="sidebar-nav">
                    <button className={activeTab === 'productos' ? 'active' : ''} onClick={() => navigate('/productos')}>📦 Productos</button>
                    <button className={activeTab === 'pedidos' ? 'active' : ''} onClick={() => navigate('/pedidos')}>🛒 Pedidos</button>
                    <button className={activeTab === 'centros_trabajo' ? 'active' : ''} onClick={() => navigate('/centros_trabajo')}>🏢 Centros</button>
                </nav>
                <button className="btn-logout" onClick={() => { setIsLoggedIn(false); navigate('/'); }}>Cerrar Sesión</button>
            </aside>

            <main className="content">
                <header className="content-header">
                    <h2>GESTIÓN DE {activeTab.toUpperCase()}</h2>
                    <div className="header-actions">
                        <button className="btn-add" onClick={() => {
                            const empty = data.length > 0 ? Object.keys(data[0]).reduce((a,k)=>({...a,[k]:""}),{}) : {};
                            setNewRow(empty); 
                            setIsAddModalOpen(true);
                        }}>+ Nuevo</button>
                        <button className="btn-add" onClick={exportToExcel}>📊 Exportar</button>
                        <input className="search-input" type="text" placeholder="Buscar..." onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </header>

                <div className="table-section">
                    <table>
                        <thead>
                            <tr>
                                {data.length > 0 && Object.keys(data[0]).map(k => <th key={k}>{k.replace(/_/g,' ').toUpperCase()}</th>)}
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))).map((row, i) => (
                                <tr key={i}>
                                    {Object.entries(row).map(([k, v], j) => <td key={j}>{formatValue(k, v)}</td>)}
                                    <td className="actions-cell">
                                        <button className="btn-info" onClick={() => showInfo(row)}>ℹ️</button>
                                        <button className="btn-edit" onClick={() => { setSelectedRow({...row}); setIsEditModalOpen(true); }}>✏️</button>
                                        <button className="btn-delete" onClick={() => { setSelectedRow(row); setIsDeleteModalOpen(true); }}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button 
                    className="btn-toggle-footer" 
                    onClick={() => setShowFooter(!showFooter)}
                    title={showFooter ? "Ocultar Footer" : "Mostrar Footer"}
                >
                    {showFooter ? "🔽" : "ℹ️"}
                </button>

                <footer className={`footer-credits ${!showFooter ? 'hidden' : ''}`}>
                    <p>Aplicación web desarrollada por: <strong>Oscar Mangut Durán</strong></p>
                    <div className="social-icons">
                        <a href="https://www.linkedin.com/in/oscar-mangut-dur%C3%A1n-775186177/" target="_blank" rel="noreferrer"><i className="fab fa-linkedin"></i></a>
                        <a href="https://www.instagram.com/oscarmangutdev/" target="_blank" rel="noreferrer"><i className="fab fa-instagram"></i></a>
                        <a href="https://www.behance.net/oscarmangutdurn" target="_blank" rel="noreferrer"><i className="fab fa-behance"></i></a>
                        <a href="https://www.youtube.com/@Oscarmangut" target="_blank" rel="noreferrer"><i className="fab fa-youtube"></i></a>
                    </div>
                </footer>
            </main>

            {/* MODAL EDITAR */}
            {isEditModalOpen && selectedRow && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Editar Registro</h3>
                        <form onSubmit={(e) => { e.preventDefault(); executeAction('update', selectedRow); }}>
                            {Object.keys(selectedRow).map((k, i) => renderInput(k, selectedRow[k], (e) => setSelectedRow({...selectedRow, [k]: e.target.value}), i === 0))}
                            <div className="modal-btns">
                                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-save">Actualizar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL AÑADIR */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Nuevo Registro</h3>
                        <form onSubmit={(e) => { e.preventDefault(); executeAction('create', newRow); }}>
                            {Object.keys(newRow).map((k, i) => renderInput(k, newRow[k], (e) => setNewRow({...newRow, [k]: e.target.value}), i === 0))}
                            <div className="modal-btns">
                                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Cerrar</button>
                                <button type="submit" className="btn-save">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ELIMINAR */}
            {isDeleteModalOpen && selectedRow && (
                <div className="modal-overlay">
                    <div className="modal-confirm">
                        <div style={{fontSize: '3rem', marginBottom: '1rem'}}>⚠️</div>
                        <h3>¿Eliminar este registro?</h3>
                        <div className="modal-btns">
                            <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>No, cancelar</button>
                            <button className="btn-delete" onClick={() => {
                                const idKey = Object.keys(selectedRow)[0];
                                executeAction('delete', { id: selectedRow[idKey], column: idKey });
                            }}>Sí, Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;