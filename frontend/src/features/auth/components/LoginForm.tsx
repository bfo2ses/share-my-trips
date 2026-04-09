import { useState } from 'react';
import { useMutation } from 'urql';
import { gql } from '../../../graphql/generated';
import styles from './LoginForm.module.css';

const LOGIN_MUTATION = gql(`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      errors {
        field
        message
      }
    }
  }
`);

interface LoginFormProps {
  onSuccess: (token: string) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, executeLogin] = useMutation(LOGIN_MUTATION);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const result = await executeLogin({ email, password });

    if (result.error) {
      setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
      return;
    }

    const { token, errors } = result.data!.login;
    if (errors.length > 0 || !token) {
      setErrorMessage('Identifiants incorrects.');
      return;
    }

    onSuccess(token);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>ShareMyTrips</h1>
      <p className={styles.subtitle}>Album de famille</p>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <label className={styles.label}>
        Email
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </label>

      <label className={styles.label}>
        Mot de passe
        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      <button className={styles.submit} type="submit">
        Se connecter
      </button>

      <a className={styles.forgotLink} href="/reset-password">
        Mot de passe oublié ?
      </a>
    </form>
  );
}
