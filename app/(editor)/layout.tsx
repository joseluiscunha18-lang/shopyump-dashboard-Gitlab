/**
 * Editor da loja em ecrã inteiro: fica FORA da moldura do painel (sem
 * Sidebar/TopBar/BottomNav).
 *
 * A proteção de sessão vive no loader da rota (lib/routes/personalizar.editor.tsx),
 * porque getUserContext usa o cliente Supabase do navegador e não pode ser
 * chamado a partir de um Server Component. O middleware continua a barrar
 * pedidos sem sessão.
 */
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
