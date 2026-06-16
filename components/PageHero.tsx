import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  copy: string;
}

export function PageHero({ eyebrow, title, copy }: PageHeroProps) {
  return (
    <section className="hero" aria-labelledby="page-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="page-title">{title}</h1>
      <p className="hero-copy">{copy}</p>
    </section>
  );
}
