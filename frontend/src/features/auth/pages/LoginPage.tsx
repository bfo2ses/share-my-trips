import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { useSetupStatus } from '../hooks/useSetupStatus';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { done, fetching } = useSetupStatus();

  useEffect(() => {
    if (!fetching && done === false) navigate('/setup', { replace: true });
  }, [done, fetching, navigate]);

  function handleSuccess(token: string) {
    login(token);
    navigate('/');
  }

  if (fetching) return null;

  return (
    <main className={styles.page}>
      <div className={styles.visual}>
        <div className={styles.visualInner} />
        <div className={styles.horizon} />
        <div className={styles.tagline}>
          <p className={styles.taglineText}>
            "Les plus beaux voyages<br />sont ceux qu'on partage."
          </p>
          <span className={styles.taglineLabel}>ShareMyTrips</span>
        </div>
      </div>
      <div className={styles.formPanel}>
        <LoginForm onSuccess={handleSuccess} />
      </div>
    </main>
  );
}
