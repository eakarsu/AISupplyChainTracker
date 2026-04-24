import React, { useState, useEffect } from 'react';

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
  },
  modal: {
    width: '100%', maxWidth: '640px', maxHeight: '90vh',
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
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  formGroupFull: { display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' },
  label: { fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155',
    background: '#0f172a', color: '#f1f5f9', fontSize: '14px', outline: 'none',
  },
  select: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155',
    background: '#0f172a', color: '#f1f5f9', fontSize: '14px', outline: 'none',
  },
  textarea: {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155',
    background: '#0f172a', color: '#f1f5f9', fontSize: '14px', outline: 'none',
    minHeight: '80px', resize: 'vertical', fontFamily: 'inherit',
  },
  actions: {
    padding: '16px 24px', borderTop: '1px solid #334155',
    display: 'flex', gap: '12px', justifyContent: 'flex-end',
  },
  saveBtn: {
    padding: '10px 24px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  cancelBtn: {
    padding: '10px 20px', borderRadius: '8px', border: '1px solid #334155',
    background: 'transparent', color: '#94a3b8',
    fontSize: '13px', fontWeight: '500', cursor: 'pointer',
  },
};

function FormModal({ isOpen, onClose, title, fields, initialData, onSave }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const defaults = {};
      fields.forEach((f) => { defaults[f.key] = f.defaultValue || ''; });
      setFormData(defaults);
    }
  }, [initialData, fields, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>{title}</div>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={styles.content}>
            <div style={styles.formGrid}>
              {fields.map((f) => (
                <div key={f.key} style={f.fullWidth ? styles.formGroupFull : styles.formGroup}>
                  <label style={styles.label}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select style={styles.select} value={formData[f.key] || ''} onChange={(e) => handleChange(f.key, e.target.value)}>
                      <option value="">Select...</option>
                      {(f.options || []).map((o) => {
                        const val = typeof o === 'object' ? o.value : o;
                        const label = typeof o === 'object' ? o.label : o;
                        return <option key={val} value={val}>{label}</option>;
                      })}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea style={styles.textarea} value={formData[f.key] || ''} onChange={(e) => handleChange(f.key, e.target.value)} placeholder={f.placeholder} />
                  ) : (
                    <input style={styles.input} type={f.type || 'text'} value={formData[f.key] || ''} onChange={(e) => handleChange(f.key, e.target.value)} placeholder={f.placeholder} step={f.step} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={styles.saveBtn}>{initialData?.id ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormModal;
