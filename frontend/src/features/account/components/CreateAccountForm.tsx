import { useState } from 'react';
import { useCreateAccount } from '../hooks/useAccountMutations';
import type { AccountRole } from '../../../graphql/generated/graphql';
import styles from './CreateAccountForm.module.css';

interface CreateAccountFormProps {
  onSuccess: () => void;
}

export function CreateAccountForm({ onSuccess }: CreateAccountFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AccountRole>('FAMILY');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [, executeCreate] = useCreateAccount();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await executeCreate({
      input: { name, email, role },
    }, { additionalTypenames: ['Account'] });

    if (result.error) {
      setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
      return;
    }

    const { account, errors } = result.data!.createAccount;
    if (errors.length > 0 || !account) {
      setErrorMessage(errors[0]?.message ?? 'Une erreur est survenue.');
      return;
    }

    setName('');
    setEmail('');
    setRole('FAMILY');
    setSuccessMessage(`Compte "${account.name}" créé. La personne pourra définir son mot de passe via "Mot de passe oublié".`);
    onSuccess();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      <div className={styles.row}>
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
      </div>

      <label className={styles.label}>
        Rôle
        <select
          className={styles.select}
          value={role}
          onChange={(e) => setRole(e.target.value as AccountRole)}
        >
          <option value="FAMILY">Famille — lecture seule</option>
          <option value="EDITOR">Éditeur — peut gérer les voyages</option>
        </select>
      </label>

      <button className={styles.submit} type="submit">
        Créer le compte
      </button>
    </form>
  );
}
