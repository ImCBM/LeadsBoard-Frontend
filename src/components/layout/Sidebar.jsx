import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ChevronLeft, ChevronRight, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads',     label: 'Leads',     icon: Users },
];

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const sidebarClasses = [
    styles.sidebar,
    collapsed ? styles.collapsed : '',
    mobileOpen ? styles.mobileOpen : '',
  ].join(' ');

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`${styles.overlay} ${mobileOpen ? styles.visible : ''}`}
        onClick={onCloseMobile}
      />

      <aside className={sidebarClasses}>
        {/* Collapse toggle */}
        <button className={styles.collapseBtn} onClick={onToggleCollapse} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <Zap size={18} />
          </div>
          <span className={styles.logoText}>LeadsBoard</span>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive || location.pathname.startsWith(to) ? styles.active : ''}`
              }
            >
              <Icon size={20} />
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userMeta}>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={logout}>
            <LogOut size={18} />
            <span className={styles.logoutLabel}>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
