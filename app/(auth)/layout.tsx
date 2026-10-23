/**
 * O enquadramento visual (fundo, largura, marca) vem do <AuthShell>, usado em
 * cada rota de autenticação. Este layout não deve acrescentar moldura nem
 * padding, senão o conteúdo fica aninhado e comprimido no telemóvel.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
