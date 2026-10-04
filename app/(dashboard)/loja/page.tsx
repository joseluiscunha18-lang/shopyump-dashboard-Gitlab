import { redirect } from 'next/navigation';

/**
 * A antiga página simulada de "Personalizar loja" foi substituída pelo editor
 * de temas em /personalizar. Esta rota fica só para não partir links antigos
 * (menu, guias de onboarding, favoritos) — redireciona.
 */
export default function LojaPage() {
  redirect('/personalizar');
}
