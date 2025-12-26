"use client";

import Link from "next/link";
import Web3Connect from "./Web3Connect";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex flex-col leading-tight">
            <span className="text-md md:text-2xl font-bold text-gray-900">
              Decentralized Portfolio
            </span>
            <span className="hidden md:block text-[11px] text-gray-500">
              On‑chain profile builder
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Web3Connect />
        </div>
      </div>
    </header>
  );
}
