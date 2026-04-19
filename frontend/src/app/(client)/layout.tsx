export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto min-h-screen relative shadow-[0_0_50px_rgba(208,0,0,0.05)] bg-boston-black border-x border-white/5">
      {children}
    </div>
  );
}
