import Link from "next/link";

export function ScopeToggle({
  familyHref,
  youHref,
  current,
}: {
  familyHref: string;
  youHref: string;
  current: "family" | "you";
}) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-1">
      <Link
        href={youHref}
        className={`h-10 rounded-xl text-center text-sm font-semibold leading-10 ${
          current === "you"
            ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm"
            : "text-[var(--foreground)]"
        }`}
      >
        You
      </Link>
      <Link
        href={familyHref}
        className={`h-10 rounded-xl text-center text-sm font-semibold leading-10 ${
          current === "family"
            ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-sm"
            : "text-[var(--foreground)]"
        }`}
      >
        Family
      </Link>
    </div>
  );
}
