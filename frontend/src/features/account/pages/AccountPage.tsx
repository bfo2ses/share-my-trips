import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useMe } from '../../auth/hooks/useMe';
import { useAccounts } from '../hooks/useAccounts';
import { useDeleteAccount } from '../hooks/useAccountMutations';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { CreateAccountForm } from '../components/CreateAccountForm';
import { AccountList } from '../components/AccountList';
import { ConfirmModal } from '../../../components/ConfirmModal/ConfirmModal';
import styles from './AccountPage.module.css';

export function AccountPage() {
  const { data: meData, fetching: meFetching } = useMe();
  const user = meData?.me ?? null;
  const isAdmin = user?.role === 'ADMIN';

  const [{ data: accountsData, fetching: accountsFetching }, reexecuteAccounts] = useAccounts();
  const accounts = accountsData?.accounts ?? [];

  const [, executeDelete] = useDeleteAccount();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refetchAccounts = useCallback(
    () => reexecuteAccounts({ requestPolicy: 'network-only' }),
    [reexecuteAccounts],
  );

  const deleteTargetName = deleteTargetId
    ? accounts.find((a) => a.id === deleteTargetId)?.name ?? ''
    : '';

  async function handleConfirmDelete() {
    if (!deleteTargetId || deleting) return;
    setDeleting(true);
    setDeleteError(null);

    const result = await executeDelete(
      { id: deleteTargetId },
      { additionalTypenames: ['Account'] },
    );

    if (result.error || !result.data?.deleteAccount.success) {
      const msg = result.data?.deleteAccount.errors[0]?.message ?? 'Impossible de supprimer ce compte.';
      setDeleteError(msg);
      setDeleting(false);
      return;
    }

    setDeleteTargetId(null);
    setDeleting(false);
    refetchAccounts();
  }

  if (meFetching) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  if (!user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Tous les voyages</Link>
      </div>

      {/* ── Mon profil ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Mon profil</h2>
        <div className={styles.profileInfo}>
          <div className={styles.profileAvatar}>{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <p className={styles.profileName}>{user.name}</p>
            <p className={styles.profileEmail}>{user.email}</p>
            <span className={styles.profileRole}>
              {user.role === 'ADMIN' ? 'Administrateur' : user.role === 'EDITOR' ? 'Éditeur' : 'Famille'}
            </span>
          </div>
        </div>

        <h3 className={styles.subTitle}>Changer le mot de passe</h3>
        <ChangePasswordForm />
      </section>

      {/* ── Gestion des comptes (admin) ── */}
      {isAdmin && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Gestion des comptes</h2>

          <h3 className={styles.subTitle}>Créer un compte famille</h3>
          <CreateAccountForm onSuccess={refetchAccounts} />

          <h3 className={styles.subTitle}>Comptes existants</h3>
          {accountsFetching ? (
            <p className={styles.loading}>Chargement...</p>
          ) : (
            <AccountList
              accounts={accounts}
              currentUserId={user.id}
              onDelete={(id) => { setDeleteTargetId(id); setDeleteError(null); }}
            />
          )}
        </section>
      )}

      <ConfirmModal
        open={deleteTargetId !== null}
        title="Supprimer ce compte ?"
        message={deleteError ?? `Le compte "${deleteTargetName}" sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        danger
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteTargetId(null); setDeleteError(null); }}
      />
    </div>
  );
}
