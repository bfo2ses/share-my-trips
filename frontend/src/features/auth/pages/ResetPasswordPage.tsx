import { useSearchParams } from 'react-router-dom';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import styles from './ResetPasswordPage.module.css';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

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
        {token
          ? <ResetPasswordForm token={token} />
          : <ForgotPasswordForm />
        }
      </div>
    </main>
  );
}
