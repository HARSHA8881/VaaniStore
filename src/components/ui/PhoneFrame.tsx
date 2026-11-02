/**
 * A phone-shaped frame. Used on the landing page (static showcase) and in the
 * dashboard (live, scrollable preview of the owner's page).
 */
export function PhoneFrame({
  children,
  className = "",
  scroll = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Let the screen scroll (dashboard preview). */
  scroll?: boolean;
}) {
  return (
    <div
      className={`shadow-lift relative rounded-[2.75rem] bg-[#16110e] p-[0.6rem] ring-1 ring-black/10 ${className}`}
    >
      {/* Side buttons, purely decorative. */}
      <span
        className="absolute top-28 -left-[3px] h-12 w-[3px] rounded-l bg-[#2a221d]"
        aria-hidden
      />
      <span
        className="absolute top-44 -left-[3px] h-12 w-[3px] rounded-l bg-[#2a221d]"
        aria-hidden
      />
      <span
        className="absolute top-36 -right-[3px] h-16 w-[3px] rounded-r bg-[#2a221d]"
        aria-hidden
      />
      <div
        // Static mode uses overflow-hidden (a scroll container) on purpose: it keeps the
        // shop's sticky WhatsApp bar inside the frame instead of sticking to the page.
        className={`relative h-full rounded-[2.2rem] bg-white ${scroll ? "[scrollbar-width:none] overflow-x-clip overflow-y-auto overscroll-contain" : "overflow-hidden"}`}
      >
        <span
          className="pointer-events-none sticky top-2 z-30 mx-auto -mb-7 block h-5 w-24 rounded-full bg-[#16110e]"
          aria-hidden
        />
        {children}
      </div>
    </div>
  );
}
