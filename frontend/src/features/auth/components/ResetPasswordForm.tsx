import { useState } from 'react';
import { useMutation } from 'urql';
import { useNavigate, Link } from 'react-router-dom';
import { gql } from '../../../graphql/generated';
import styles from './ResetPasswordForm.module.css';

const RESET_PASSWORD_MUTATION = gql(`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      account {
        id
      }
      errors {
        field
        message
      }
    }
  }
`);

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, executeReset] = useMutation(RESET_PASSWORD_MUTATION);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword !== newPasswordConfirm) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    const result = await executeReset({ input: { token, newPassword, newPasswordConfirm } });

    if (result.error) {
      setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
      return;
    }

    const { errors } = result.data!.resetPassword;
    if (errors.length > 0) {
      setErrorMessage(errors[0].message);
      return;
    }

    navigate('/login', { replace: true });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>Nouveau mot de passe</h1>
      <p className={styles.subtitle}>Choisissez un nouveau mot de passe pour votre compte.</p>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <label className={styles.label}>
        Nouveau mot de passe
        <input
          className={styles.input}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>

      <label className={styles.label}>
        Confirmation
        <input
          className={styles.input}
          type="password"
          value={newPasswordConfirm}
          onChange={(e) => setNewPasswordConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>

      <button className={styles.submit} type="submit">
        Réinitialiser le mot de passe
      </button>

      <Link className={styles.backLink} to="/login">
        Retour à la connexion
      </Link>
    </form>
  );
}
