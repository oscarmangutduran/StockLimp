import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import '../css/ProductManagement.css';

const ProductManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loginData, setLoginData] = useState({ user: '', pass: '' });
    
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [components, setComponents] = useState([]);

    const activeTab = location.pathname.split('/')[1] || 'productos';

    useEffect(() => {
        if (isLoggedIn) fetchTableData();
    }, [activeTab, isLoggedIn]);

    const fetchTableData = async () => {
        try {
            const res = await axios.get(`http://localhost/StockLimp/back/index.php?resource=${activeTab}`);
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (e) { setData([]); }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`http://localhost/StockLimp/back/index.php?resource=login`, {
                user: loginData.user,
                pass: loginData.pass
            });
            if (res.data.success) {
                setUserData(res.data.user);
                setIsLoggedIn(true);
                navigate('/productos');
            } else { alert(res.data.message); }
        } catch (e) { alert("Servidor no disponible"); }
    };

    const showInfo = async (row) => {
        setSelectedRow(row);
        setIsInfoModalOpen(true);
        if (activeTab === 'productos') {
            const res = await axios.get(`http://localhost/StockLimp/back/index.php?resource=componentes&id_producto=${row.id_producto}`);
            setComponents(res.data || []);
        }
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.toUpperCase());
        XLSX.writeFile(workbook, `StockLimp_${activeTab}.xlsx`);
    };

    if (!isLoggedIn) {
        return (
            <div className="login-wrapper">
                <form className="login-form" onSubmit={handleLogin}>
                    <h1>STOCKLIMP</h1>
                    <input type="text" placeholder="Email" onChange={e => setLoginData({...loginData, user: e.target.value})} required />
                    <input type="password" placeholder="Contraseña" onChange={e => setLoginData({...loginData, pass: e.target.value})} required />
                    <button type="submit">INGRESAR</button>
                </form>
            </div>
        );
    }

    return (
        <div className="app-container">
            <aside className="nav-sidebar">
                <h2>STOCKLIMP</h2>
                <p>Bienvenido, {userData?.nombre}</p>
                <button onClick={() => navigate('/productos')}>PRODUCTOS</button>
                <button onClick={() => navigate('/pedidos')}>PEDIDOS</button>
                <button onClick={() => navigate('/centros_trabajo')}>CENTROS</button>
                <button className="btn-exit" onClick={() => setIsLoggedIn(false)}>SALIR</button>
            </aside>

            <main className="view-content">
                <header className="view-header">
                    <h3>GESTIÓN DE {activeTab.toUpperCase()}</h3>
                    <div className="view-actions">
                        <button className="btn-excel" onClick={exportToExcel}>📊 EXPORTAR</button>
                        <input type="text" placeholder="Filtrar..." onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </header>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                {data.length > 0 && Object.keys(data[0]).map(k => <th key={k}>{k.replace('_',' ').toUpperCase()}</th>)}
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))).map((row, i) => (
                                <tr key={i}>
                                    {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
                                    <td><button onClick={() => showInfo(row)}>ℹ️</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {isInfoModalOpen && selectedRow && (
                <div className="info-modal">
                    <div className="modal-inner">
                        <h4>Ficha: {selectedRow.nombre || 'Detalle'}</h4>
                        <div className="comp-box">
                            {activeTab === 'productos' ? components.map((c, i) => (
                                <p key={i}><strong>{c.nombre_componente}:</strong> {c.porcentaje}</p>
                            )) : <p>Detalles generales de {activeTab}.</p>}
                        </div>
                        <button onClick={() => setIsInfoModalOpen(false)}>CERRAR</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;