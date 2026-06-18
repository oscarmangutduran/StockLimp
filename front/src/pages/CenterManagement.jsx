import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { centerService } from '../services/api';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import '../css/CenterManagement.css';

const CenterManagement = ({ user }) => {
    const activeUser = user || JSON.parse(localStorage.getItem('user'));

    // Intentar leer del contexto centralizado
    const context = useOutletContext();
    const centersFromContext = context?.centers;
    const loadCentersFromContext = context?.loadCenters;

    const [centers, setCenters] = useState(centersFromContext || []);
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(6);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: 'Atención', message: '' });
    const showAlert = (message, title = 'Atención') => {
        setAlertModal({ isOpen: true, title, message });
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCenterDetails, setSelectedCenterDetails] = useState(null);
    const [centerToDelete, setCenterToDelete] = useState(null);
    const [currentCenter, setCurrentCenter] = useState(null); // null = Crear, objeto = Editar
    const [formData, setFormData] = useState({ nombre: '', direccion: '', ciudad: '' });

    // Sincronizar el estado local si el contexto cambia
    useEffect(() => {
        if (centersFromContext) {
            setCenters(centersFromContext);
        }
    }, [centersFromContext]);

    // Cargar los centros de trabajo desde la base de datos
    const loadCenters = async () => {
        if (loadCentersFromContext) {
            await loadCentersFromContext();
        } else {
            try {
                const res = await centerService.getAll();
                if (Array.isArray(res.data)) {
                    setCenters(res.data);
                }
            } catch (err) {
                console.error("Error al cargar centros de trabajo:", err);
            }
        }
    };

    useEffect(() => {
        if (!centersFromContext) {
            loadCenters();
        }
    }, []);

    // Helper para formatear fecha
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toISOString().split('T')[0];
    };

    // Función de exportación a Excel (Archivo .xlsx con columnas formateadas y autoajustadas mediante Base64)
    const handleExportExcel = () => {
        const exportData = centers.map(c => ({
            'ID Centro': c.id_centro,
            'Nombre de Centro': c.nombre || '',
            'Dirección Postal': c.direccion || 'N/A',
            'Ciudad / Localidad': c.ciudad || 'N/A',
            'Fecha de Registro': formatDate(c.fecha_registro)
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Autoajustar el ancho de las columnas
        const maxLen = {};
        exportData.forEach(row => {
            Object.keys(row).forEach(key => {
                const val = row[key];
                const valStr = val !== null && val !== undefined ? val.toString() : '';
                const keyLen = key.length;
                const valLen = valStr.length;
                const len = Math.max(keyLen, valLen);
                maxLen[key] = Math.max(maxLen[key] || 10, len);
            });
        });
        worksheet['!cols'] = Object.keys(maxLen).map(key => ({ wch: maxLen[key] + 3 }));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Centros de Trabajo");

        // Generar archivo binario y forzar descarga limpia usando file-saver para evitar bloqueos del navegador y problemas con gestores de descarga
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'gestion_centros.xlsx');
    };

    // Abrir modal en modo creación
    const handleOpenCreate = () => {
        setCurrentCenter(null);
        setFormData({ nombre: '', direccion: '', ciudad: '' });
        setIsModalOpen(true);
    };

    // Abrir modal en modo edición
    const handleOpenEdit = (center) => {
        setCurrentCenter(center);
        setFormData({
            nombre: center.nombre,
            direccion: center.direccion || '',
            ciudad: center.ciudad || ''
        });
        setIsModalOpen(true);
    };

    // Abrir modal de detalles (Info)
    const handleOpenDetail = (center) => {
        setSelectedCenterDetails(center);
        setIsDetailOpen(true);
    };

    // Procesar envío del formulario (Crear o Actualizar)
    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = currentCenter
            ? { ...formData, id_centro: currentCenter.id_centro }
            : formData;

        try {
            const res = currentCenter
                ? await centerService.update(payload)
                : await centerService.create(payload);
            if (res.data && res.data.success) {
                setIsModalOpen(false);
                loadCenters(); // Refrescar la tabla automáticamente
            } else {
                showAlert("Ocurrió un error en el servidor al guardar el centro.", "Error de Servidor");
            }
        } catch (err) {
            console.error("Error en la petición:", err);
        }
    };

    // Lanzar confirmación de eliminación en modal
    const confirmDelete = (center) => {
        setCenterToDelete(center);
        setIsDeleteModalOpen(true);
    };

    // Borrar un registro de centro de trabajo
    const handleDelete = async (id) => {
        try {
            const res = await centerService.delete(id);
            if (res.data && res.data.success) {
                setIsDeleteModalOpen(false);
                loadCenters();
            } else {
                showAlert("No se pudo eliminar el registro. Comprueba la integridad referencial.", "Error de Eliminación");
            }
        } catch (err) {
            console.error("Error al eliminar centro:", err);
        }
    };

    // Filtrado en tiempo real
    const filteredCenters = centers.filter(center => {
        const query = searchTerm.toLowerCase();
        return (
            center.id_centro.toString().includes(query) ||
            center.nombre.toLowerCase().includes(query) ||
            (center.ciudad && center.ciudad.toLowerCase().includes(query)) ||
            (center.direccion && center.direccion.toLowerCase().includes(query))
        );
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, recordsPerPage]);

    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredCenters.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredCenters.length / recordsPerPage);

    return (
        <div className="center-container">
            {/* Cabecera estilizada */}
            <div className="center-header">
                <h1 className="center-title">GESTIÓN DE CENTROS</h1>

                <div className="center-header-actions">
                    {/* Botón Excel */}
                    <button className="btn-excel-export" onClick={handleExportExcel}>
                        <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Excel</span>
                    </button>

                    {/* Botón Nuevo (Solo Admins) */}
                    {(activeUser?.rol === 'super_admin' || activeUser?.rol === 'admin') && (
                        <button className="btn-add-center" onClick={handleOpenCreate}>
                            <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>Nuevo</span>
                        </button>
                    )}

                    {/* Input de Búsqueda */}
                    <div className="search-wrapper">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Contenedor de la Tabla */}
            <div className="table-card">
                <table className="centers-table">
                    <thead>
                        <tr>
                            <th>ID Centro</th>
                            <th>Nombre</th>
                            <th>Dirección</th>
                            <th>Ciudad</th>
                            <th>Fecha de registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRecords.map((center) => (
                            <tr key={center.id_centro}>
                                <td className="cell-id">{center.id_centro}</td>
                                <td className="cell-nombre">{center.nombre}</td>
                                <td className="cell-direccion">
                                    {center.direccion ? (
                                        <a 
                                            href={`https://maps.google.com/?q=${encodeURIComponent(center.direccion + (center.ciudad ? ', ' + center.ciudad : ''))}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="address-map-link"
                                            title="Abrir ubicación en mapas"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', flexShrink: 0 }}>
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            <span>{center.direccion}</span>
                                        </a>
                                    ) : (
                                        'N/A'
                                    )}
                                </td>
                                <td className="cell-ciudad">{center.ciudad || 'N/A'}</td>
                                <td className="cell-date">{formatDate(center.fecha_registro)}</td>
                                <td className="cell-actions">
                                    <div className="actions-wrapper">

                                        {/* Botón Editar (Solo Admins) */}
                                        {(activeUser?.rol === 'super_admin' || activeUser?.rol === 'admin') && (
                                            <button
                                                className="action-btn btn-circle-edit"
                                                title="Editar"
                                                onClick={() => handleOpenEdit(center)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                        )}

                                        {/* Botón Borrar (Solo Admins) */}
                                        {(activeUser?.rol === 'super_admin' || activeUser?.rol === 'admin') && (
                                            <button
                                                className="action-btn btn-circle-delete"
                                                title="Borrar"
                                                onClick={() => confirmDelete(center)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {currentRecords.length === 0 && (
                            <tr>
                                <td colSpan={6} className="table-empty">
                                    No se encontraron centros de trabajo registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Contenedor de la Paginación */}
            <div className="pagination-container">
                <div className="pagination-limit-selector">
                    <label htmlFor="limit-select">Registros por página:</label>
                    <select 
                        id="limit-select" 
                        value={recordsPerPage} 
                        onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                        className="limit-dropdown"
                    >
                        <option value={3}>3</option>
                        <option value={6}>6</option>
                        <option value={9}>9</option>
                    </select>
                    <span className="pagination-info">
                        ({currentRecords.length} registros)
                    </span>
                </div>

                {totalPages > 1 && (
                    <div className="pagination-pages">
                        <button 
                            className="pagination-btn" 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                        <button 
                            className="pagination-btn" 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {/* Footer de la página */}
            <footer className="footer-container">
                <div className="footer-copyright">
                    © 2026 StockLimp. Todos los derechos reservados.
                </div>
                <div className="footer-socials">
                    <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-link">
                        <svg className="social-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                        </svg>
                        <span>INSTAGRAM</span>
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-link">
                        <svg className="social-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                            <rect x="2" y="9" width="4" height="12" />
                            <circle cx="4" cy="4" r="2" />
                        </svg>
                        <span>LINKEDIN</span>
                    </a>
                    <a href="https://behance.net" target="_blank" rel="noreferrer" className="social-link">
                        <svg className="social-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 12h8" />
                            <path d="M12 8v8" />
                        </svg>
                        <span>BEHANCE</span>
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-link">
                        <svg className="social-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                        </svg>
                        <span>YOUTUBE</span>
                    </a>
                </div>
            </footer>

            {/* Invocación del componente Modal reutilizable */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentCenter ? 'Editar Centro de Trabajo' : 'Añadir Nuevo Centro'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre del Centro</label>
                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Dirección</label>
                        <input
                            type="text"
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Ciudad</label>
                        <input
                            type="text"
                            value={formData.ciudad}
                            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit">
                            {currentCenter ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Detalles (Info) */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title="Detalles del Centro de Trabajo"
            >
                {selectedCenterDetails && (
                    <div className="detail-card-container">
                        <div className="detail-card-header">
                            <div className="detail-card-avatar">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 21h18" />
                                    <path d="M9 21V9a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v12" />
                                    <path d="M5 21V7a2 2 0 0 1 2-2h2" />
                                    <path d="M19 21V5a2 2 0 0 0-2-2H7" />
                                </svg>
                            </div>
                            <div className="detail-card-title-group">
                                <h4 className="detail-product-name">{selectedCenterDetails.nombre}</h4>
                                <span className="detail-product-sku">Ciudad: {selectedCenterDetails.ciudad || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="detail-grid">
                            <div className="detail-grid-item">
                                <span className="grid-label">ID CENTRO</span>
                                <span className="grid-value badge-id"># {selectedCenterDetails.id_centro}</span>
                            </div>

                            <div className="detail-grid-item">
                                <span className="grid-label">CIUDAD / LOCALIDAD</span>
                                <span className="grid-value">{selectedCenterDetails.ciudad || 'N/A'}</span>
                            </div>

                            <div className="detail-grid-item full-width">
                                <span className="grid-label">DIRECCIÓN POSTAL</span>
                                <span className="grid-value">
                                    {selectedCenterDetails.direccion ? (
                                        <a 
                                            href={`https://maps.google.com/?q=${encodeURIComponent(selectedCenterDetails.direccion + (selectedCenterDetails.ciudad ? ', ' + selectedCenterDetails.ciudad : ''))}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="address-map-link"
                                            title="Abrir ubicación en mapas"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', flexShrink: 0 }}>
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            {selectedCenterDetails.direccion}
                                        </a>
                                    ) : (
                                        'N/A'
                                    )}
                                </span>
                            </div>

                            <div className="detail-grid-item full-width">
                                <span className="grid-label">FECHA DE ALTA</span>
                                <span className="grid-value date-text">
                                    <svg className="icon-calendar" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    {formatDate(selectedCenterDetails.fecha_registro)}
                                </span>
                            </div>
                        </div>

                        <div className="form-actions" style={{ marginTop: '28px' }}>
                            <button type="button" className="btn-submit" onClick={() => setIsDetailOpen(false)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal de Confirmación de Eliminación */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirmar Eliminación"
            >
                {centerToDelete && (
                    <div>
                        <p style={{ marginBottom: '20px', fontSize: '14px', lineHeight: '1.6', textAlign: 'left', color: 'var(--text)' }}>
                            ¿Estás completamente seguro de eliminar el centro de trabajo <strong>{centerToDelete.nombre}</strong>?
                            Esta acción es irreversible y podría afectar a la integridad del sistema.
                        </p>
                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-submit"
                                style={{ backgroundColor: 'var(--danger)' }}
                                onClick={() => handleDelete(centerToDelete.id_centro)}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal de Alerta */}
            <Modal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ ...alertModal, isOpen: false })} title={alertModal.title}>
                <div style={{ textAlign: 'left', padding: '10px 0' }}>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text)' }}>
                        {alertModal.message}
                    </p>
                    <div className="form-actions" style={{ marginTop: '24px' }}>
                        <button type="button" className="btn-submit" onClick={() => setAlertModal({ ...alertModal, isOpen: false })}>
                            Aceptar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CenterManagement;
