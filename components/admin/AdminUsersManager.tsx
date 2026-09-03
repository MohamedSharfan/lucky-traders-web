'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiFetch } from '@/lib/client-api';
import { cn, formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import type { AdminRole, AdminUser } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { CloseIcon, PlusIcon, ShieldIcon, TrashIcon, UsersIcon } from '@/components/ui/Icon';

/**
 * Admin users.
 *
 * Owners can add and remove staff accounts; managers can only change their own
 * name and password. The account defined by `ADMIN_EMAIL` in the environment is
 * shown for context but cannot be edited here — it is the recovery account, and
 * being able to delete it from the UI would make lock-out possible.
 */
export function AdminUsersManager({
  admins,
  currentEmail,
  currentRole,
  envEmail,
  usingSupabase,
}: {
  admins: AdminUser[];
  currentEmail: string;
  currentRole: AdminRole;
  envEmail: string;
  usingSupabase: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [dialog, setDialog] = useState<'new' | AdminUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isOwner = currentRole === 'owner';

  async function remove(admin: AdminUser) {
    if (!window.confirm(`Remove ${admin.name} (${admin.email})? They will lose access immediately.`)) {
      return;
    }
    setBusyId(admin.id);
    try {
      await apiFetch(`/api/admin/users/${admin.id}`, { method: 'DELETE' });
      toast.success(`${admin.name} no longer has access.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove that admin.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {isOwner && (
          <button type="button" onClick={() => setDialog('new')} className="btn-primary btn-sm">
            <PlusIcon size={16} />
            Add admin user
          </button>
        )}
        <p className="text-[13px] text-muted">
          {admins.length} account{admins.length === 1 ? '' : 's'} with access to this panel
        </p>
      </div>

      {/* The environment account */}
      {!usingSupabase && (
        <section className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-blueSoft text-brand-blue">
              <ShieldIcon size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-ink">
                {envEmail}
                <span className="ml-2 status-pill bg-brand-blueSoft text-brand-blueDark ring-brand-blue/20">
                  Owner
                </span>
              </p>
              <p className="text-[12.5px] text-muted">
                Defined by <span className="font-mono">ADMIN_EMAIL</span> and{' '}
                <span className="font-mono">ADMIN_PASSWORD</span> in your environment file. Change it
                there and restart the server.
              </p>
            </div>
          </div>
        </section>
      )}

      {admins.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<UsersIcon size={26} />}
            title="No additional admin users"
            body={
              isOwner
                ? 'Add an account for anyone else who needs to manage products or orders.'
                : 'Only an owner can add admin users.'
            }
            actionLabel={isOwner ? 'Add admin user' : undefined}
            onAction={isOwner ? () => setDialog('new') : undefined}
          />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13.5px]">
            <thead className="border-b border-line bg-canvas text-[12px] uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-bold">Name</th>
                <th scope="col" className="px-3 py-2.5 font-bold">Email</th>
                <th scope="col" className="px-3 py-2.5 font-bold">Role</th>
                <th scope="col" className="px-3 py-2.5 font-bold">Added</th>
                <th scope="col" className="px-4 py-2.5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {admins.map((admin) => {
                const isSelf = admin.email === currentEmail;
                const canEdit = isOwner || isSelf;
                return (
                  <tr key={admin.id} className={cn(busyId === admin.id && 'opacity-60')}>
                    <td className="px-4 py-2.5 font-semibold text-ink">
                      {admin.name}
                      {isSelf && <span className="ml-2 text-[12px] font-normal text-muted">(you)</span>}
                    </td>
                    <td className="px-3 py-2.5 text-muted">{admin.email}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'status-pill',
                          admin.role === 'owner'
                            ? 'bg-brand-redSoft text-brand-redDark ring-brand-red/20'
                            : 'bg-brand-blueSoft text-brand-blueDark ring-brand-blue/20',
                        )}
                      >
                        {admin.role === 'owner' ? 'Owner' : 'Manager'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{formatDate(admin.created_at)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setDialog(admin)}
                            className="btn-outline btn-sm"
                          >
                            Edit
                          </button>
                        )}
                        {isOwner && !isSelf && (
                          <button
                            type="button"
                            onClick={() => remove(admin)}
                            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-brand-redSoft hover:text-brand-red"
                            aria-label={`Remove ${admin.name}`}
                          >
                            <TrashIcon size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="rounded-card border border-line bg-white px-4 py-3 text-[12.5px] leading-relaxed text-muted">
        <strong className="text-ink">Owner</strong> can manage products, orders, settings and other
        admin users. <strong className="text-ink">Manager</strong> can do everything except add,
        remove or re-role admin users.
        {usingSupabase && (
          <>
            {' '}
            Accounts are created in Supabase Auth and mirrored into the{' '}
            <span className="font-mono">admins</span> table — both are required to sign in.
          </>
        )}
      </p>

      {dialog && (
        <AdminDialog
          admin={dialog === 'new' ? null : dialog}
          isOwner={isOwner}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function AdminDialog({
  admin,
  isOwner,
  onClose,
  onSaved,
}: {
  admin: AdminUser | null;
  isOwner: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);
  const [name, setName] = useState(admin?.name ?? '');
  const [email, setEmail] = useState(admin?.email ?? '');
  const [role, setRole] = useState<AdminRole>(admin?.role ?? 'manager');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isNew = !admin;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (name.trim().length < 2) return setError('Enter a name.');
    if (isNew && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return setError('Enter a valid email address.');
    }
    if ((isNew || password) && password.length < 8) {
      return setError('The password must be at least 8 characters.');
    }
    if ((isNew || password) && password !== confirm) {
      return setError('The two passwords do not match.');
    }

    setBusy(true);
    setError('');
    try {
      if (isNew) {
        await apiFetch('/api/admin/users', {
          method: 'POST',
          json: { email: email.trim(), name: name.trim(), role, password },
        });
        toast.success(`${name.trim()} can now sign in.`);
      } else {
        await apiFetch(`/api/admin/users/${admin.id}`, {
          method: 'PATCH',
          json: {
            name: name.trim(),
            ...(isOwner ? { role } : {}),
            ...(password ? { password } : {}),
          },
        });
        toast.success('Account updated.');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/50 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-pop animate-slide-up sm:max-w-md sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="admin-dialog-title" className="text-base font-bold text-ink">
            {isNew ? 'Add admin user' : `Edit ${admin.name}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-canvas"
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {error && (
          <p role="alert" className="mb-3 rounded-lg bg-brand-redSoft px-3 py-2 text-[13px] font-medium text-brand-redDark">
            {error}
          </p>
        )}

        <form onSubmit={save} className="space-y-4">
          <div>
            <label htmlFor="admin-name" className="label">
              Name <span className="text-brand-red">*</span>
            </label>
            <input
              id="admin-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="admin-email" className="label">
              Email <span className="text-brand-red">*</span>
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="off"
              className="input"
              value={email}
              disabled={!isNew}
              onChange={(e) => setEmail(e.target.value)}
            />
            {!isNew && <p className="hint">The sign-in email cannot be changed.</p>}
          </div>

          {isOwner && (
            <div>
              <label htmlFor="admin-role" className="label">Role</label>
              <select
                id="admin-role"
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value as AdminRole)}
              >
                <option value="manager">Manager — everything except admin users</option>
                <option value="owner">Owner — full access</option>
              </select>
            </div>
          )}

          <div>
            <label htmlFor="admin-password" className="label">
              {isNew ? (
                <>
                  Password <span className="text-brand-red">*</span>
                </>
              ) : (
                'New password'
              )}
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="new-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isNew ? 'At least 8 characters' : 'Leave blank to keep the current one'}
            />
          </div>

          {(isNew || password) && (
            <div>
              <label htmlFor="admin-confirm" className="label">
                Confirm password <span className="text-brand-red">*</span>
              </label>
              <input
                id="admin-confirm"
                type="password"
                autoComplete="new-password"
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? 'Saving…' : isNew ? 'Create account' : 'Save changes'}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
