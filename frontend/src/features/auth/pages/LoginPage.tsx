import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSuccess(token: string) {
    login(token);
    navigate('/');
  }

  return (
    <main className={styles.page}>
      <LoginForm onSuccess={handleSuccess} />
    </main>
  );
}
