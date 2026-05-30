import React from 'react';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  const isDark = document.body.classList.contains('dark-mode');

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={`modal ${className}`} onClick={handleBackdropClick} style={{display: 'flex'}}>
      <div className="modal-content" style={{
        background: isDark ? '#1e2d24' : 'white',
        color: isDark ? '#e0e0e0' : '#333',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none'
      }}>
        <span className="close-button" onClick={onClose} style={{color: isDark ? '#aaa' : '#aaa'}}>&times;</span>
        <h3 className="modal-title" style={{color: isDark ? '#a7f3c0' : undefined}}>{title}</h3>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;