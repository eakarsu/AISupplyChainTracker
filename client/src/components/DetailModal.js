import React from 'react';

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
  },
  modal: {
    width: '100%', maxWidth: '700px', maxHeight: '85vh',
    background: '#1e293b', borderRadius: '20px', border: '1px solid #334155',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    padding: '20px 24px', borderBottom: '1px solid #334155',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { fontSize: '18px', fontWeight: '700', color: '#f1f5f9' },
  closeBtn: {
    width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #334155',
    background: 'transparent', color: '#94a3b8', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
  },
  content: { flex: 1, overflow: 'auto', padding: '24px' },
  field: { marginBottom: '16px' },
  fieldLabel: { fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  fieldValue: { fontSize: '14px', color: '#e2e8f0', lineHeight: '1.5' },
  actions: {
    padding: '16px 24px', borderTop: '1px solid #334155',
    display: 'flex', gap: '12px', justifyContent: 'flex-end',
  },
  editBtn: {
    padding: '10px 20px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  deleteBtn: {
    padding: '10px 20px', borderRadius: '8px', border: '1px solid #ef4444',
    background: 'transparent', color: '#ef4444',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  cancelBtn: {
    padding: '10px 20px', borderRadius: '8px', border: '1px solid #334155',
    background: 'transparent', color: '#94a3b8',
    fontSize: '13px', fontWeight: '500', cursor: 'pointer',
  },
};

function DetailModal({ isOpen, onClose, title, fields, item, onEdit, onDelete }) {
  if (!isOpen || !item) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>{title}</div>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        <div style={styles.content}>
          {fields.map((f) => (
            <div key={f.key} style={styles.field}>
              <div style={styles.fieldLabel}>{f.label}</div>
              <div style={styles.fieldValue}>
                {f.render ? f.render(item[f.key], item) : (item[f.key] ?? 'N/A')}
              </div>
            </div>
          ))}
        </div>
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>Close</button>
          <button style={styles.editBtn} onClick={() => onEdit(item)}>Edit</button>
          <button style={styles.deleteBtn} onClick={() => onDelete(item.id)}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
          >Delete</button>
        </div>
      </div>
    </div>
  );
}

export default DetailModal;
