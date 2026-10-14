'use client';

export default function NavBar({ authAdmin, onLogout }) {
  return (
    <nav className="navbar is-dark no-print">
      <div className="container">
        <div className="navbar-brand">
          <span className="navbar-item font-weight-bold title is-5 mb-0 has-text-white">
            🛡️ SKHLPSS Login System - Admin Portal
          </span>
        </div>
        <div className="navbar-end">
          <div className="navbar-item">
            <span className="mr-3">
              Logged in as <strong>{authAdmin?.username}</strong> {authAdmin?.isRoot && '(Root)'}
            </span>
            <button onClick={onLogout} className="button is-small">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
