import type { ReactNode } from 'react';

/** Shared frame for login, registo, recuperação e onboarding — same tokens & type as the dashboard. */
export function AuthShell({ children, hideBrand }: { children: ReactNode; hideBrand?: boolean }) {
  return (
    <div className="min-h-[100dvh] w-full bg-muted text-foreground font-body flex flex-col">
      <div className={hideBrand ? 'w-full max-w-[440px] mx-auto px-5 pt-6 pb-10 sm:pt-10 flex-1 flex flex-col' : 'w-full max-w-[440px] mx-auto px-5 pt-14 pb-10 sm:pt-16 flex-1 flex flex-col'}>
        {!hideBrand && <div className="mb-14 sm:mb-10 text-[17px] font-black tracking-tight text-foreground">Shopyump</div>}
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </div>
  );
}
