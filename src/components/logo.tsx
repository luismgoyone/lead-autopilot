// Pine tree whose outline doubles as a tooth (crown on top, two roots below).
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
      <rect width="60" height="60" rx="16" fill="#DCE5DF" />
      <path
        d="M30 11C32 11 35 15 37 17L43 23C45 25 43 27 40 27L45 33C47 35 45 37 42 37L46 43C48 46 45 48 42 48L37 48C36 50 36 53 35 55C34 56 32 56 31 53C30.5 50.5 30.5 49 30 49C29.5 49 29.5 50.5 29 53C28 56 26 56 25 55C24 53 24 50 23 48L18 48C15 48 12 46 14 43L18 37C15 37 13 35 15 33L20 27C17 27 15 25 17 23L23 17C25 15 28 11 30 11Z"
        fill="#2F5D50"
      />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark />
      <span className={`font-display text-lg font-semibold whitespace-nowrap sm:text-xl ${light ? "text-white" : "text-slate"}`}>
        Pinecrest <span className={`italic font-normal ${light ? "text-sage" : "text-pine"}`}>Dental</span>
      </span>
    </span>
  );
}
