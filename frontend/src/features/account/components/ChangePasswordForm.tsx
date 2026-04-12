import { useState } from 'react';
import { useChangePassword } from '../hooks/useAccountMutations';
import styles from './ChangePasswordForm.module.css';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [, executeChange] = useChangePassword();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword !== newPasswordConfirm) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    const result = await executeChange({
      input: { currentPassword, newPassword, newPasswordConfirm },
    });

    if (result.error) {
      setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
      return;
    }

    const { errors } = result.data!.changePassword;
    if (errors.length > 0) {
      setErrorMessage(errors[0].message);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setSuccessMessage('Mot de passe modifié avec succès.');
    onSuccess?.();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      <label className={styles.label}>
        Mot de passe actuel
        <input
          className={styles.input}
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

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
        Confirmation du nouveau mot de passe
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
        Modifier le mot de passe
      </button>
    </form>
  );
}
