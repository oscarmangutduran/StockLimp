import React, { useState } from 'react';
import { fetchResourceData } from '../services/ProductService';
import '../css/ProductManagement.css';

const ProductManagement = () => {
    const [dataList, setDataList] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentResource, setCurrentResource] = useState('productos');

    const availableModules = [
        { id: 'productos', label: '📦 Productos' },
        { id: 'pedidos', label: '🚚 Pedidos' },
        { id: 'detalle_pedido', label: '📋 Detalles' },
        { id: 'centros_trabajo', label: '🏢 Centros' }
    ];

    const handleRefresh = async () => {
        setLoading(true);
        const result = await fetchResourceData(currentResource);
        setDataList(!result.error ? result : []);
        setLoading(false);
    };

    return (
        <div className="management-page">
            <div className="controls-bar">
                <select 
                    className="resource-select" 
                    value={currentResource} 
                    onChange={(e) => setCurrentResource(e.target.value)}
                >
                    {availableModules.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                </select>
                <button className="btn-load" onClick={handleRefresh} disabled={loading}>
                    {loading ? 'Cargando...' : 'Actualizar Tabla'}
                </button>
            </div>

            {dataList && dataList.length > 0 ? (
                <div className="table-container">
                    <table className="data-grid">
                        <thead>
                            <tr>
                                {Object.keys(dataList[0]).map(key => (
                                    <th key={key}>{key.replace('_', ' ')}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {dataList.map((row, i) => (
                                <tr key={i}>
                                    {Object.values(row).map((val, j) => (
                                        <td key={j}>
                                            {typeof val === 'boolean' ? (val ? '✅' : '❌') : String(val)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : dataList && <p className="empty-msg">No se encontraron registros disponibles.</p>}
        </div>
    );
};

export default ProductManagement;