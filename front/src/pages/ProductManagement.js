import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ProductManagement.css';

const ProductManagement = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loginData, setLoginData] = useState({ user: '', pass: '' });
    const [activeTab, setActiveTab] = useState('productos');
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [newRow, setNewRow] = useState({});

    useEffect(() => { if (isLoggedIn) loadData(); }, [activeTab, isLoggedIn]);

    const loadData = async () => {
        const res = await axios.get(`http://localhost/StockLimp/back/index.php?resource=${activeTab}`);
        setData(res.data);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`http://localhost/StockLimp/back/index.php?resource=login`, loginData);
            if (res.data.success) { setUserData(res.data.user); setIsLoggedIn(true); }
            else { alert(res.data.message); }
        } catch (e) { alert("Error de conexión"); }
    };

    const executeAction = async (action, payload) => {
        const res = await axios.post(`http://localhost/StockLimp/back/index.php?resource=${activeTab}&action=${action}`, payload);
        if (res.data.success) {
            setIsAddModalOpen(false); setIsEditModalOpen(false); setIsDeleteModalOpen(false);
            loadData();
        } else { alert("Error en la operación"); }
    };

    // --- FORMATEO DE VALORES PARA LA TABLA ---
    const formatValue = (key, value) => {
        if (value === null || value === undefined) return '-';
        
        // 1. Mostrar SÍ/NO para toxicidad
        if (key === 'es_toxico') return value == 1 ? "SÍ" : "NO";
        
        // 2. Formato de Moneda para precios
        if (key.toLowerCase().includes('precio') || key.toLowerCase().includes('total')) {
            return `${parseFloat(value).toFixed(2)}€`;
        }
        
        // 3. Stock sin decimales
        if (key.toLowerCase().includes('stock') || key.toLowerCase().includes('cantidad')) {
            return Math.floor(value);
        }

        return value;
    };

    // --- RENDERIZADO DE INPUTS CON CALENDARIO Y SELECTOR ---
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
                    <input 
                        type={isDateField ? "date" : "text"} 
                        value={value || ''} 
                        disabled={isDisabled}
                        onChange={onChange}
                    />
                )}
            </div>
        );
    };

    if (!isLoggedIn) {
        return (
            <div className="login-container">
                <form className="login-card" onSubmit={handleLogin}>
                    <h1 className="login-logo">STOCKLIMP</h1>
                    <h2>Acceso Administrativo</h2>
                    <input type="text" placeholder="Email" onChange={e => setLoginData({...loginData, user: e.target.value})} />
                    <input type="password" placeholder="Contraseña" onChange={e => setLoginData({...loginData, pass: e.target.value})} />
                    <button type="submit" className="btn-login">Ingresar</button>
                </form>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-logo">STOCKLIMP</div>
                <div className="user-info-top">
                    <span className="user-icon">👤</span>
                    <span className="user-name-text">{userData?.nombre}</span>
                </div>
                <nav className="sidebar-nav">
                    <button className={activeTab === 'productos' ? 'active' : ''} onClick={() => setActiveTab('productos')}>📦 Productos</button>
                    <button className={activeTab === 'pedidos' ? 'active' : ''} onClick={() => setActiveTab('pedidos')}>🛒 Pedidos</button>
                    <button className={activeTab === 'centros_trabajo' ? 'active' : ''} onClick={() => setActiveTab('centros_trabajo')}>🏢 Centros</button>
                </nav>
                <button className="btn-logout" onClick={() => setIsLoggedIn(false)}>Cerrar Sesión</button>
            </aside>

            <main className="content">
                <header className="content-header">
                    <h2>GESTIÓN DE {activeTab.toUpperCase()}</h2>
                    <div className="header-actions">
                        <button className="btn-add" onClick={() => {
                            const empty = Object.keys(data[0] || {}).reduce((a,k)=>({...a,[k]:""}),{});
                            setNewRow(empty); setIsAddModalOpen(true);
                        }}>+ Nuevo</button>
                        <input className="search-input" type="text" placeholder="Buscar..." onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </header>

                <div className="table-section">
                    <table>
                        <thead>
                            <tr>
                                {data[0] && Object.keys(data[0]).map(k => <th key={k}>{k.replace('_',' ').toUpperCase()}</th>)}
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
            </main>

            {/* MODALES FUNCIONALES */}
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
                        <div className="modal-btns">
                            <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>No</button>
                            <button className="btn-danger" onClick={() => executeAction('delete', {id: selectedRow[Object.keys(selectedRow)[0]], column: Object.keys(selectedRow)[0]})}>Sí, Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;