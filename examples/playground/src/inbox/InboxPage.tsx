export const InboxPage = ({ title }: { title: string | null }) => {
  return (
    <div className="h-[340px] px-6 py-5">
      {title
        ? <h3 className="text-[18px] font-semibold text-foreground">{title}</h3>
        : (
            <p className="max-w-[260px] text-[14px] leading-relaxed text-muted-foreground">
              Send something from the server below, then open the bell.
            </p>
          )}

      <div className="mt-5 grid w-1/2 gap-3" aria-hidden>
        <div className="h-2.5 w-full rounded bg-muted" />
        <div className="h-2.5 w-4/5 rounded bg-muted" />
        <div className="h-2.5 w-3/5 rounded bg-muted" />
      </div>

      <div className="mt-6 grid w-1/2 grid-cols-2 gap-3" aria-hidden>
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
      </div>
    </div>
  );
};
