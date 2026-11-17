"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  disabled?: boolean;
  soon?: string;
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <>
      {items.map((it) => {
        const active = it.href === "/raadgiver" ? path === it.href : path.startsWith(it.href);
        if (it.disabled)
          return (
            <span key={it.href} className="navlink" aria-disabled="true" title={it.soon}>
              <Icon name={it.icon} />
              {it.label}
              <span className="soon">{it.soon}</span>
            </span>
          );
        return (
          <Link key={it.href} className="navlink" href={it.href} aria-current={active ? "page" : undefined}>
            <Icon name={it.icon} />
            {it.label}
          </Link>
        );
      })}
    </>
  );
}
