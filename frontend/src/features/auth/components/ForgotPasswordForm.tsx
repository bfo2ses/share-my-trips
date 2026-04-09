import { useState } from 'react';
import { useMutation } from 'urql';
import { Link } from 'react-router-dom';
import { gql } from '../../../graphql/generated';
import styles from './ForgotPasswordForm.module.css';

const REQUEST_RESET_MUTATION = gql(`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`);

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [, executeRequest] = useMutation(REQUEST_RESET_MUTATION);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await executeRequest({ email });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className={styles.form}>
        <h1 className={styles.title}>Vérifiez vos emails</h1>
        <p className={styles.confirmation}>
          Si un compte existe pour cette adresse, vous recevrez un lien de réinitialisation dans quelques minutes.
        </p>
        <Link className={styles.backLink} to="/login">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>Mot de passe oublié</h1>
      <p className={styles.subtitle}>Saisissez votre email pour recevoir un lien de réinitialisation.</p>

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

      <button className={styles.submit} type="submit">
        Envoyer le lien
      </button>

      <Link className={styles.backLink} to="/login">
        Retour à la connexion
      </Link>
    </form>
  );
}
