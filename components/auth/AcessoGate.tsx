'use client';

import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { AuthButton, AuthField } from './AuthUI';

type Estado = 'a-verificar' | 'bloqueado' | 'liberado';

/**
 * Janela de acesso restrito, por cima do login, enquanto o site está em desenvolvimento.
 * A verificação real é feita no servidor (middleware + /api/acesso): esta janela só recolhe a senha.
 * Enquanto verifica, tapa o ecrã por completo para o formulário de login nunca ficar exposto.
 */
export function AcessoGate() {
  const [estado, setEstado] = useState<Estado>('a-verificar');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelado = false;
    fetch('/api/acesso', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { ativo: boolean; liberado: boolean }) => {
        if (!cancelado) setEstado(!d.ativo || d.liberado ? 'liberado' : 'bloqueado');
      })
      // Em caso de falha de rede fica bloqueado (nunca abre por engano).
      .catch(() => { if (!cancelado) setEstado('bloqueado'); });
    return () => { cancelado = true; };
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!senha.trim()) return setErro('Introduza a senha de acesso.');
    setLoading(true);
    setErro('');
    try {
      const r = await fetch('/api/acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      });
      if (r.ok) {
        // Recarrega para o middleware ver o cookie novo (e, se já houver sessão, levar ao painel).
        window.location.reload();
        return;
      }
      setErro(r.status === 401 ? 'Senha incorreta.' : 'Não foi possível verificar. Tente novamente.');
    } catch {
      setErro('Sem ligação. Tente novamente.');
    }
    setLoading(false);
  }

  if (estado === 'liberado') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-5">
      {estado === 'bloqueado' && (
        <form
          onSubmit={entrar}
          noValidate
          role="dialog"
          aria-modal="true"
          aria-labelledby="acesso-titulo"
          className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-foreground/20 text-foreground">
            <Lock size={22} />
          </div>
          <h2 id="acesso-titulo" className="text-[22px] font-bold leading-[1.15] tracking-tight text-foreground">Acesso restrito</h2>
          <p className="mb-6 mt-2 text-[15px] leading-relaxed text-muted-foreground">
            O Shopyump está em desenvolvimento. Introduza a senha de acesso para continuar.
          </p>
          <AuthField
            label="Senha de acesso"
            type="password"
            placeholder="Senha de acesso"
            autoComplete="off"
            autoFocus
            value={senha}
            onChange={(e) => { setSenha(e.target.value); setErro(''); }}
            error={erro}
            className="rounded-full px-5"
          />
          <AuthButton type="submit" loading={loading} className="mt-5 rounded-full">Continuar</AuthButton>
        </form>
      )}
    </div>
  );
}
