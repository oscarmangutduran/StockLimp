import React, { useState } from 'react';
import { fetchResourceData } from '../services/ProductService';

const ProductManagement = () => {
    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [resource, setResource] = useState('productos');

    // Mapeo de tablas del sistema
    const tables = [
        { id: 'productos', name: 'Catálogo de Productos' },
        { id: 'users', name: 'Gestión de Usuarios' },
        { id: 'pedidos', name: 'Historial de Pedidos' },
        { id: 'centros_trabajo', name: 'Centros Operativos' },
        { id: 'detalle_pedido', name: 'Desglose de Pedidos' }
    ];

    const loadData = async () => {
        setLoading(true);
        setAlert(null);
        
        try {
            const result = await fetchResourceData(resource);

            if (result && !result.error) {
                setList(Array.isArray(result) ? result : []);
            } else {
                setAlert(result.message || "Error al procesar la respuesta.");
                setList([]);
            }
        } catch (err) {
            setAlert("Error de conexión con el servidor local.");
        } finally {
            setLoading(false);
        }
    };

    const DynamicTable = () => {
        if (!list) return <p style={{ color: '#666' }}>Seleccione un módulo para visualizar los registros.</p>;
        if (list.length === 0) return <p>No se encontraron registros en este módulo.</p>;

        const cols = Object.keys(list[0]);

        return (
            <div className="table-container" style={{ marginTop: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                            {cols.map(col => (
                                <th key={col} style={{ padding: '12px', borderBottom: '2px solid #dee2e6', textTransform: 'capitalize' }}>
                                    {col.replace('_', ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                {cols.map(col => (
                                    <td key={col} style={{ padding: '10px' }}>{String(row[col])}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <header style={{ marginBottom: '30px', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
                <h1 style={{ margin: 0, color: '#efe7e7ff' }}>Sistema de Control StockLimp</h1>
            </header>

            <section style={{ background: '#fdfdfd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Módulo de consulta:</label>
                    <select 
                        value={resource} 
                        onChange={(e) => setResource(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                <button 
                    onClick={loadData}
                    disabled={loading}
                    style={{ marginTop: '22px', padding: '10px 25px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {loading ? 'Procesando...' : 'Consultar'}
                </button>
            </section>

            {alert && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba', borderRadius: '4px' }}>
                    <strong>Aviso:</strong> {alert}
                </div>
            )}

            <hr style={{ margin: '40px 0', border: '0', borderTop: '1px solid #eee' }} />

            <DynamicTable />
        </div>
    );
};

export default ProductManagement;