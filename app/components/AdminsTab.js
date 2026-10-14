'use client';

import { useState } from 'react';
import { apiPath } from '@/lib/client-path';

export default function AdminsTab({ admins, fetchAdmins }) {
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminError('');
    try {
      const res = await fetch(apiPath('/api/admin/admins'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newAdminUser, password: newAdminPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminError(data.error || 'Failed to create admin');
      } else {
        setNewAdminUser('');
        setNewAdminPass('');
        fetchAdmins();
      }
    } catch (err) {
      setAdminError('Network error');
    }
  };

  const handleDeleteAdmin = async (username) => {
    if (!confirm(`Delete admin '${username}'?`)) return;
    try {
      const res = await fetch(apiPath('/api/admin/admins'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        fetchAdmins();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete admin');
      }
    } catch (err) {
      alert('Error deleting admin');
    }
  };

  return (
    <div className="card">
      <header className="card-header">
        <p className="card-header-title">Admin User Management</p>
      </header>
      <div className="card-content">
        <h3 className="title is-6">Create New Admin User</h3>
        <form onSubmit={handleCreateAdmin} className="mb-5">
          <div className="columns">
            <div className="column is-5">
              <input
                className="input"
                type="text"
                placeholder="New Admin Username"
                value={newAdminUser}
                onChange={(e) => setNewAdminUser(e.target.value)}
                required
              />
            </div>
            <div className="column is-5">
              <input
                className="input"
                type="password"
                placeholder="New Admin Password"
                value={newAdminPass}
                onChange={(e) => setNewAdminPass(e.target.value)}
                required
              />
            </div>
            <div className="column is-2">
              <button type="submit" className="button is-link is-fullwidth">
                Add Admin
              </button>
            </div>
          </div>
          {adminError && <div className="notification is-danger p-2">{adminError}</div>}
        </form>

        <h3 className="title is-6">Secondary Admin Accounts in SQLite</h3>
        <div className="table-container">
          <table className="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Admin Username</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td><strong>{a.username}</strong></td>
                  <td>{new Date(a.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      className="button is-danger is-small"
                      onClick={() => handleDeleteAdmin(a.username)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
