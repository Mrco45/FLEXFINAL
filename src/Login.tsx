import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from './firebase';

const auth = getAuth(app);

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="max-w-sm mx-auto mt-20 p-8 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Login to FLEX Dashboard</h2>
      <input className="w-full mb-4 p-2 border rounded" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input className="w-full mb-4 p-2 border rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
      <button className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
    </form>
  );
}
