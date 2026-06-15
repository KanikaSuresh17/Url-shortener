import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Link2, User, LogOut } from 'lucide-react';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    api.logout();
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link2 className="nav-logo-icon" />
        <span>MagicURL</span>
      </div>
      {user && (
        <div className="nav-actions">
          <div className="user-tag">
            <User className="user-tag-icon" />
            <span>{user.email}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}
