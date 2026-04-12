import type { AccountsQuery } from '../../../graphql/generated/graphql';
import styles from './AccountList.module.css';

type Account = AccountsQuery['accounts'][number];

interface AccountListProps {
  accounts: Account[];
  currentUserId: string;
  onDelete: (id: string) => void;
}

function roleBadge(role: string) {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'EDITOR') return 'Éditeur';
  return 'Famille';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AccountList({ accounts, currentUserId, onDelete }: AccountListProps) {
  if (accounts.length === 0) {
    return <p className={styles.empty}>Aucun compte.</p>;
  }

  return (
    <div className={styles.list}>
      {accounts.map((account) => (
        <div key={account.id} className={styles.row}>
          <div className={styles.info}>
            <span className={styles.name}>{account.name}</span>
            <span className={styles.email}>{account.email}</span>
          </div>
          <span className={`${styles.badge} ${account.role === 'ADMIN' ? styles.badgeAdmin : account.role === 'EDITOR' ? styles.badgeEditor : styles.badgeFamily}`}>
            {roleBadge(account.role)}
          </span>
          <span className={styles.date}>{formatDate(account.createdAt)}</span>
          <div className={styles.actions}>
            {account.id !== currentUserId && (
              <button
                className={styles.deleteBtn}
                onClick={() => onDelete(account.id)}
                aria-label={`Supprimer ${account.name}`}
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
