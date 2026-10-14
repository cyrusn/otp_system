'use client';

import { useState, useEffect } from 'react';
import AdminLogin from './components/AdminLogin';
import NavBar from './components/NavBar';
import ManageUsersTab from './components/ManageUsersTab';
import CreateUsersTab from './components/CreateUsersTab';
import AdminsTab from './components/AdminsTab';
import ValidateTab from './components/ValidateTab';
import { apiPath } from '@/lib/client-path';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authAdmin, setAuthAdmin] = useState(null); // { username, isRoot }
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Active Tab State
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'batch' | 'print' | 'admins' | 'validate'

  // Shared Data State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [admins, setAdmins] = useState([]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUsersError('');
    try {
      const res = await fetch(apiPath('/api/admin/users'));
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setUsersError(data.error || `Could not load users (HTTP ${res.status})`);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setUsersError('Could not load users. Check the database connection and server logs.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch(apiPath('/api/admin/admins'));
      const data = await res.json();
      if (res.ok) {
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.error('Fetch admins error:', err);
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch(apiPath('/api/admin/check-auth'));
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
        if (data.authenticated) {
          setAuthAdmin({ username: data.username, isRoot: data.isRoot });
          fetchUsers();
          fetchAdmins();
        }
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoadingAuth(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLoginSuccess = (adminData) => {
    setIsAuthenticated(true);
    setAuthAdmin(adminData);
    fetchUsers();
    fetchAdmins();
  };

  const handleLogout = async () => {
    try {
      await fetch(apiPath('/api/admin/logout'), { method: 'POST' });
    } finally {
      setIsAuthenticated(false);
      setAuthAdmin(null);
    }
  };

  if (loadingAuth) {
    return (
      <div className="section has-text-centered my-6">
        <p className="title is-4">Loading SKHLPSS Login System...</p>
      </div>
    );
  }

  // UNAUTHENTICATED: Admin Login
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // AUTHENTICATED: Admin Dashboard
  return (
    <main>
      <NavBar authAdmin={authAdmin} onLogout={handleLogout} />

      <div className="container my-5 px-4">
        <div className="tabs is-boxed is-medium no-print">
          <ul>
            <li className={activeTab === 'users' ? 'is-active' : ''}>
              <a onClick={() => setActiveTab('users')}>Manage Users</a>
            </li>
            <li className={activeTab === 'batch' ? 'is-active' : ''}>
              <a onClick={() => setActiveTab('batch')}>Create Users</a>
            </li>
            <li className={activeTab === 'admins' ? 'is-active' : ''}>
              <a onClick={() => setActiveTab('admins')}>Manage Admin Users</a>
            </li>
            <li className={activeTab === 'validate' ? 'is-active' : ''}>
              <a onClick={() => setActiveTab('validate')}>Test Public API</a>
            </li>
          </ul>
        </div>

        {activeTab === 'users' && (
          <>
            {usersError && (
              <div className="notification is-danger" role="alert">{usersError}</div>
            )}
            {loadingUsers && (
              <div className="notification is-info" role="status">Loading users...</div>
            )}
            <ManageUsersTab fetchUsers={fetchUsers} />
          </>
        )}

        {activeTab === 'batch' && (
          <CreateUsersTab fetchUsers={fetchUsers} />
        )}

        {activeTab === 'admins' && (
          <AdminsTab admins={admins} fetchAdmins={fetchAdmins} />
        )}

        {activeTab === 'validate' && (
          <ValidateTab />
        )}
      </div>

    </main>
  );
}
