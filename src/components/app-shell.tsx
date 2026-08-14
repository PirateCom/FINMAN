import { BottomNav } from "@/components/bottom-nav";

export function AppShell({
  children,
  title,
  action,
  back,
}: {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-[var(--surface)] shadow-[0_0_80px_rgba(28,25,23,0.06)]">
      {title ? (
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)]/95 px-5 py-4 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            {back}
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
          </div>
          {action}
        </header>
      ) : null}
      <div className="px-5 pb-28 pt-5">{children}</div>
      <BottomNav />
    </div>
  );
}
