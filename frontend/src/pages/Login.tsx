import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, Lock, User, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      setRegisterSuccess(true);
      setIsRegister(false);
    } else {
      localStorage.setItem('nepse_user', JSON.stringify({ email, name: email.split('@')[0] }));
      navigate('/');
    }
  };

  if (registerSuccess) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-success-icon">
            <User size={32} />
          </div>
          <h2 className="login-title">Registration Successful!</h2>
          <p className="login-subtitle">You can now sign in with your credentials.</p>
          <button
            onClick={() => { setRegisterSuccess(false); setIsRegister(true); }}
            className="btn btn-primary btn-block"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <Link to="/" className="login-back">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="login-card">
        <div className="login-logo">
          <Activity size={40} />
        </div>
        <h1 className="login-title">
          {isRegister ? 'Create Account' : 'NEPSE Dashboard'}
        </h1>
        <p className="login-subtitle">
          {isRegister ? 'Sign up to get started' : 'Sign in to continue'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-container">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-container">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-container">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-container">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
          >
            {loading ? (isRegister ? 'Creating Account...' : 'Signing in...') : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <p className="login-toggle">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setRegisterSuccess(false);
            }}
            className="link"
          >
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-back {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          font-size: 0.85rem;
          transition: color 0.15s;
        }

        .login-back:hover {
          color: var(--text-primary);
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 32px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .login-logo {
          text-align: center;
          margin-bottom: 24px;
          color: var(--accent);
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 8px;
        }

        .login-subtitle {
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 24px;
        }

        .login-success-icon {
          width: 64px;
          height: 64px;
          background: rgba(0, 200, 83, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: #00c853;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          margin-bottom: 6px;
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-container {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .form-input {
          width: 100%;
          padding: 12px 12px 12px 42px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .btn-block {
          width: 100%;
          margin-top: 8px;
        }

        .login-error {
          padding: 12px;
          background: rgba(255, 59, 48, 0.1);
          border: 1px solid rgba(255, 59, 48, 0.3);
          border-radius: 4px;
          color: #ff6b6b;
          font-size: 0.85rem;
        }

        .login-toggle {
          text-align: center;
          margin-top: 24px;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .link {
          color: var(--accent);
          background: none;
          border: none;
          cursor: pointer;
        }

        .link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
