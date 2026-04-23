import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import '../css/ProductManagement.css';

const ProductManagement = ({ userData, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const activeTab = location.pathname.split('/').pop() || 'productos';
    
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // Estados de Modales
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false); 
    
    const [selectedRow, setSelectedRow] = useState(null);
    const [newRow, setNewRow] = useState({});
    
    // Lógica de productos para pedidos
    const [allProducts, setAllProducts] = useState([]);
    const [orderQuantities, setOrderQuantities] = useState({});

    // Verificación de roles
    const isAdmin = userData?.rol === 'admin' || userData?.nombre === 'Oscar Mangut' || userData?.nombre === 'Admin Sistema';

    const loadData = useCallback(async () => {
        try {
            const res = await axios.get(`http://localhost/StockLimp/back/index.php?resource=${activeTab}&t=${new Date().getTime()}`);
            if (Array.isArray(res.data)) setData(res.data);
            
            if (activeTab === 'pedidos') {
                const resP = await axios.get(`http://localhost/StockLimp/back/index.php?resource=productos`);
                if (Array.isArray(resP.data)) setAllProducts(resP.data);
            }
        } catch (e) { console.error("Error al cargar datos:", e); }
    }, [activeTab]);

    useEffect(() => { loadData(); }, [loadData]);

    const formatValue = (key, value) => {
        if (value === null || value === undefined || value === "") return '-';
        if (key === 'es_toxico') return value == 1 ? "SÍ" : "NO";
        if (key.toLowerCase().includes('precio')) return `${parseFloat(value).toFixed(2)}€`;
        if (key.toLowerCase().includes('fecha') && value) return String(value).substring(0, 10);
        return value;
    };

    const exportToExcel = () => {
        if (!data || data.length === 0) return alert("No hay datos disponibles");
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.toUpperCase());
        
        const nombreArchivo = activeTab === 'pedidos' 
            ? `Detalle_Pedidos_Completo.xlsx` 
            : `Reporte_${activeTab}.xlsx`;

        XLSX.writeFile(workbook, nombreArchivo);
    };

    const executeAction = async (action, payload) => {
        try {
            const res = await axios.post(`http://localhost/StockLimp/back/index.php?resource=${activeTab}&action=${action}`, payload);
            if (res.data.success) {
                setIsAddModalOpen(false); 
                setIsEditModalOpen(false); 
                setIsDeleteModalOpen(false);
                setOrderQuantities({}); 
                loadData();
            } else { alert("Error: " + (res.data.message || "Operación fallida")); }
        } catch (e) { alert("Error de conexión"); }
    };

    const renderInput = (k, v, onChange, disabled = false) => (
        <div className="form-group" key={k}>
            <label>{k.replace(/_/g, ' ').toUpperCase()}</label>
            <input 
                type={k.toLowerCase().includes('fecha') ? "date" : "text"} 
                value={v || ''} 
                disabled={disabled} 
                onChange={onChange} 
            />
        </div>
    );

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="user-info-top"><span className="user-icon">👤</span> {userData?.nombre}</div>
                <nav className="sidebar-nav">
                    <button className={activeTab === 'productos' ? 'active' : ''} onClick={() => navigate('/productos')}>📦 Productos</button>
                    <button className={activeTab === 'pedidos' ? 'active' : ''} onClick={() => navigate('/pedidos')}>🛒 Pedidos</button>
                    <button className={activeTab === 'centros_trabajo' ? 'active' : ''} onClick={() => navigate('/centros_trabajo')}>🏢 Centros</button>
                </nav>
                <button className="btn-logout" onClick={onLogout}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Cerrar Sesión
                </button>
            </aside>

            <main className="content">
                <header className="content-header">
                    <h2>GESTIÓN DE {activeTab.toUpperCase()}</h2>
                    <div className="header-actions">
                        <button className="btn-excel" onClick={exportToExcel}>📥 Excel Detallado</button>
                        <button className="btn-add" onClick={() => {
                            const empty = data.length > 0 ? Object.keys(data[0]).reduce((a,k)=>({...a,[k]:""}),{}) : {};
                            setNewRow(empty);
                            setIsAddModalOpen(true);
                        }}>+ Nuevo</button>
                        <input className="search-input" placeholder="Buscar..." onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </header>

                <div className="table-section">
                    <table>
                        <thead>
                            <tr>
                                {data.length > 0 && Object.keys(data[0]).map(k => <th key={k}>{k}</th>)}
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))).map((row, i) => (
                                <tr key={i}>
                                    {Object.entries(row).map(([k, v], j) => <td key={j}>{formatValue(k, v)}</td>)}
                                    <td className="actions-cell">
                                        {isAdmin && activeTab === 'productos' && (
                                            <button className="btn-info" onClick={() => { setSelectedRow(row); setIsInfoModalOpen(true); }}>ℹ️</button>
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

            {/* MODAL INFO */}
            {isInfoModalOpen && selectedRow && (
                <div className="modal-overlay" onClick={() => setIsInfoModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Información Detallada</h3>
                        {Object.entries(selectedRow).map(([k, v]) => (
                            <p key={k}><strong>{k.replace(/_/g, ' ').toUpperCase()}:</strong> {formatValue(k, v)}</p>
                        ))}
                        <button className="btn-save" onClick={() => setIsInfoModalOpen(false)}>Cerrar</button>
                    </div>
                </div>
            )}

            {/* MODAL NUEVO / PEDIDO */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{activeTab === 'pedidos' ? 'Nuevo Pedido' : 'Añadir Registro'}</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (activeTab === 'pedidos') {
                                const items = Object.entries(orderQuantities)
                                    .filter(([_, q]) => q > 0)
                                    .map(([id, q]) => ({ id_producto: id, cantidad: q }));
                                if(items.length === 0) return alert("Introduce cantidades");
                                executeAction('create_pedido_multiple', { productos: items, id_user: userData.id_user });
                            } else { executeAction('create', newRow); }
                        }}>
                            {activeTab === 'pedidos' ? (
                                <div className="order-list-scroll" style={{maxHeight: '300px', overflowY: 'auto'}}>
                                    {allProducts.map(p => (
                                        <div key={p.id_producto} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #eee'}}>
                                            <span>{p.nombre}</span>
                                            <input type="number" min="0" style={{width:'60px'}} onChange={e => setOrderQuantities({...orderQuantities, [p.id_producto]: e.target.value})} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                Object.keys(newRow).map(k => renderInput(k, newRow[k], e => setNewRow({...newRow, [k]: e.target.value})))
                            )}
                            <div className="modal-btns">
                                <button type="submit" className="btn-save">Confirmar</button>
                                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EDITAR */}
            {isEditModalOpen && selectedRow && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Editar Registro</h3>
                        <form onSubmit={(e) => { e.preventDefault(); executeAction('update', selectedRow); }}>
                            {Object.keys(selectedRow).map((k, i) => 
                                renderInput(k, selectedRow[k], e => setSelectedRow({...selectedRow, [k]: e.target.value}), i === 0)
                            )}
                            <div className="modal-btns">
                                <button type="submit" className="btn-save">Actualizar</button>
                                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ELIMINAR */}
            {isDeleteModalOpen && selectedRow && (
                <div className="modal-overlay">
                    <div className="modal-confirm">
                        <h3>¿Confirmar eliminación?</h3>
                        <div className="modal-btns">
                            <button className="btn-delete" onClick={() => {
                                const idKey = Object.keys(selectedRow)[0];
                                executeAction('delete', { id: selectedRow[idKey], column: idKey });
                            }}>Eliminar</button>
                            <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;