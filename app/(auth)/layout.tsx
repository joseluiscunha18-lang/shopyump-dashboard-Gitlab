export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 sm:p-12 bg-[#F9F7F5]">
      <div className="w-full max-w-[420px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-black text-ink tracking-tighter">Shopyump</h1>
        </div>
        <div className="bg-white p-8 sm:p-10 rounded-[32px] shadow-[0_20px_40px_-15px_rgba(15,23,42,0.08)]">
          {children}
        </div>
      </div>
    </div>
  );
}
