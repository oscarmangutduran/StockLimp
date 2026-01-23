import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ProductManagement.css';

const ProductManagement = () => {
    const [activeTab, setActiveTab] = useState('productos');
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState(""); // Estado para el buscador
    const [loading, setLoading] = useState(false);

    const menuItems = [
        { id: 'productos', label: '📦 Productos' },
        { id: 'pedidos', label: '🛒 Pedidos' },
       
        { id: 'centros_trabajo', label: '🏢 Centros' }
    ];

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setSearchTerm(""); // Limpiar buscador al cambiar de tabla
            try {
                const response = await axios.get(`http://localhost/stocklimp/back/index.php?resource=${activeTab}`);
                setData(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Error conectando a XAMPP:", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeTab]);

    // LÓGICA DEL BUSCADOR: Filtra los datos según el searchTerm
    const filteredData = data.filter((row) => {
        return Object.values(row).some((value) =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

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
                    <h2>Gestión de {activeTab.replace('_', ' ').toUpperCase()}</h2>
                    
                    {/* BUSCADOR DINÁMICO */}
                    <div className="search-box">
                        <input 
                            type="text" 
                            placeholder={`Buscar en ${activeTab}...`} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </header>

                <div className="table-section">
                    {loading ? (
                        <p className="status-info">Cargando registros...</p>
                    ) : filteredData.length > 0 ? (
                        <div className="scroll-table">
                            <table>
                                <thead>
                                    <tr>
                                        {Object.keys(filteredData[0]).map(key => (
                                            <th key={key}>{key.toUpperCase()}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row, i) => (
                                        <tr key={i}>
                                            {Object.values(row).map((val, j) => (
                                                <td key={j}>{val !== null ? val.toString() : '-'}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="status-info">
                            {searchTerm ? "No se encontraron resultados para tu búsqueda." : "No hay datos disponibles."}
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProductManagement;