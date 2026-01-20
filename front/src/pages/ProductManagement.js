import React, { useState } from 'react';
import { fetchResourceData } from '../services/ProductService';

const ProductManagement = () => {
    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resource, setResource] = useState('productos');

    // Definición de las tablas permitidas
    const modules = [
        { id: 'productos', label: '📦 Inventario de Productos' },
        { id: 'pedidos', label: '🚚 Órdenes de Pedido' },
        { id: 'detalle_pedido', label: '🔍 Detalle de Pedidos' },
        { id: 'centros_trabajo', label: '🏢 Centros de Trabajo' }
    ];

    const loadData = async () => {
        setLoading(true);
        const result = await fetchResourceData(resource);
        
        if (result && !result.error) {
            setList(result);
        } else {
            setList([]);
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1100px', margin: 'auto', fontFamily: 'Segoe UI, sans-serif' }}>
            <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                Panel de Control - StockLimp
            </h2>

            <div style={{ display: 'flex', gap: '15px', margin: '25px 0', alignItems: 'center' }}>
                <select 
                    value={resource} 
                    onChange={(e) => setResource(e.target.value)}
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
                >
                    {modules.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                </select>
                
                <button 
                    onClick={loadData} 
                    disabled={loading}
                    style={{ 
                        padding: '10px 25px', 
                        backgroundColor: '#3498db', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    {loading ? 'Consultando...' : 'Ver Registros'}
                </button>
            </div>

            {list && list.length > 0 ? (
                <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8f9fa' }}>
                            <tr>
                                {Object.keys(list[0]).map(key => (
                                    <th key={key} style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textAlign: 'left', textTransform: 'uppercase', fontSize: '13px' }}>
                                        {key.replace('_', ' ')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((row, i) => (
                                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                                    {Object.values(row).map((val, j) => (
                                        <td key={j} style={{ padding: '12px', borderBottom: '1px solid #eee', fontSize: '14px', color: '#444' }}>
                                            {typeof val === 'boolean' ? (val ? '✅' : '❌') : String(val)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : list && (
                <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>No hay registros para mostrar en esta sección.</p>
            )}
        </div>
    );
};

export default ProductManagement;