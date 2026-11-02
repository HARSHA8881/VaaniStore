/** VaaniStore mark: a shop awning over sound waves — "voice becomes a storefront". */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#E4621F" />
      <path
        d="M7 11.5 9 7.5h14l2 4"
        fill="none"
        stroke="#FFF4EC"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7 11.5c0 1.4 1.1 2.5 2.5 2.5S12 12.9 12 11.5c0 1.4 1.1 2.5 2.5 2.5h3c1.4 0 2.5-1.1 2.5-2.5 0 1.4 1.1 2.5 2.5 2.5S25 12.9 25 11.5"
        fill="none"
        stroke="#FFF4EC"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <g stroke="#FFF4EC" strokeWidth="2" strokeLinecap="round">
        <path d="M11 19.5v3" />
        <path d="M14 18v6" />
        <path d="M17 17v8" />
        <path d="M20 18.5v5" />
        <path d="M23 20v2" />
      </g>
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="font-display text-ink text-[1.35rem] leading-none font-semibold tracking-tight">
        Vaani<span className="text-kesar-600">Store</span>
      </span>
    </span>
  );
}
