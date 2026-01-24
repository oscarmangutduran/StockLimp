import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ProductManagement.css';

const ProductManagement = () => {
    // --- ESTADO DE ACCESO ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // --- ESTADOS DE LA GESTIÓN ---
    const [activeTab, setActiveTab] = useState('productos');
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [selectedRow, setSelectedRow] = useState(null);
    const [newRow, setNewRow] = useState({});

    const menuItems = [
        { id: 'productos', label: '📦 Productos' },
        { id: 'pedidos', label: '🛒 Pedidos' },
        { id: 'centros_trabajo', label: '🏢 Centros' }
    ];

    // Carga de datos
    useEffect(() => {
        if (isLoggedIn) loadData();
    }, [activeTab, isLoggedIn]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost/stocklimp/back/index.php?resource=${activeTab}`);
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (err) { setData([]); }
        finally { setLoading(false); }
    };

    // --- FUNCIONES DE FORMATEO ---
    const formatHeader = (key) => {
        const mapping = {
            'id_producto': 'ID', 'nombre_producto': 'NOMBRE', 'es_toxico': '¿TÓXICO?',
            'precio_unidad': 'PVP UNIDAD', 'id_pedido': 'Nº PEDIDO', 'fecha_pedido': 'FECHA',
            'estado_pedido': 'ESTADO', 'total_pedido': 'TOTAL', 'id_centro': 'ID',
            'nombre_centro': 'CENTRO', 'direccion_centro': 'DIRECCIÓN', 'telefono_centro': 'TELÉFONO'
        };
        return mapping[key] || key.toUpperCase().replace('_', ' ');
    };

    const formatValue = (key, value) => {
        if (value === null || value === undefined) return '-';
        if (key.includes('precio') || key.includes('total') || key === 'subtotal') return `${parseFloat(value).toFixed(2)}€`;
        if (key === 'es_toxico') return (value === 1 || value === "1" || value === true) ? '⚠️ SÍ' : '✅ NO';
        if (key.includes('stock') || key === 'cantidad') return parseInt(value);
        if (key.toLowerCase().includes('fecha')) return value.split(' ')[0];
        return value.toString();
    };

    // --- ACCIONES CRUD ---
    const handleAddClick = () => {
        if (data.length > 0) {
            const emptyRow = Object.keys(data[0]).reduce((acc, key) => { acc[key] = ""; return acc; }, {});
            setNewRow(emptyRow);
            setIsAddModalOpen(true);
        }
    };

    const handleSaveNew = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`http://localhost/stocklimp/back/index.php?resource=${activeTab}&action=create`, newRow);
            setIsAddModalOpen(false);
            loadData();
        } catch (err) { alert("Error al añadir"); }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`http://localhost/stocklimp/back/index.php?resource=${activeTab}&action=update`, selectedRow);
            setIsEditModalOpen(false);
            loadData();
        } catch (err) { alert("Error al actualizar"); }
    };

    const confirmDelete = async () => {
        const idCol = Object.keys(selectedRow)[0];
        try {
            await axios.post(`http://localhost/stocklimp/back/index.php?resource=${activeTab}&action=delete`, { id: selectedRow[idCol], column: idCol });
            setIsDeleteModalOpen(false);
            loadData();
        } catch (err) { alert("Error al eliminar"); }
    };

    const filteredData = data.filter(row => 
        Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const renderInput = (key, value, onChange, isDisabled = false) => {
        const isDateField = key.toLowerCase().includes('fecha');
        return (
            <div className="form-group" key={key}>
                <label>{formatHeader(key)}</label>
                <input type={isDateField ? "date" : "text"} value={value || ''} disabled={isDisabled} onChange={onChange} />
            </div>
        );
    };

    // --- VISTA DE ENTRADA (SOLO BOTÓN) ---
    if (!isLoggedIn) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="login-logo">STOCKLIMP</div>
                    <h2>Bienvenido</h2>
                    <p>Pulsa el botón para acceder al panel de gestión.</p>
                    <button className="btn-login" onClick={() => setIsLoggedIn(true)}>
                        Entrar a la Aplicación
                    </button>
                </div>
            </div>
        );
    }

    // --- VISTA DE DASHBOARD ---
    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-logo">STOCKLIMP</div>
                <nav className="sidebar-nav">
                    {menuItems.map(item => (
                        <button key={item.id} className={activeTab === item.id ? 'active' : ''} onClick={() => setActiveTab(item.id)}>
                            {item.label}
                        </button>
                    ))}
                </nav>
                <button className="btn-logout" onClick={() => setIsLoggedIn(false)}>🚪 Salir</button>
            </aside>

            <main className="content">
                <header className="content-header">
                    <h2>Gestión de {activeTab.toUpperCase()}</h2>
                    <div className="header-actions">
                        <button className="btn-add" onClick={handleAddClick}>➕ Nuevo Registro</button>
                        <input className="search-input" type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </header>

                <div className="table-section">
                    {loading ? <p className="status-info">Cargando...</p> : (
                        <table>
                            <thead>
                                <tr>
                                    {data[0] && Object.keys(data[0]).map(key => <th key={key}>{formatHeader(key)}</th>)}
                                    <th>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row, i) => (
                                    <tr key={i}>
                                        {Object.entries(row).map(([key, val], j) => <td key={j}>{formatValue(key, val)}</td>)}
                                        <td className="actions-cell">
                                            <button className="btn-edit" onClick={() => { setSelectedRow({...row}); setIsEditModalOpen(true); }}>✏️</button>
                                            <button className="btn-delete" onClick={() => { setSelectedRow(row); setIsDeleteModalOpen(true); }}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {/* MODALES */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="close-x" onClick={() => setIsAddModalOpen(false)}>&times;</button>
                        <h3>Añadir en {activeTab.toUpperCase()}</h3>
                        <form onSubmit={handleSaveNew}>
                            {Object.keys(newRow).map((key, i) => renderInput(key, newRow[key], (e) => setNewRow({...newRow, [key]: e.target.value}), i === 0))}
                            <div className="modal-btns">
                                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-save">Añadir</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="close-x" onClick={() => setIsEditModalOpen(false)}>&times;</button>
                        <h3>Editar Registro</h3>
                        <form onSubmit={handleSaveEdit}>
                            {Object.keys(selectedRow).map((key, i) => renderInput(key, selectedRow[key], (e) => setSelectedRow({...selectedRow, [key]: e.target.value}), i === 0))}
                            <div className="modal-btns">
                                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
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
                        <h3>¿Deseas eliminar este registro?</h3>
                        <div className="modal-btns">
                            <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
                            <button className="btn-danger" onClick={confirmDelete}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;