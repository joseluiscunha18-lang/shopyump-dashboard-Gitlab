'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { UserRound } from 'lucide-react';
import { useDashboardState } from '@/components/dashboard/DashboardState';
import { useToast } from '@/components/ui/Toast';
import { useAccountT } from '@/lib/i18n/account';

export function accountInitials(nome: string) {
  return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

/** Fotografia com esqueleto: o gradiente nunca aparece enquanto a imagem ainda está a carregar. */
function AvatarFoto({ src }: { src: string }) {
  const [pronta, setPronta] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    setPronta(false);
    // Imagem já em cache: o evento load pode ter disparado antes de o React ligar o handler.
    if (ref.current?.complete && ref.current.naturalWidth > 0) setPronta(true);
  }, [src]);
  return (
    <>
      {!pronta && <span className="avatar-skeleton" aria-hidden="true" />}
      <img
        ref={ref}
        src={src}
        alt=""
        className="account-avatar-img"
        style={{ opacity: pronta ? 1 : 0 }}
        onLoad={() => setPronta(true)}
        onError={() => setPronta(true)}
      />
    </>
  );
}

/** Avatar pessoal: fotografia se existir, senão iniciais sobre o gradiente da marca. */
export function AccountAvatar() {
  const { account } = useDashboardState();
  if (account.foto) return <AvatarFoto src={account.foto} />;
  return <span aria-hidden="true">{accountInitials(account.nome) || <UserRound size={22} />}</span>;
}

/** Abre o seletor de imagens do dispositivo e atualiza a fotografia pessoal. */
export function useAvatarPicker() {
  const { setAccount } = useDashboardState();
  const { show } = useToast();
  const t = useAccountT();
  const ref = useRef<HTMLInputElement>(null);
  const input: ReactNode = (
    <input
      ref={ref}
      type="file"
      accept="image/*"
      hidden
      onChange={e => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) return show(t.photoInvalid, 'error');
        const reader = new FileReader();
        reader.onload = () => {
          setAccount(a => ({ ...a, foto: String(reader.result) }));
          show(t.photoUpdated);
        };
        reader.readAsDataURL(file);
      }}
    />
  );
  return { open: () => ref.current?.click(), input };
}
