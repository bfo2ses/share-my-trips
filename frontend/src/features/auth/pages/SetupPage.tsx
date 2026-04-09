import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SetupForm } from '../components/SetupForm';
import { useAuth } from '../hooks/useAuth';
import { useSetupStatus } from '../hooks/useSetupStatus';
import styles from './SetupPage.module.css';

export function SetupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { done, fetching } = useSetupStatus();

  useEffect(() => {
    if (!fetching && done) navigate('/login', { replace: true });
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
            "Chaque voyage mérite<br />d'être raconté."
          </p>
          <span className={styles.taglineLabel}>Premier lancement</span>
        </div>
      </div>
      <div className={styles.formPanel}>
        <SetupForm onSuccess={handleSuccess} />
      </div>
    </main>
  );
}
