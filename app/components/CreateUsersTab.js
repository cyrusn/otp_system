'use client';

import { useState } from 'react';
import { apiPath } from '@/lib/client-path';

export default function CreateUsersTab({ fetchUsers }) {
  const [batchUsernames, setBatchUsernames] = useState('');
  const [batchResult, setBatchResult] = useState(null);
  const [batchError, setBatchError] = useState('');

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setBatchError('');
    setBatchResult(null);
    try {
      const res = await fetch(apiPath('/api/admin/users/batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: batchUsernames }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBatchError(data.error || 'Failed to create batch');
      } else {
        setBatchResult(data);
        setBatchUsernames('');
        fetchUsers();
      }
    } catch (err) {
      setBatchError('Network error');
    }
  };

  return (
    <div className="card">
      <header className="card-header">
        <p className="card-header-title">Create Users</p>
      </header>
      <div className="card-content">
        <form onSubmit={handleCreateBatch}>
          <div className="field">
            <label className="label">List of Usernames (one per line or comma-separated)</label>
            <p className="help is-info mb-2">Enter 1 username or multiple usernames to create them in SQLite.</p>
            <div className="control">
              <textarea
                className="textarea"
                rows={5}
                placeholder="e.g. john&#10;mary&#10;peter, david"
                value={batchUsernames}
                onChange={(e) => setBatchUsernames(e.target.value)}
                required
              ></textarea>
            </div>
          </div>

          {batchError && (
            <div className="notification is-danger my-3">{batchError}</div>
          )}

          <button type="submit" className="button is-link mt-3">
            Create Users
          </button>
        </form>

        {batchResult && (
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid #eee' }}>
            {batchResult.skipped && batchResult.skipped.length > 0 && (
              <div className="notification is-warning mb-4">
                <strong>Skipped existing users:</strong> {batchResult.skipped.map(s => s.username).join(', ')}
              </div>
            )}

            <div className="notification is-success mb-4">
              <strong>Successfully created {batchResult.created?.length || 0} user(s).</strong> Go to the &quot;Print QR Notices&quot; tab to generate and print their QR codes.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
