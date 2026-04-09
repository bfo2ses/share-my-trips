import { useState } from 'react';
import { useMutation } from 'urql';
import { gql } from '../../../graphql/generated';
import styles from './SetupForm.module.css';

const SETUP_ADMIN_MUTATION = gql(`
  mutation SetupAdmin($input: SetupAdminInput!) {
    setupAdmin(input: $input) {
      token
      errors {
        field
        message
      }
    }
  }
`);

interface SetupFormProps {
  onSuccess: (token: string) => void;
}

export function SetupForm({ onSuccess }: SetupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, executeSetup] = useMutation(SETUP_ADMIN_MUTATION);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== passwordConfirm) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    const result = await executeSetup({
      input: { name, email, password, passwordConfirm },
    });

    if (result.error) {
      setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
      return;
    }

    const { token, errors } = result.data!.setupAdmin;
    if (errors.length > 0 || !token) {
      setErrorMessage(errors[0]?.message ?? 'Une erreur est survenue.');
      return;
    }

    onSuccess(token);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>Créer le compte administrateur</h1>
      <p className={styles.subtitle}>Premier lancement — configurez votre compte.</p>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <label className={styles.label}>
        Nom
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
      </label>

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
          autoComplete="new-password"
          required
        />
      </label>

      <label className={styles.label}>
        Confirmation du mot de passe
        <input
          className={styles.input}
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>

      <button className={styles.submit} type="submit">
        Créer le compte
      </button>
    </form>
  );
}
