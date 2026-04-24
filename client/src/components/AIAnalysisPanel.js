import React from 'react';

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
  },
  panel: {
    width: '100%', maxWidth: '800px', maxHeight: '85vh',
    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
    borderRadius: '20px', border: '1px solid #334155',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    padding: '20px 24px', borderBottom: '1px solid #334155',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  aiIcon: {
    width: '40px', height: '40px', borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px',
  },
  headerTitle: { fontSize: '16px', fontWeight: '700', color: '#f1f5f9' },
  headerSub: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  closeBtn: {
    width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #334155',
    background: 'transparent', color: '#94a3b8', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
  },
  content: {
    flex: 1, overflow: 'auto', padding: '24px',
  },
  loading: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 0', gap: '16px',
  },
  spinner: {
    width: '48px', height: '48px', border: '3px solid #334155',
    borderTopColor: '#3b82f6', borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  timestamp: {
    padding: '12px 24px', borderTop: '1px solid #334155',
    fontSize: '11px', color: '#475569', textAlign: 'right',
  },
};

function formatAIContent(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={i} style={{ height: '8px' }} />);
      return;
    }

    // Headers with **bold**
    if (trimmed.match(/^\d+\.\s*\*\*/)) {
      const content = trimmed.replace(/\*\*/g, '').replace(/^\d+\.\s*/, '');
      const num = trimmed.match(/^(\d+)\./)?.[1];
      elements.push(
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          padding: '16px', margin: '12px 0 8px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.05))',
          borderRadius: '12px', border: '1px solid rgba(59,130,246,0.15)',
        }}>
          <span style={{
            minWidth: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '700', color: '#fff',
          }}>{num}</span>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0', lineHeight: '28px' }}>
            {content.replace(/:$/, '')}
          </span>
        </div>
      );
      return;
    }

    // Standalone bold headers
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      const content = trimmed.replace(/\*\*/g, '');
      elements.push(
        <div key={i} style={{
          fontSize: '15px', fontWeight: '600', color: '#e2e8f0',
          padding: '12px 0 4px', borderBottom: '1px solid #1e293b', marginTop: '8px',
        }}>{content}</div>
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const content = trimmed.replace(/^[-•]\s*/, '');
      // Process inline bold
      const parts = content.split(/\*\*(.*?)\*\*/);
      elements.push(
        <div key={i} style={{
          display: 'flex', gap: '10px', padding: '6px 0 6px 12px',
          fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6',
        }}>
          <span style={{ color: '#3b82f6', marginTop: '2px' }}>&#9679;</span>
          <span>
            {parts.map((part, j) =>
              j % 2 === 1
                ? <strong key={j} style={{ color: '#f1f5f9', fontWeight: '600' }}>{part}</strong>
                : <span key={j}>{part}</span>
            )}
          </span>
        </div>
      );
      return;
    }

    // Regular text with bold processing
    const parts = trimmed.split(/\*\*(.*?)\*\*/);
    elements.push(
      <div key={i} style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.7', padding: '2px 0' }}>
        {parts.map((part, j) =>
          j % 2 === 1
            ? <strong key={j} style={{ color: '#f1f5f9', fontWeight: '600' }}>{part}</strong>
            : <span key={j}>{part}</span>
        )}
      </div>
    );
  });

  return elements;
}

function AIAnalysisPanel({ isOpen, onClose, analysis, loading, title }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.aiIcon}>&#129302;</div>
            <div>
              <div style={styles.headerTitle}>{title || 'AI Analysis'}</div>
              <div style={styles.headerSub}>Powered by Claude AI via OpenRouter</div>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        <div style={styles.content}>
          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner} />
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>Analyzing with AI...</div>
              <div style={{ color: '#475569', fontSize: '12px' }}>This may take a few seconds</div>
            </div>
          ) : analysis ? (
            <div>{formatAIContent(analysis.analysis)}</div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
              No analysis available
            </div>
          )}
        </div>
        {analysis?.timestamp && (
          <div style={styles.timestamp}>
            Generated: {new Date(analysis.timestamp).toLocaleString()} | Type: {analysis.type}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIAnalysisPanel;
