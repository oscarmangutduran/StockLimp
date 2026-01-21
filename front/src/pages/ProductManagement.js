import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ProductManagement.css';

const ProductManagement = () => {
    const [activeTab, setActiveTab] = useState('productos');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Nombres exactos de tus tablas en phpMyAdmin
    const menuItems = [
        { id: 'productos', label: '📦 Productos' },
        { id: 'pedidos', label: '🛒 Pedidos' },
        { id: 'detalle_pedido', label: '📄 Detalle Pedidos' },
        { id: 'centros_trabajo', label: '🏢 Centros' },
        
    ];

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // IMPORTANTE: Verifica que 'stocklimp' sea el nombre de tu carpeta en htdocs
                const response = await axios.get(`http://localhost/stocklimp/back/index.php?resource=${activeTab}`);
                console.log("Datos de XAMPP:", response.data);
                setData(response.data);
            } catch (error) {
                console.error("Error conectando a XAMPP:", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeTab]);

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
                </header>

                <div className="table-section">
                    {loading ? (
                        <p>Cargando datos desde XAMPP...</p>
                    ) : data.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    {Object.keys(data[0]).map(key => <th key={key}>{key.toUpperCase()}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, i) => (
                                    <tr key={i}>
                                        {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No hay datos disponibles o error de conexión.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProductManagement;