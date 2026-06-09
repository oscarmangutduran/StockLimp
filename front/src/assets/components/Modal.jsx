import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
    // Si el modal está cerrado, no renderizamos absolutamente nada en el DOM
    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            {/* El stopPropagation evita que el modal se cierre al hacer clic dentro del formulario */}
            <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                
                {/* Cabecera del Modal */}
                <div style={styles.header}>
                    <h3 style={styles.title}>{title}</h3>
                    <button style={styles.closeButton} onClick={onClose}>
                        &times;
                    </button>
                </div>

                {/* Cuerpo dinámico (Aquí se inyectarán los formularios de productos, pedidos, etc.) */}
                <div style={styles.body}>
                    {children}
                </div>

            </div>
        </div>
    );
};



export default Modal;