import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="DFW Live Events home">
          <span className="logo" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M9 18V5l11-2v13.2a3.5 3.5 0 1 1-2-3.16V7.4L11 8.67V18.2a3.5 3.5 0 1 1-2-.2Z" />
            </svg>
          </span>
          <span className="brand-text">
            DFW <span>Live</span> Events
          </span>
        </Link>
        <nav className="main-nav" aria-label="Primary navigation">
          <Link href="/events">Events</Link>
          <Link href="/venues">Venues</Link>
          <Link href="/about">About Us</Link>
          <Link href="/faqs">FAQs</Link>
          <Link href="/login">Login / Register</Link>
        </nav>
      </div>
    </header>
  );
}
