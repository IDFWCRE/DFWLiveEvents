"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cities } from "@/lib/cities";

export function CityNavDropdown() {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function closeDropdown() {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const details = detailsRef.current;
      if (!details?.open || !event.target) return;
      if (!details.contains(event.target as Node)) {
        details.open = false;
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDropdown();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <details className="nav-dropdown" ref={detailsRef}>
      <summary>City</summary>
      <div className="nav-menu">
        {cities.map((city) => (
          <Link href={city.path} key={city.slug} onClick={closeDropdown}>
            {city.name}
          </Link>
        ))}
      </div>
    </details>
  );
}
