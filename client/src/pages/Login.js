import React, { useState } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    position: 'relative', overflow: 'hidden',
  },
  bgOrb1: {
    position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px',
    borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)',
  },
  bgOrb2: {
    position: 'absolute', bottom: '-20%', left: '-10%', width: '500px', height: '500px',
    borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)',
  },
  card: {
    position: 'relative', zIndex: 1, width: '420px', padding: '40px',
    background: 'rgba(30,41,59,0.8)', backdropFilter: 'blur(20px)',
    borderRadius: '20px', border: '1px solid #334155',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  logoWrap: { textAlign: 'center', marginBottom: '32px' },
  logoIcon: {
    width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 16px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '28px', fontWeight: '800', color: '#fff',
  },
  title: { fontSize: '24px', fontWeight: '700', color: '#f1f5f9', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: '#64748b' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px', display: 'block' },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9',
    fontSize: '14px', outline: 'none', transition: 'border 0.2s',
  },
  loginBtn: {
    width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
    transition: 'all 0.3s', marginTop: '8px',
  },
  fillBtn: {
    width: '100%', padding: '12px', borderRadius: '10px',
    border: '1px solid #334155', background: 'rgba(59,130,246,0.1)',
    color: '#60a5fa', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0',
    color: '#475569', fontSize: '12px',
  },
  line: { flex: 1, height: '1px', background: '#334155' },
};

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const fillCredentials = () => {
    setEmail('admin@supplychain.com');
    setPassword('admin123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      toast.success('Welcome back!');
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>SC</div>
          <div style={styles.title}>Supply Chain AI</div>
          <div style={styles.subtitle}>Intelligent Supply Chain Management</div>
        </div>
        <form style={styles.form} onSubmit={handleSubmit}>
          <div>
            <label style={styles.label}>Email Address</label>
            <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" required
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#334155'} />
          </div>
          <div>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password" required
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#334155'} />
          </div>
          <button type="submit" style={{ ...styles.loginBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <div style={styles.divider}>
            <div style={styles.line} />
            <span>OR</span>
            <div style={styles.line} />
          </div>
          <button type="button" style={styles.fillBtn} onClick={fillCredentials}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}>
            Fill Demo Credentials
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
