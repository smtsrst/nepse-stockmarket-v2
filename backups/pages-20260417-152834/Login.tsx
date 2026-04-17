import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Activity, Mail, Lock, User, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const navigate = useNavigate();

  // Clear any stale auth data on mount
  useEffect(() => {
    api.logout();
  }, []);

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
      setLoading(true);
      try {
        await api.register(email, password, fullName);
        setRegisterSuccess(true);
        setIsRegister(false);
        setEmail('');
        setPassword('');
        setFullName('');
        setConfirmPassword('');
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Registration failed';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        await api.login(email, password);
        onLogin();
        // Use window.location for a clean redirect
        window.location.href = '/';
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Invalid email or password';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  if (registerSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gain/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gain" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">Registration Successful!</h2>
            <p className="text-text-secondary mt-2">You can now sign in with your credentials.</p>
          </div>
          <button
            onClick={() => setRegisterSuccess(false)}
            className="button w-full"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md p-8">
        {/* Back to home */}
        <Link to="/" className="inline-flex items-center gap-2 text-text-secondary text-sm mb-6 hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isRegister ? 'Create Account' : 'NEPSE Dashboard'}
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            {isRegister ? 'Sign up to get started' : 'Sign in to continue'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-loss/10 border border-loss rounded text-loss text-sm">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-text-secondary text-sm mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input w-full pl-10"
                  placeholder="John Doe"
                  required={isRegister}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-text-secondary text-sm mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full pl-10"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full pl-10"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-text-secondary text-sm mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input w-full pl-10"
                  placeholder="••••••••"
                  required={isRegister}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="button w-full disabled:opacity-50"
          >
            {loading ? (isRegister ? 'Creating Account...' : 'Signing in...') : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Toggle login/register */}
        <p className="text-center text-text-secondary text-sm mt-6">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setRegisterSuccess(false);
            }}
            className="text-accent hover:underline"
          >
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}