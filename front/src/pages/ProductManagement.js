import React, { useState } from 'react';
import { fetchResourceData } from '../services/ProductService';

const ProductManagement = () => {
    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resource, setResource] = useState('productos');

    // Mapeo de tablas para el menú desplegable
    const tables = [
        { id: 'productos', name: '📦 Inventario' },
        { id: 'users', name: '👥 Usuarios' },
        { id: 'pedidos', name: '🚚 Pedidos' },
        { id: 'detalle_pedido', name: '📋 Detalle Pedidos' },
        { id: 'centros_trabajo', name: '🏢 Sedes/Centros' }
    ];

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchResourceData(resource);
            if (result && !result.error) {
                setList(result);
            } else {
                setError(result.message || "Error al cargar datos.");
            }
        } catch (err) {
            setError("Error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
                Admin StockLimp
            </h1>

            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Seleccionar Recurso:</label>
                    <select 
                        value={resource} 
                        onChange={(e) => setResource(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <button 
                    onClick={loadData} 
                    disabled={loading}
                    style={{ padding: '10px 25px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {loading ? 'Cargando...' : 'Consultar'}
                </button>
            </div>

            {error && <div style={{ color: 'red', background: '#ffdada', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>⚠️ {error}</div>}

            {list && list.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                        <thead>
                            <tr style={{ background: '#34495e', color: 'white' }}>
                                {Object.keys(list[0]).map(key => (
                                    <th key={key} style={{ padding: '12px', textAlign: 'left', textTransform: 'uppercase', fontSize: '12px' }}>
                                        {key.replace('_', ' ')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((row, i) => (
                                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f2f2f2', borderBottom: '1px solid #ddd' }}>
                                    {Object.values(row).map((val, j) => (
                                        <td key={j} style={{ padding: '12px', fontSize: '14px' }}>
                                            {typeof val === 'boolean' ? (val ? '✅' : '❌') : String(val)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                list && <p>No hay datos disponibles en esta tabla.</p>
            )}
        </div>
    );
};

export default ProductManagement;