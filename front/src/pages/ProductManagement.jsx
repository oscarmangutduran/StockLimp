// front/src/pages/ProductManagement.jsx
import React, { useState } from 'react';
import { fetchResourceData } from '../services/ProductService'; 

function ProductManagement() {
    const [data, setData] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); 
    const [selectedResource, setSelectedResource] = useState('productos');

    const resourceOptions = [
        { value: 'productos', label: 'Productos' },
        { value: 'users', label: 'Usuarios' },
        { value: 'pedidos', label: 'Pedidos' },
        { value: 'centros_trabajo', label: 'Centros de Trabajo' },
        { value: 'detalle_pedido', label: 'Detalle de Pedido' },
    ];
    
    const handleFetchData = async () => {
        setData(null);
        setLoading(true);
        setError(null);
        
        try {
            const fetchedData = await fetchResourceData(selectedResource); 
            
            console.log(`Datos recibidos para el recurso "${selectedResource}":`, fetchedData); 

            if (Array.isArray(fetchedData)) {
                setData(fetchedData);
            } else if (fetchedData && fetchedData.message) {
                setError(`API ERROR: ${fetchedData.message}`);
                setData([]);
            } else {
                setError("Fallo: La API devolvió un formato de datos inesperado.");
                setData([]);
            }
        } catch (err) {
            console.error("Fallo de conexión:", err);
            setError(`Fallo de conexión. Revisa XAMPP y el enrutamiento de la API.`);
        } finally {
            setLoading(false);
        }
    };
    
    const renderTable = () => {
        if (data === null) {
            return <p>Selecciona una tabla y haz clic en "Mostrar Datos".</p>;
        }
        
        if (data.length === 0) {
            return <p>No se encontraron datos en la tabla **"{selectedResource}"**.</p>;
        }
        
        // Renderizado genérico
        const headers = Object.keys(data[0]);

        return (
            <div style={{ overflowX: 'auto' }}>
                <p style={{marginTop: '20px', fontWeight: 'bold'}}>Datos de la tabla: {selectedResource} ({data.length} filas)</p>
                <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                            {headers.map(header => (
                                <th key={header} style={{textTransform: 'uppercase'}}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index}> 
                                {headers.map(header => (
                                    <td key={header}>{String(row[header])}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>StockLimp</h1>
            
            <div style={{ margin: '20px 0', border: '1px solid #ccc', padding: '15px', borderRadius: '5px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                
                <label htmlFor="resource-select" style={{ fontWeight: 'bold' }}>
                    Seleccionar Tabla:
                </label>
                <select 
                    id="resource-select" 
                    value={selectedResource} 
                    onChange={(e) => setSelectedResource(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px' }}
                    disabled={loading}
                >
                    {resourceOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                
                <button 
                    onClick={handleFetchData}
                    disabled={loading}
                    style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                    {loading ? 'Cargando...' : 'Mostrar Datos'}
                </button>
            </div>

            {error && <div style={{ color: 'red', padding: '10px', border: '1px solid red', backgroundColor: '#fee', borderRadius: '4px', marginBottom: '15px' }}>⚠️ **Error de Carga:** {error}</div>}

            {renderTable()}
        </div>
    );
}

export default ProductManagement;