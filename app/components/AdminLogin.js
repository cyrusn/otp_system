'use client';

import { useState } from 'react';
import { apiPath } from '@/lib/client-path';

export default function AdminLogin({ onLoginSuccess }) {
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(apiPath('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Login failed');
      } else {
        onLoginSuccess({ username: data.username, isRoot: data.isRoot });
      }
    } catch (err) {
      setLoginError('Network error');
    }
  };

  return (
    <main className="section">
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-5">
            <div className="card">
              <header className="card-header has-background-link">
                <p className="card-header-title has-text-white">🛡️ SKHLPSS Admin Login</p>
              </header>
              <div className="card-content">
                <form onSubmit={handleLogin}>
                  <div className="field">
                    <label className="label">Admin Username</label>
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        placeholder="e.g. admin"
                        value={loginUser}
                        onChange={(e) => setLoginUser(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Admin Password</label>
                    <div className="control">
                      <input
                        className="input"
                        type="password"
                        placeholder="Admin password"
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {loginError && (
                    <div className="notification is-danger p-2 my-3">
                      {loginError}
                    </div>
                  )}

                  <div className="field mt-4">
                    <div className="control">
                      <button type="submit" className="button is-link is-fullwidth">
                        Log In
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
