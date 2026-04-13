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
          <span className={styles.logoIcon}>✈</span>
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
