'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/ShopyumpInput';
import { Button } from '@/components/ui/ShopyumpButton';
import { useToast } from '@/components/ui/Toast';
import { useDashboardState } from '@/components/dashboard/DashboardState';
import { useAccountT } from '@/lib/i18n/account';
import { alterarEmail, alterarSenha } from '@/lib/auth/client';

export function SecurityForm() {
  const { account } = useDashboardState();
  const { show } = useToast();
  const t = useAccountT();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <>
      <section className="form-section">
        <h3>{t.password}</h3>
        {account.metodoAcesso === 'google' ? (
          <p className="text-sm text-muted-foreground">{t.googleOnly}</p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={async e => {
              e.preventDefault();
              if (password.length < 8 || !/\d/.test(password)) return show(t.passwordShort, 'error');
              if (password !== confirm) return show(t.passwordMismatch, 'error');
              setSaving(true);
              const r = await alterarSenha(account.email, current, password);
              setSaving(false);
              if (!r.ok) return show(r.error, 'error');
              show('Senha alterada com sucesso.');
              setCurrent(''); setPassword(''); setConfirm('');
            }}
          >
            <Input name="current-password" label={t.currentPassword} type="password" required autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} />
            <Input name="new-password" label={t.newPassword} type="password" required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
            <Input name="confirm-password" label={t.confirmPassword} type="password" required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
            <Button type="submit" className="self-start" loading={saving} disabled={!current || !password || !confirm}>{t.changePassword}</Button>
          </form>
        )}
      </section>

      <section className="form-section">
        <h3>{t.loginEmail}</h3>
        <div className="flex flex-col gap-1">
          <span className="pl-0.5 text-[13px] font-semibold text-foreground">{t.currentEmail}</span>
          <p className="break-all text-sm text-muted-foreground">{account.email}</p>
        </div>
        {pending && <p className="text-sm text-muted-foreground" role="status">{t.emailPending(pending)}</p>}
        {editingEmail ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={async e => {
              e.preventDefault();
              const v = email.trim();
              if (!/^\S+@\S+\.\S+$/.test(v)) return show(t.emailInvalid, 'error');
              if (v.toLowerCase() === account.email.toLowerCase()) return show(t.emailSame, 'error');
              setSaving(true);
              const r = await alterarEmail(v);
              setSaving(false);
              if (!r.ok) return show(r.error, 'error');
              setPending(v); setEditingEmail(false); setEmail('');
            }}
          >
            <Input name="new-email" type="email" label={t.newEmail} required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={saving} disabled={!email.trim()}>{t.sendVerification}</Button>
              <Button type="button" variant="ghost" onClick={() => { setEditingEmail(false); setEmail(''); }}>{t.cancel}</Button>
            </div>
          </form>
        ) : (
          <Button type="button" variant="secondary" className="self-start" onClick={() => { setPending(null); setEditingEmail(true); }}>{t.changeEmail}</Button>
        )}
      </section>
    </>
  );
}
