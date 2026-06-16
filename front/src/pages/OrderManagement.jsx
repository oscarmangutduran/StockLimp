import React, { useState, useEffect } from 'react';
import { orderService, productService } from '../services/api';
import Modal from '../components/Modal';
import { saveAs } from 'file-saver';
import axios from 'axios'; // Importamos axios directo para la petición del blob corporativo
import '../css/OrderManagement.css';

const OrderManagement = ({ user }) => {
    const [orders, setOrders] = useState([]);
    const [productsList, setProductsList] = useState([]); 
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [selectedItems, setSelectedItems] = useState([{ id_producto: '', cantidad: 1 }]);

    const loadOrders = async () => {
        try {
            const res = await orderService.getAll();
            if (Array.isArray(res.data)) {
                setOrders(res.data);
            }
        } catch (err) {
            console.error("Error al cargar pedidos:", err);
        }
    };

    const loadProductsCatalog = async () => {
        try {
            const res = await productService.getAll();
            if (Array.isArray(res.data)) {
                setProductsList(res.data);
            }
        } catch (err) {
            console.error("Error al cargar catálogo:", err);
        }
    };

    useEffect(() => {
        loadOrders();
        loadProductsCatalog();
    }, []);

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const d = new Date(dateStr);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
        } catch (e) {
            return dateStr;
        }
    };

    // FUNCIÓN CORREGIDA: Descarga binaria directa desde Laravel
    const handleExportExcel = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/pedidos/exportar', {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            saveAs(blob, 'gestion_pedidos.xlsx');
        } catch (err) {
            console.error("Error al descargar el Excel de pedidos desde Laravel:", err);
            alert("No se pudo generar el listado Excel en este momento.");
        }
    };

    const handleOpenCreateModal = () => {
        setSelectedItems([{ id_producto: '', cantidad: 1 }]);
        setIsModalOpen(true);
    };

    const handleAddItemField = () => {
        setSelectedItems([...selectedItems, { id_producto: '', cantidad: 1 }]);
    };

    const handleRemoveItemField = (index) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const handleFieldChange = (index, field, value) => {
        const updated = [...selectedItems];
        updated[index][field] = value;
        setSelectedItems(updated);
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        const cleanProducts = selectedItems.filter(item => item.id_producto !== '');
        if (cleanProducts.length === 0) {
            alert("Debes seleccionar al menos un producto válido.");
            return;
        }

        try {
            const res = await orderService.createMultiple(user?.id_user, cleanProducts);
            if (res.data && res.data.success) {
                setIsModalOpen(false);
                loadOrders();
            } else {
                alert("Error al procesar la inserción transaccional en el servidor.");
            }
        } catch (err) {
            console.error("Error al crear el pedido múltiple:", err);
        }
    };

    const handleStatusChange = async (id_pedido, newStatus, originalDate) => {
        try {
            const res = await orderService.updateStatus(id_pedido, newStatus, originalDate);
            if (res.data && res.data.success) {
                loadOrders();
            } else {
                alert("No se pudo actualizar el estado del pedido.");
            }
        } catch (err) {
            console.error("Error al actualizar estado del pedido:", err);
        }
    };

    const handleOpenDetail = (order) => {
        setSelectedOrderDetails(order);
        setIsDetailOpen(true);
    };

    const filteredOrders = orders.filter(order => {
        const query = searchTerm.toLowerCase();
        return (
            order.id_pedido.toString().includes(query) ||
            order.operario.toLowerCase().includes(query) ||
            order.estado.toLowerCase().includes(query)
        );
    });

    return (
        <div className="order-container">
            <div className="order-header">
                <h1 className="order-title">GESTIÓN DE PEDIDOS</h1>
                <div className="order-header-actions">
                    <button className="btn-excel-export" onClick={handleExportExcel}>
                        <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Excel</span>
                    </button>

                    <button className="btn-add-order" onClick={handleOpenCreateModal}>
                        <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Nuevo</span>
                    </button>

                    <div className="search-wrapper">
                        <input type="text" className="search-input" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="table-card">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>id_pedido</th>
                            <th>operario</th>
                            <th>fecha_pedido</th>
                            <th>estado</th>
                            <th>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((order) => (
                            <tr key={order.id_pedido}>
                                <td className="cell-id"># {order.id_pedido}</td>
                                <td className="cell-operario">{order.operario}</td>
                                <td className="cell-date">{formatDateTime(order.fecha_pedido)}</td>
                                <td className="cell-status">
                                    <span className={`badge ${order.estado.toLowerCase()}`}>{order.estado}</span>
                                </td>
                                <td className="cell-actions">
                                    <div className="actions-wrapper">
                                        {user?.rol === 'admin' && (
                                            <div className="select-status-wrapper">
                                                <select className="select-status-sleek" value={order.estado} onChange={(e) => handleStatusChange(order.id_pedido, e.target.value, order.fecha_pedido)}>
                                                    <option value="PENDIENTE">Pendiente</option>
                                                    <option value="COMPLETADO">Completado</option>
                                                    <option value="CANCELADO">Cancelado</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="footer-container">
                <div className="footer-copyright">© 2026 StockLimp. Todos los derechos reservados.</div>
            </footer>

            {/* Modal Formulario */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Solicitud de Material">
                <form onSubmit={handleSubmitOrder}>
                    {selectedItems.map((item, index) => (
                        <div key={index} className="product-selection-row">
                            <select className="select-product-dropdown" value={item.id_producto} onChange={(e) => handleFieldChange(index, 'id_producto', e.target.value)} required>
                                <option value="">-- Selecciona un Producto --</option>
                                {productsList.map((prod) => (
                                    <option key={prod.id_producto} value={prod.id_producto}>{prod.nombre} (Stock: {prod.stock_actual})</option>
                                ))}
                            </select>
                            <input type="number" className="input-quantity" min="1" value={item.cantidad} onChange={(e) => handleFieldChange(index, 'cantidad', e.target.value)} required />
                            {selectedItems.length > 1 && (
                                <button type="button" className="btn-remove-item" onClick={() => handleRemoveItemField(index)}>&times;</button>
                            )}
                        </div>
                    ))}
                    <button type="button" className="btn-add-item-field" onClick={handleAddItemField}>+ Añadir otro producto</button>
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-submit" style={{ backgroundColor: '#10b981' }}>Enviar Solicitud</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default OrderManagement;