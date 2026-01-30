import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ProductManagement.css';

const ProductManagement = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginData, setLoginData] = useState({ user: '', pass: '' });
    const [loginError, setLoginError] = useState("");
    const [userData, setUserData] = useState(null);

    const [activeTab, setActiveTab] = useState('productos');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

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

    useEffect(() => {
        if (isLoggedIn) loadData();
    }, [activeTab, isLoggedIn]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost/StockLimp/back/index.php?resource=${activeTab}`);
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (err) { setData([]); }
        finally { setLoading(false); }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError("");
        try {
            const res = await axios.post(`http://localhost/StockLimp/back/index.php?resource=login`, loginData);
            if (res.data.success) {
                setUserData(res.data.user);
                setIsLoggedIn(true);
            } else { setLoginError(res.data.message); }
        } catch (err) { setLoginError("Error de conexión con el servidor"); }
    };

    const formatHeader = (key) => {
        const mapping = {
            'id_user': 'ID', 'nombre': 'NOMBRE', 'email': 'EMAIL',
            'id_producto': 'ID', 'sku': 'SKU', 'es_toxico': '¿TÓXICO?',
            'precio_unidad': 'PRECIO', 'stock_actual': 'STOCK',
            'id_centro': 'ID', 'nombre_centro': 'CENTRO', 'direccion': 'DIRECCIÓN', 'contacto': 'CONTACTO'
        };
        return mapping[key] || key.toUpperCase().replace('_', ' ');
    };

    const formatValue = (key, value) => {
        if (value === null) return '-';
        if (key === 'es_toxico') return value == 1 ? '⚠️ SÍ' : '✅ NO';
        if (key.includes('precio') || key.includes('total')) return `${parseFloat(value).toFixed(2)}€`;
        if (key === 'stock_actual') return parseInt(value);
        if (key.includes('fecha')) return value.split(' ')[0];
        return value;
    };

    if (!isLoggedIn) {
        return (
            <div className="login-container">
                <form className="login-card" onSubmit={handleLogin}>
                    <div className="login-logo">STOCKLIMP</div>
                    <h2>Acceso Administrativo</h2>
                    {loginError && <div className="login-error">{loginError}</div>}
                    <input type="text" placeholder="Email (admin@stocklimp.com)" required onChange={e => setLoginData({...loginData, user: e.target.value})} />
                    <input type="password" placeholder="Contraseña" required onChange={e => setLoginData({...loginData, pass: e.target.value})} />
                    <button type="submit" className="btn-login">Ingresar</button>
                </form>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-logo">STOCKLIMP</div>
                <div className="user-tag">👤 {userData?.nombre}</div>
                <nav className="sidebar-nav">
                    {menuItems.map(item => (
                        <button key={item.id} className={activeTab === item.id ? 'active' : ''} onClick={() => setActiveTab(item.id)}>{item.label}</button>
                    ))}
                </nav>
                <button className="btn-logout" onClick={() => setIsLoggedIn(false)}>Cerrar Sesión</button>
            </aside>

            <main className="content">
                <header className="content-header">
                    <h2>Gestión de {activeTab.toUpperCase()}</h2>
                    <div className="header-actions">
                        <button className="btn-add" onClick={() => {
                            const empty = Object.keys(data[0] || {}).reduce((a, k) => ({...a, [k]: ""}), {});
                            setNewRow(empty); setIsAddModalOpen(true);
                        }}>➕ Nuevo</button>
                        <input className="search-input" type="text" placeholder="Buscar..." onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </header>

                <div className="table-section">
                    {loading ? <p>Cargando...</p> : (
                        <table>
                            <thead>
                                <tr>
                                    {data[0] && Object.keys(data[0]).map(key => <th key={key}>{formatHeader(key)}</th>)}
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
                    )}
                </div>
            </main>
            {/* ... aquí incluirías los modales de añadir/editar/eliminar que ya teníamos ... */}
        </div>
    );
};

export default ProductManagement;