import styles from './Header.module.css';

interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoIcon}>✈</span>
          ShareMyTrips
        </a>
        <div className={styles.user}>
          <span className={styles.userName}>{userName}</span>
          <div className={styles.avatar}>
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
