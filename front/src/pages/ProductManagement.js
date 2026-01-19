import React, { useState } from 'react';
import { fetchResourceData } from '../services/ProductService';

const ProductManagement = () => {
    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resource, setResource] = useState('productos');

    const menuTablas = [
        { id: 'productos', name: '📦 Productos' },
        { id: 'users', name: '👥 Usuarios' },
        { id: 'pedidos', name: '🚚 Pedidos' },
        { id: 'detalle_pedido', name: '📋 Detalles' },
        { id: 'centros_trabajo', name: '🏢 Centros' }
    ];

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchResourceData(resource);
            if (result && !result.error) {
                setList(result);
            } else {
                setError(result.message || "Error al obtener datos.");
            }
        } catch (err) {
            setError("Error de conexión con el backend.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1100px', margin: 'auto', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
            <h1 style={{ color: '#2c3e50', textAlign: 'center' }}>StockLimp Admin</h1>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '30px', background: '#ecf0f1', padding: '20px', borderRadius: '10px' }}>
                <select 
                    value={resource} 
                    onChange={(e) => setResource(e.target.value)}
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #bdc3c7', minWidth: '200px' }}
                >
                    {menuTablas.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button 
                    onClick={loadData} 
                    disabled={loading}
                    style={{ padding: '10px 25px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {loading ? 'Cargando...' : 'Cargar Tabla'}
                </button>
            </div>

            {error && <p style={{ color: '#e74c3c', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>}

            {list && list.length > 0 ? (
                <div style={{ overflowX: 'auto', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                        <thead>
                            <tr style={{ background: '#34495e', color: 'white' }}>
                                {Object.keys(list[0]).map(key => (
                                    <th key={key} style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{key.toUpperCase()}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #eee', backgroundColor: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                    {Object.values(row).map((val, j) => (
                                        <td key={j} style={{ padding: '12px' }}>
                                            {typeof val === 'boolean' ? (val ? '✅' : '❌') : String(val)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                list && <p style={{ textAlign: 'center' }}>No hay registros disponibles en esta tabla.</p>
            )}
        </div>
    );
};

export default ProductManagement;