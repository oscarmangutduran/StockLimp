import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ProductManagement.css';

const ProductManagement = () => {
    const [activeTab, setActiveTab] = useState('productos');
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Estados para controlar los Popups
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

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

    // --- LÓGICA DE ACTUALIZACIÓN ---
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`http://localhost/stocklimp/back/index.php?resource=${activeTab}&action=update`, selectedRow);
            if (res.data.success) {
                setIsEditModalOpen(false);
                loadData();
            }
        } catch (err) { alert("Error al guardar"); }
    };

    // --- LÓGICA DE ELIMINACIÓN REAL ---
    const confirmDelete = async () => {
        const idCol = Object.keys(selectedRow)[0];
        const idVal = selectedRow[idCol];
        try {
            const res = await axios.post(`http://localhost/stocklimp/back/index.php?resource=${activeTab}&action=delete`, { 
                id: idVal, 
                column: idCol 
            });
            if (res.data.success) {
                setIsDeleteModalOpen(false);
                loadData();
            } else {
                alert(res.data.message);
            }
        } catch (err) { alert("Error de conexión"); }
    };

    const filteredData = data.filter(row => 
        Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                    <div className="search-container">
                        <input className="search-input" type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </header>

                <div className="table-section">
                    {loading ? <p>Cargando...</p> : (
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

            {/* POPUP DE EDICIÓN */}
            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Editar Registro</h3>
                        <form onSubmit={handleSaveEdit}>
                            {Object.keys(selectedRow).map(key => (
                                <div className="form-group" key={key}>
                                    <label>{key}</label>
                                    <input type="text" value={selectedRow[key] || ''} 
                                        disabled={key === Object.keys(selectedRow)[0]}
                                        onChange={e => setSelectedRow({...selectedRow, [key]: e.target.value})} 
                                    />
                                </div>
                            ))}
                            <div className="modal-btns">
                                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-save">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* POPUP DE ELIMINACIÓN */}
            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-confirm">
                        <div className="icon-warning">⚠️</div>
                        <h3>¿Deseas eliminar este registro?</h3>
                        <p>Esta acción borrará los datos permanentemente de la base de datos.</p>
                        <div className="modal-btns">
                            <button type="button" className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
                            <button type="button" className="btn-danger" onClick={confirmDelete}>Aceptar y Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;