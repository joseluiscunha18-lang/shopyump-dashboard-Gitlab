export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#F9F7F5] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[480px] mx-auto">{children}</div>
    </div>
  );
}
