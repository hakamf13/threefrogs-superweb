import Link from "next/link";
import { Sparkles } from "lucide-react";

type EmptyStateCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export default function EmptyStateCard({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: EmptyStateCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-[var(--tf-border)] bg-white p-6 shadow-[var(--tf-shadow-card)] sm:p-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--tf-lavender)] text-[var(--tf-purple)]">
          <Sparkles className="h-6 w-6" />
        </div>

        {eyebrow ? (
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-[var(--tf-orange-dark)]">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="mt-3 text-2xl font-black tracking-tight text-[var(--tf-purple)] sm:text-3xl">
          {title}
        </h2>

        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
          {description}
        </p>

        {actionHref && actionLabel ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={actionHref}
              className="inline-flex items-center rounded-2xl bg-[var(--tf-purple)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--tf-purple-dark)]"
            >
              {actionLabel}
            </Link>

            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="inline-flex items-center rounded-2xl border border-[var(--tf-border)] bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}