import React, { useState } from 'react';
import { fetchResourceData } from '../services/ProductService';

const ProductManagement = () => {
    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [resource, setResource] = useState('productos');

    const tables = [
        { id: 'productos', name: 'Catálogo de Productos' },
        { id: 'users', name: 'Gestión de Usuarios' },
        { id: 'pedidos', name: 'Historial de Pedidos' }
    ];

    const loadData = async () => {
        setLoading(true);
        setAlert(null);
        try {
            const result = await fetchResourceData(resource);
            if (result && !result.error) {
                setList(Array.isArray(result) ? result : []);
            } else {
                setAlert(result.message || "Error en la respuesta.");
            }
        } catch (err) {
            setAlert("Error de conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
            <h1 style={{ borderBottom: '2px solid #333' }}>Panel StockLimp</h1>
            
            <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
                <select value={resource} onChange={(e) => setResource(e.target.value)} style={{ padding: '8px' }}>
                    {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button onClick={loadData} disabled={loading} style={{ cursor: 'pointer' }}>
                    {loading ? 'Cargando...' : 'Ver Datos'}
                </button>
            </div>

            {alert && <p style={{ color: 'red' }}>{alert}</p>}

            {list && (
                <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#eee' }}>
                        <tr>
                            {Object.keys(list[0] || {}).map(h => <th key={h} style={{ padding: '10px' }}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((row, i) => (
                            <tr key={i}>
                                {Object.values(row).map((val, j) => <td key={j} style={{ padding: '8px' }}>{String(val)}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ProductManagement;