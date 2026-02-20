import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../css/ProductManagement.css';

const ProductManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loginData, setLoginData] = useState({ user: '', pass: '' });
    
    const activeTab = location.pathname.split('/')[1] || 'productos';
    
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [newRow, setNewRow] = useState({});

    // 1. CARGA DE DATOS
    useEffect(() => {
        if (isLoggedIn) {
            loadData();
        }
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

    // 2. LÓGICA DE LOGIN
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`http://localhost/StockLimp/back/index.php?resource=login`, loginData);
            if (res.data.success) { 
                setUserData(res.data.user); 
                setIsLoggedIn(true);
                navigate('/productos'); 
            } else { alert(res.data.message); }
        } catch (e) { alert("Error de conexión"); }
    };

    // 3. ACCIONES CRUD (CREATE, UPDATE, DELETE)
    const executeAction = async (action, payload) => {
        try {
            const res = await axios.post(`http://localhost/StockLimp/back/index.php?resource=${activeTab}&action=${action}`, payload);
            if (res.data.success) {
                setIsAddModalOpen(false); 
                setIsEditModalOpen(false); 
                setIsDeleteModalOpen(false);
                loadData();
            } else {
                alert("Error en la operación: " + (res.data.message || "Desconocido"));
            }
        } catch (e) { alert("Error de red al ejecutar acción"); }
    };

    // 4. FUNCIÓN DE DESCARGA CSV (NUEVA)
    const downloadCSV = () => {
        if (data.length === 0) return alert("No hay datos para exportar");

        // Obtenemos solo los datos que coinciden con la búsqueda actual
        const filteredData = data.filter(r => 
            Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const headers = Object.keys(data[0]).join(",");
        const rows = filteredData.map(row => 
            Object.values(row).map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(",")
        ).join("\n");

        const csvContent = "\uFEFF" + headers + "\n" + rows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `StockLimp_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // 5. FORMATEO DE VALORES PARA LA TABLA
    const formatValue = (key, value) => {
        if (value === null || value === undefined) return '-';
        if (key === 'es_toxico') return value == 1 ? "SÍ" : "NO";
        if (key.toLowerCase().includes('precio') || key.toLowerCase().includes('total')) return `${parseFloat(value).toFixed(2)}€`;
        if (key.toLowerCase().includes('stock') || key.toLowerCase().includes('cantidad')) return Math.floor(value);
        return value;
    };

    const renderInput = (key, value, onChange, isDisabled = false) => {
        const isDateField = key.toLowerCase().includes('fecha');
        const isToxicField = key === 'es_toxico';
        return (
            <div className="form-group" key={key}>
                <label>{key.replace('_', ' ').toUpperCase()}</label>
                {isToxicField ? (
                    <select value={value || '0'} onChange={onChange} disabled={isDisabled}>
                        <option value="1">SÍ</option>
                        <option value="0">NO</option>
                    </select>
                ) : (
                    <input type={isDateField ? "date" : "text"} value={value || ''} disabled={isDisabled} onChange={onChange} />
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
                    <input type="text" placeholder="Email" onChange={e => setLoginData({...loginData, user: e.target.value})} />
                    <input type="password" placeholder="Pass" onChange={e => setLoginData({...loginData, pass: e.target.value})} />
                    <button type="submit" className="btn-login">Ingresar</button>
                </form>
            </div>
        );
    }

    // VISTA DE DASHBOARD PRINCIPAL
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
        
        {/* BOTÓN EXPORTAR CON EL MISMO ESTILO */}
        <button className="btn-add btn-export" onClick={downloadCSV}>
            📥 Exportar
        </button>
        
        <input className="search-input" type="text" placeholder="Buscar..." onChange={e => setSearchTerm(e.target.value)} />
    </div>
</header>

                <div className="table-section">
                    <table>
                        <thead>
                            <tr>
                                {data.length > 0 && Object.keys(data[0]).map(k => <th key={k}>{k.replace('_',' ').toUpperCase()}</th>)}
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))).map((row, i) => (
                                <tr key={i}>
                                    {Object.entries(row).map(([k, v], j) => <td key={j}>{formatValue(k, v)}</td>)}
                                    <td className="actions-cell">
                                        <button className="btn-edit" onClick={() => { setSelectedRow({...row}); setIsEditModalOpen(true); }}>✏️</button>
                                        <button className="btn-delete" onClick={() => { setSelectedRow(row); setIsDeleteModalOpen(true); }}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <footer className="footer-credits">
                    <p>Aplicación web desarrollada por: <strong>Oscar Mangut Durán</strong></p>
                    <div className="social-icons">
                        <a href="https://www.linkedin.com/in/oscar-mangut-dur%C3%A1n-775186177/" target="_blank" rel="noreferrer"><i className="fab fa-linkedin"></i></a>
                        <a href="https://www.instagram.com/oscarmangutdev/" target="_blank" rel="noreferrer"><i className="fab fa-instagram"></i></a>
                        <a href="https://www.behance.net/oscarmangutdurn" target="_blank" rel="noreferrer"><i className="fab fa-behance"></i></a>
                        <a href="https://www.youtube.com/@Oscarmangut" target="_blank" rel="noreferrer"><i className="fab fa-youtube"></i></a>
                    </div>
                </footer>
            </main>

            {/* MODALES */}
            {isEditModalOpen && (
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

            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-confirm">
                        <div className="icon-warning">⚠️</div>
                        <h3>¿Eliminar este registro?</h3>
                        <p>Esta acción no se puede deshacer.</p>
                        <div className="modal-btns">
                            <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>No, cancelar</button>
                            <button className="btn-danger" onClick={() => {
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