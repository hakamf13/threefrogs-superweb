type EmptyStateCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export default function EmptyStateCard({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateCardProps) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[var(--tf-shadow-card)]">
      {eyebrow ? (
        <p className="text-sm font-black uppercase tracking-widest text-[var(--tf-orange-dark)]">
          {eyebrow}
        </p>
      ) : null}

      <h3 className="mt-3 text-2xl font-black text-[var(--tf-purple)]">
        {title}
      </h3>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
        {description}
      </p>

      {actionHref && actionLabel ? (
        <a
          href={actionHref}
          className="mt-6 inline-flex rounded-2xl bg-[var(--tf-purple)] px-5 py-3 font-bold text-white transition hover:bg-[var(--tf-purple-dark)]"
        >
          {actionLabel}
        </a>
      ) : null}
    </div>
  );
}