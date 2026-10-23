/**
 * O enquadramento visual vem do <AuthShell> usado pela rota de onboarding.
 * Sem moldura nem padding aqui, para não duplicar o contentor.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
