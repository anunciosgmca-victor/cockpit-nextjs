'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modalbox" style={{ animation: 'none' }}>
        <div className="panel-eyebrow">Cockpit de Gestão</div>
        <h1 className="panel-title" style={{ marginBottom: 18 }}>Entrar</h1>
        {sent ? (
          <p style={{ fontSize: 14, color: 'var(--ink-dim)' }}>
            Enviamos um link de acesso para <strong>{email}</strong>. Abra seu e-mail e clique no link para entrar.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>E-mail</label>
              <input
                type="email"
                required
                placeholder="voce@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button className="btn btn-primary" disabled={loading} type="submit" style={{ width: '100%' }}>
              {loading ? 'Enviando...' : 'Enviar link de acesso'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
