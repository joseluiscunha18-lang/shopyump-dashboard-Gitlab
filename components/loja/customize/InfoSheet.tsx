'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { updateLoja } from '@/lib/mutations/loja';

/**
 * Painel contextual de Nome/Descrição — a versão "toque para editar" do
 * que antes vivia lá em baixo, dentro de "Informações gerais" do
 * formulário completo. Continua a existir também em "Mais
 * configurações" (StoreSettingsForm) para quem prefere um formulário
 * único; os dois escrevem no mesmo lugar (`updateLoja`), nunca há duas
 * fontes de verdade.
 */
export function InfoSheet({
  open,
  onClose,
  lojaId,
  nome: nomeInicial,
  descricao: descricaoInicial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  lojaId: string;
  nome: string;
  descricao: string;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [descricao, setDescricao] = useState(descricaoInicial);
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  async function handleSave() {
    setSaving(true);
    const res = await updateLoja(lojaId, { nome, descricao });
    setSaving(false);
    if (!res.ok) return show(res.error ?? 'Não foi possível guardar.', 'error');
    show('Loja atualizada.');
    onSaved();
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Nome e descrição" heightVh={55}>
      <div className="flex flex-col gap-4 pb-4">
        <Input label="Nome da loja" value={nome} onChange={(e) => setNome(e.target.value)} />
        <Textarea label="Descrição" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <Button type="button" loading={saving} onClick={handleSave} className="self-start">
          Guardar
        </Button>
      </div>
    </Sheet>
  );
}
