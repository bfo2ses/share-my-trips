import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../features/auth/hooks/useLogout';
import { EditModeToggle } from '../EditMode/EditModeToggle';
import type { MeQuery } from '../../graphql/generated/graphql';
import styles from './Header.module.css';

type Account = NonNullable<MeQuery['me']>;

interface HeaderProps {
  user: Account | null;
}

export function Header({ user }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const logout = useLogout();

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const name = user?.name ?? '';

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="/" className={styles.logo}>
          <svg className={styles.logoIcon} width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 2C10.48 2 6 6.48 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.52-4.48-10-10-10z" fill="currentColor"/>
            <circle cx="16" cy="12" r="5.5" fill="var(--color-bg)"/>
            <ellipse cx="16" cy="12" rx="2.2" ry="5.5" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            <line x1="10.5" y1="12" x2="21.5" y2="12" stroke="currentColor" strokeWidth="0.8"/>
          </svg>
          ShareMyTrips
        </a>

        <div className={styles.rightArea}>
          {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
            <EditModeToggle />
          )}

        <div className={styles.userArea} ref={menuRef}>
          <button
            className={styles.userBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className={styles.userName}>{name}</span>
            <div className={styles.avatar}>{name.charAt(0).toUpperCase()}</div>
          </button>

          {menuOpen && (
            <div className={styles.menu} role="menu">
              <div className={styles.menuHeader}>
                <p className={styles.menuName}>{name}</p>
                <p className={styles.menuEmail}>{user?.email}</p>
              </div>
              <div className={styles.menuDivider} />
              <button
                className={styles.menuItem}
                role="menuitem"
                onClick={() => { setMenuOpen(false); navigate('/account'); }}
              >
                {user?.role === 'ADMIN' ? 'Gestion des comptes' : 'Mon profil'}
              </button>
              <button
                className={styles.menuItem}
                role="menuitem"
                onClick={async () => { setMenuOpen(false); await logout(); }}
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}
