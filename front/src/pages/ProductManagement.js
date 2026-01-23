import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ProductManagement.css';

const ProductManagement = () => {
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

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost/stocklimp/back/index.php?resource=${activeTab}`);
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (err) { setData([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [activeTab]);

    // --- LÓGICA DE FORMATEO PARA TODAS LAS TABLAS ---

    const formatHeader = (key) => {
        const mapping = {
            // Productos
            'id_producto': 'ID',
            'nombre_producto': 'NOMBRE',
            'es_toxico': '¿TÓXICO?',
            'precio_unidad': 'PVP UNIDAD',
            // Pedidos
            'id_pedido': 'Nº PEDIDO',
            'fecha_pedido': 'FECHA',
            'estado_pedido': 'ESTADO',
            'total_pedido': 'TOTAL',
            // Centros
            'id_centro': 'ID',
            'nombre_centro': 'CENTRO',
            'direccion_centro': 'DIRECCIÓN',
            'telefono_centro': 'TELÉFONO'
        };
        return mapping[key] || key.toUpperCase().replace('_', ' ');
    };

    const formatValue = (key, value) => {
        if (value === null || value === undefined) return '-';

        // 1. Precios y Totales (Moneda)
        if (key.includes('precio') || key.includes('total') || key === 'subtotal') {
            return `${parseFloat(value).toFixed(2)}€`;
        }

        // 2. Lógica Booleana (Tóxico)
        if (key === 'es_toxico') {
            return (value === 1 || value === "1" || value === true) ? '⚠️ SÍ' : '✅ NO';
        }

        // 3. Stock y Cantidades (Enteros)
        if (key.includes('stock') || key === 'cantidad') {
            return parseInt(value);
        }

        // 4. Fechas (Solo YYYY-MM-DD)
        if (key.toLowerCase().includes('fecha')) {
            return value.split(' ')[0];
        }

        // 5. Estados de Pedido (Capitalizar)
        if (key === 'estado_pedido') {
            return value.charAt(0).toUpperCase() + value.slice(1);
        }

        return value.toString();
    };

    // --- MANEJADORES DE EVENTOS ---

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
        } catch (err) { alert("Error al añadir registro"); }
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
                <input 
                    type={isDateField ? "date" : "text"} 
                    value={value || ''} 
                    disabled={isDisabled}
                    onChange={onChange} 
                />
            </div>
        );
    };

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
                    {loading ? <p className="status-info">Cargando datos...</p> : (
                        <table>
                            <thead>
                                <tr>
                                    {data[0] && Object.keys(data[0]).map(key => (
                                        <th key={key}>{formatHeader(key)}</th>
                                    ))}
                                    <th>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row, i) => (
                                    <tr key={i}>
                                        {Object.entries(row).map(([key, val], j) => (
                                            <td key={j}>{formatValue(key, val)}</td>
                                        ))}
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

            {/* MODAL AÑADIR */}
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

            {/* MODAL EDITAR */}
            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="close-x" onClick={() => setIsEditModalOpen(false)}>&times;</button>
                        <h3>Editar {formatHeader(Object.keys(selectedRow)[0])}: {Object.values(selectedRow)[0]}</h3>
                        <form onSubmit={handleSaveEdit}>
                            {Object.keys(selectedRow).map((key, i) => renderInput(key, selectedRow[key], (e) => setSelectedRow({...selectedRow, [key]: e.target.value}), i === 0))}
                            <div className="modal-btns">
                                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-save">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ELIMINAR */}
            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-confirm">
                        <div className="icon-warning">⚠️</div>
                        <h3>¿Deseas eliminar este registro?</h3>
                        <p>Se borrará permanentemente de la tabla {activeTab}.</p>
                        <div className="modal-btns">
                            <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
                            <button className="btn-danger" onClick={confirmDelete}>Confirmar Borrado</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;