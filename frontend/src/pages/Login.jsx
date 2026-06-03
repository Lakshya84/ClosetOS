import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Initialize Google Sign-In
  useEffect(() => {
    // If standard Google GIS library is not loaded yet, skip
    if (!window.google) return;

    const API_URL = import.meta.env.VITE_API_URL || '';
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '855486851670-jk8h5rccmvei18f1pve6r4mglod8ebic.apps.googleusercontent.com'; // Fallback demo ID

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        setError('');
        setSubmitting(true);
        try {
          const res = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || 'Google Authentication failed.');
          }

          login(data);
          navigate('/');
        } catch (err) {
          setError(err.message);
        } finally {
          setSubmitting(false);
        }
      }
    });

    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-btn'),
      { theme: 'dark', size: 'large', width: '100%' }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="min-h-screen bg-vault-bg flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans">
      {/* Decorative hairline grid backdrop elements */}
      <div class="absolute inset-0 grid grid-cols-2 sm:grid-cols-4 pointer-events-none opacity-20">
        <div class="border-r border-neutral-900"></div>
        <div class="border-r border-neutral-900 hidden sm:block"></div>
        <div class="border-r border-neutral-900 hidden sm:block"></div>
        <div></div>
      </div>

      {/* Header */}
      <div class="z-10 flex items-center justify-between w-full">
        <div class="font-mono text-vault-lime text-xl font-bold tracking-widest">
          ClosetOS
        </div>
        <div class="text-xs font-mono text-vault-muted">
          v1.0.0 // INTERNAL
        </div>
      </div>

      {/* Main card panel */}
      <div class="z-10 w-full max-w-md mx-auto my-auto py-8 sm:py-12">
        <div class="text-center mb-8">
          <h1 class="text-4xl sm:text-5xl font-black text-vault-primary tracking-tight font-sans mb-2">
            ENTER <br class="sm:hidden" />ARCHIVE
          </h1>
          <p class="text-sm font-mono text-vault-muted">
            AUTHENTICATE TO ACCESS CREATOR STORAGE
          </p>
        </div>

        <div class="bg-vault-card hairline-border p-8 sm:p-10 shadow-glow-lime/5 relative">
          {/* Subtle lime glow accent on top edge */}
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-vault-lime"></div>

          {error && (
            <div class="mb-6 p-4 border border-vault-red bg-vault-red/5 text-vault-red text-sm font-mono flex items-center gap-2">
              <Shield class="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} class="space-y-6">
            <div>
              <label class="block text-xs font-mono text-vault-primary tracking-wider uppercase mb-2">
                CREATOR EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="CREATOR@CLOSET.OS"
                class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-4 py-3 text-vault-primary font-mono text-sm tracking-wide focus:outline-none focus:ring-1 focus:ring-vault-lime placeholder-neutral-800 transition-colors"
              />
            </div>

            <div>
              <label class="block text-xs font-mono text-vault-primary tracking-wider uppercase mb-2">
                VAULT PASSWORD
              </label>
              <div class="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-4 py-3 pr-12 text-vault-primary font-mono text-sm tracking-wide focus:outline-none focus:ring-1 focus:ring-vault-lime placeholder-neutral-800 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-vault-muted hover:text-vault-lime transition-colors"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff class="w-4 h-4" /> : <Eye class="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              class="w-full bg-vault-lime text-vault-bg font-sans font-black text-sm tracking-widest uppercase py-4 flex items-center justify-center gap-2 glow-button hover:bg-white transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? 'VALIDATING...' : 'ACCESS ARCHIVE'}
              <ArrowRight class="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div class="my-6 flex items-center justify-between">
            <span class="w-[42%] h-[1px] bg-neutral-900"></span>
            <span class="font-mono text-[9px] text-vault-muted uppercase">OR</span>
            <span class="w-[42%] h-[1px] bg-neutral-900"></span>
          </div>

          {/* Google Sign-in Button Container */}
          <div id="google-signin-btn" class="w-full flex justify-center"></div>
        </div>

        <div class="mt-6 text-center">
          <p class="text-sm text-vault-muted font-sans">
            Need an archive vault?{' '}
            <Link to="/register" class="text-vault-lime hover:underline font-mono text-xs ml-1 font-bold">
              REGISTER // NEW
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div class="z-10 text-center text-[10px] font-mono text-vault-muted w-full tracking-wider mt-4">
        SECURED WITH JWT // PASSWORD HASHING ENFORCED
      </div>
    </div>
  );
}
