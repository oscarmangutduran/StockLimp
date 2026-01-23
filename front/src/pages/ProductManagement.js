import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ProductManagement.css';

const ProductManagement = () => {
    const [activeTab, setActiveTab] = useState('productos');
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Estados para controlar los 3 Popups
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
        } catch (err) { 
            console.error("Error cargando datos:", err);
            setData([]); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { loadData(); }, [activeTab]);

    // Lógica para preparar el formulario de "Añadir"
    const handleAddClick = () => {
        if (data.length > 0) {
            const emptyRow = Object.keys(data[0]).reduce((acc, key) => { 
                acc[key] = ""; 
                return acc; 
            }, {});
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
        } catch (err) { alert("Error al crear registro"); }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`http://localhost/stocklimp/back/index.php?resource=${activeTab}&action=update`, selectedRow);
            setIsEditModalOpen(false);
            loadData();
        } catch (err) { alert("Error al guardar cambios"); }
    };

    const confirmDelete = async () => {
        const idCol = Object.keys(selectedRow)[0];
        try {
            await axios.post(`http://localhost/stocklimp/back/index.php?resource=${activeTab}&action=delete`, { 
                id: selectedRow[idCol], 
                column: idCol 
            });
            setIsDeleteModalOpen(false);
            loadData();
        } catch (err) { alert("Error al eliminar"); }
    };

    const filteredData = data.filter(row => 
        Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Función auxiliar para renderizar inputs dinámicos (Texto o Fecha)
    const renderInput = (key, value, onChange, isDisabled = false) => {
        const isDateField = key.toLowerCase().includes('fecha');
        return (
            <div className="form-group" key={key}>
                <label>{key.toUpperCase().replace('_', ' ')}</label>
                <input 
                    type={isDateField ? "date" : "text"} 
                    value={value || ''} 
                    disabled={isDisabled}
                    placeholder={isDisabled ? "Automático (ID)" : ""}
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
                        <button 
                            key={item.id} 
                            className={activeTab === item.id ? 'active' : ''} 
                            onClick={() => setActiveTab(item.id)}
                        >
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
                        <input 
                            className="search-input" 
                            type="text" 
                            placeholder="Buscar..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </header>

                <div className="table-section">
                    {loading ? <p>Cargando datos...</p> : (
                        <table>
                            <thead>
                                <tr>
                                    {data[0] && Object.keys(data[0]).map(key => <th key={key}>{key.toUpperCase()}</th>)}
                                    <th>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row, i) => (
                                    <tr key={i}>
                                        {Object.values(row).map((val, j) => <td key={j}>{val ?? '-'}</td>)}
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

            {/* POPUP AÑADIR */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="close-x" onClick={() => setIsAddModalOpen(false)}>&times;</button>
                        <h3>Añadir en {activeTab.toUpperCase()}</h3>
                        <form onSubmit={handleSaveNew}>
                            {Object.keys(newRow).map((key, i) => 
                                renderInput(key, newRow[key], (e) => setNewRow({...newRow, [key]: e.target.value}), i === 0)
                            )}
                            <div className="modal-btns">
                                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-save">Añadir</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* POPUP EDITAR */}
            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="close-x" onClick={() => setIsEditModalOpen(false)}>&times;</button>
                        <h3>Editar Registro</h3>
                        <form onSubmit={handleSaveEdit}>
                            {Object.keys(selectedRow).map((key, i) => 
                                renderInput(key, selectedRow[key], (e) => setSelectedRow({...selectedRow, [key]: e.target.value}), i === 0)
                            )}
                            <div className="modal-btns">
                                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-save">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* POPUP ELIMINAR */}
            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-confirm">
                        <div className="icon-warning">⚠️</div>
                        <h3>¿Deseas eliminar este registro?</h3>
                        <p>Esta acción no se puede deshacer.</p>
                        <div className="modal-btns">
                            <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
                            <button className="btn-danger" onClick={confirmDelete}>Aceptar y Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;