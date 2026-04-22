import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import '../css/ProductManagement.css';

const ProductManagement = ({ userData, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // 1. Extraemos la pestaña directamente de la ruta real del navegador
    // Si la URL es /pedidos, activeTab será 'pedidos'
    const activeTab = location.pathname.split('/').pop() || 'productos';
    
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false); 
    
    const [selectedRow, setSelectedRow] = useState(null);
    const [newRow, setNewRow] = useState({});
    const [components, setComponents] = useState([]); 

    const isAdmin = userData?.rol === 'admin' || userData?.nombre === 'Oscar Mangut' || userData?.nombre === 'Admin Sistema';

    // 2. Función de carga que limpia el estado antes de pedir nuevos datos
    const loadData = useCallback(async () => {
        try {
            setData([]); // Limpieza visual inmediata para evitar "fantaseo" de tablas anteriores
            const res = await axios.get(`http://localhost/StockLimp/back/index.php?resource=${activeTab}&t=${new Date().getTime()}`);
            
            if (res.data && Array.isArray(res.data)) {
                setData(res.data);
            } else {
                setData([]);
            }
        } catch (e) { 
            console.error("Error cargando datos:", e);
            setData([]); 
        }
    }, [activeTab]);

    // 3. Este efecto vigila la URL. Si la URL cambia en el navegador, se recargan los datos.
    useEffect(() => {
        loadData();
    }, [location.pathname, loadData]);

    // 4. Navegación absoluta para asegurar que la URL cambie en el navegador
    const handleNavigate = (path) => {
        navigate(path); // path debe ser '/productos', '/pedidos', etc.
        setIsMenuOpen(false);
    };

    const showInfo = async (row) => {
        setSelectedRow(row);
        setComponents([]);
        setIsInfoModalOpen(true);
        if (activeTab === 'productos') {
            try {
                const res = await axios.get(`http://localhost/StockLimp/back/index.php?resource=componentes&id_producto=${row.id_producto}`);
                setComponents(res.data || []);
            } catch (e) { setComponents([]); }
        }
    };

    const formatValue = (key, value) => {
        if (value === null || value === undefined) return '-';
        if (key === 'es_toxico') return value == 1 ? "SÍ" : "NO";
        if (key.toLowerCase().includes('precio')) return `${parseFloat(value).toFixed(2)}€`;
        if (key.toLowerCase().includes('fecha') && value) return String(value).substring(0, 10);
        return value;
    };

    const executeAction = async (action, payload) => {
        try {
            const res = await axios.post(`http://localhost/StockLimp/back/index.php?resource=${activeTab}&action=${action}`, payload);
            if (res.data && res.data.success) {
                setIsAddModalOpen(false); setIsEditModalOpen(false); setIsDeleteModalOpen(false);
                loadData();
            } else { 
                alert(res.data?.message || "Error en la operación"); 
            }
        } catch (e) { 
            alert("Error de conexión"); 
        }
    };

    const renderInput = (key, value, onChange, isDisabled = false) => {
        const isDateField = key.toLowerCase().includes('fecha');
        return (
            <div className="form-group" key={key}>
                <label>{key.replace(/_/g, ' ').toUpperCase()}</label>
                <input 
                    type={isDateField ? "date" : "text"} 
                    value={value || ''} 
                    disabled={isDisabled} 
                    onChange={onChange} 
                />
            </div>
        );
    };

    const exportToExcel = () => {
        const filteredData = data.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase())));
        
        if (filteredData.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }

        const formattedData = filteredData.map(row => {
            const newRow = {};
            Object.entries(row).forEach(([key, value]) => {
                const formattedKey = key.replace(/_/g, ' ').toUpperCase();
                newRow[formattedKey] = formatValue(key, value);
            });
            return newRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.toUpperCase());

        XLSX.writeFile(workbook, `${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="dashboard-container">
            {isMenuOpen && (
                <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}></div>
            )}
            
            <button className="hamburger-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? '✕' : '☰'}
            </button>

            <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
                <div className="user-info-top">
                    <span className="user-icon">👤</span>
                    <span className="user-name-text">{userData?.nombre || 'Admin'}</span>
                </div>
                <nav className="sidebar-nav">
                    {/* USAMOS RUTAS ABSOLUTAS CON BARRA / */}
                    <button className={activeTab === 'productos' ? 'active' : ''} onClick={() => handleNavigate('/productos')}>📦 Productos</button>
                    <button className={activeTab === 'pedidos' ? 'active' : ''} onClick={() => handleNavigate('/pedidos')}>🛒 Pedidos</button>
                    <button className={activeTab === 'centros_trabajo' ? 'active' : ''} onClick={() => handleNavigate('/centros_trabajo')}>🏢 Centros</button>
                </nav>
                <button className="btn-logout" onClick={onLogout}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Cerrar Sesión
                </button>
            </aside>

            <main className="content">
                <header className="content-header">
                    <h2>GESTIÓN DE {activeTab.toUpperCase().replace(/_/g, ' ')}</h2>
                    <div className="header-actions">
                        <button className="btn-excel" onClick={exportToExcel}>📥 Excel</button>
                        {isAdmin && (
                            <button className="btn-add" onClick={() => {
                                const emptyRow = data.length > 0 ? Object.keys(data[0]).reduce((a,k)=>({...a,[k]:""}),{}) : {};
                                setNewRow(emptyRow);
                                setIsAddModalOpen(true);
                            }}>+ Nuevo</button>
                        )}
                        <input className="search-input" type="text" placeholder="Buscar..." onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </header>

                <div className="table-section">
                    <table>
                        <thead>
                            <tr>
                                {data.length > 0 ? (
                                    Object.keys(data[0]).map(k => (
                                        <th key={k}>{k.replace(/_/g,' ').toUpperCase()}</th>
                                    ))
                                ) : (
                                    <th>Cargando datos de {activeTab}...</th>
                                )}
                                {data.length > 0 && <th>ACCIONES</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {data
                                .filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase())))
                                .map((row, i) => (
                                <tr key={i}>
                                    {Object.entries(row).map(([k, v], j) => (
                                        <td key={j}>{formatValue(k, v)}</td>
                                    ))}
                                    <td className="actions-cell">
                                        {activeTab === 'productos' && (
                                            <button className="btn-info" onClick={() => showInfo(row)}>ℹ️</button>
                                        )}
                                        {isAdmin && (
                                            <>
                                                <button className="btn-edit" onClick={() => { setSelectedRow({...row}); setIsEditModalOpen(true); }}>✏️</button>
                                                <button className="btn-delete" onClick={() => { setSelectedRow(row); setIsDeleteModalOpen(true); }}>🗑️</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* MODALES (Mantener los que ya tenías) */}
            {isInfoModalOpen && selectedRow && (
                <div className="modal-overlay" onClick={() => setIsInfoModalOpen(false)}>
                    <div className="modal-content info-modal" onClick={e => e.stopPropagation()}>
                        <h3>Detalles</h3>
                        <div className="info-grid">
                            {Object.entries(selectedRow).map(([key, value]) => (
                                <div key={key} className="info-item">
                                    <label>{key.replace(/_/g, ' ').toUpperCase()}</label>
                                    <p>{formatValue(key, value)}</p>
                                </div>
                            ))}
                        </div>
                        {activeTab === 'productos' && components.length > 0 && (
                            <div className="components-list">
                                <h4>Composición Química:</h4>
                                <ul>
                                    {components.map((c, idx) => (
                                        <li key={idx}><span>{c.nombre_componente}</span> <strong>{c.porcentaje}%</strong></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <button className="btn-save" onClick={() => setIsInfoModalOpen(false)}>Cerrar</button>
                    </div>
                </div>
            )}

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

            {isDeleteModalOpen && selectedRow && (
                <div className="modal-overlay">
                    <div className="modal-confirm">
                        <h3>¿Eliminar registro?</h3>
                        <div className="modal-btns">
                            <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
                            <button className="btn-delete" onClick={() => {
                                const idKey = Object.keys(selectedRow)[0];
                                executeAction('delete', { id: selectedRow[idKey], column: idKey });
                            }}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;