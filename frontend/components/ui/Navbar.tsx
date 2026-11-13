"use client";

import { MAP_LAYER } from '@/components/map/layers';
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "./navigation-menu";

const links = [
  { label: "Home", href: "/" },
  { label: "Map", href: "/map" },
  { label: "Action Plan", href: "/action-plan" },
  { label: "Documents", href: "/docs" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className={`pointer-events-none fixed inset-x-0 top-4 ${MAP_LAYER.topBar} flex justify-center px-4`}>
      <div className="pointer-events-auto flex w-fit items-center gap-3">
        {/* <Link
          href="/"
          aria-label="NASA Space Apps home"
          className="glass-panel inline-flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold text-foreground"
        >
          <Image
            src="/nasa-logo.svg"
            alt="NASA logo"
            width={40}
            height={40}
            className="size-9 shrink-0 rounded-full object-cover"
          />
          <span>NASA Space Apps</span>
        </Link> */}

        <NavigationMenu
          aria-label="Main navigation"
          className="glass-panel min-w-0 rounded-full p-1"
        >
          <NavigationMenuList className="justify-center gap-0.5 overflow-x-auto">
            {links.map(({ label, href }) => {
              const active =
                pathname === href ||
                (href !== "/" && pathname.startsWith(`${href}/`));
              return (
                <NavigationMenuItem key={href}>
                  <NavigationMenuLink
                    href={href}
                    render={<Link href={href} />}
                    aria-current={active ? "page" : undefined}
                    data-active={active}
                    className={`whitespace-nowrap rounded-full px-3 py-2 text-xs transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-telemetry sm:px-4 sm:text-sm ${active ? "bg-black text-white hover:bg-black" : "text-secondary hover:bg-white/5 hover:text-white"}`}
                  >
                    {label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

      </div>
    </header>
  );
}
