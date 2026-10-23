'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/lib/router-compat';
import { useDashboardState } from '@/components/dashboard/DashboardState';
import { Button } from '@/components/ui/ShopyumpButton';
import { Input } from '@/components/ui/ShopyumpInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { AccountAvatar, useAvatarPicker } from '@/components/nav/AccountAvatar';
import { useAccountT } from '@/lib/i18n/account';

export function ProfileForm() {
  const { account, setAccount } = useDashboardState();
  const { show } = useToast();
  const t = useAccountT();
  const picker = useAvatarPicker();
  const [nome, setNome] = useState(account.nome);
  const [telefone, setTelefone] = useState(account.telefone);
  const [deleteOpen, setDeleteOpen] = useState(false);
  useEffect(() => { setNome(account.nome); setTelefone(account.telefone); }, [account.nome, account.telefone]);
  const dirty = nome.trim() !== account.nome || telefone.trim() !== account.telefone;

  return (
    <>
      <section className="profile-avatar-row" aria-label={t.photo}>
        {picker.input}
        <button type="button" className="account-avatar-preview account-avatar-button" onClick={picker.open} aria-label={t.changePhoto}>
          <AccountAvatar />
        </button>
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">{t.photo}</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={picker.open}>{t.changePhoto}</Button>
            {account.foto && (
              <Button type="button" variant="ghost" size="sm" onClick={() => { setAccount(a => ({ ...a, foto: null })); show(t.photoRemoved); }}>
                {t.removePhoto}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t.photoHint}</p>
        </div>
      </section>

      <form
        className="form-section"
        onSubmit={e => {
          e.preventDefault();
          if (!nome.trim()) return show(t.nameRequired, 'error');
          setAccount(a => ({ ...a, nome: nome.trim(), telefone: telefone.trim() }));
          show(t.saved);
        }}
      >
        <Input name="nome" label={t.displayName} required value={nome} onChange={e => setNome(e.target.value)} autoComplete="name" />
        <Input name="telefone" type="tel" label={t.phone} value={telefone} onChange={e => setTelefone(e.target.value)} autoComplete="tel" />
        <div className="flex flex-col gap-1">
          <span className="pl-0.5 text-[13px] font-semibold text-foreground">{t.accountEmail}</span>
          <p className="break-all text-sm text-muted-foreground">{account.email}</p>
          <Link to="/seguranca" className="text-sm underline self-start">{t.manageEmail}</Link>
        </div>
        <Button type="submit" className="self-start" disabled={!dirty}>{t.save}</Button>
      </form>

      <div className="form-section">
        <button type="button" className="self-start text-sm text-muted-foreground underline hover:text-destructive" onClick={() => setDeleteOpen(true)}>
          {t.deleteAccount}
        </button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {}}
        title={t.deleteTitle}
        description={t.deleteText}
        confirmLabel={t.understood}
        cancelLabel={t.cancel}
      />
    </>
  );
}
