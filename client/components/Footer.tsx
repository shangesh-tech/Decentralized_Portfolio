"use client";

import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-gray-500 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-gray-700">
            Built by <span className="font-bold text-gray-900 text-lg">Shangesh S</span>
          </p>
          <p className="text-xs">
            Craft your on‑chain portfolio, showcase projects, and share it as a
            single link.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-6">

          <div className="flex items-center gap-3 text-gray-500">
            <a
              href="https://github.com/yourusername"
              target="_blank"
              rel="noreferrer"
              className="rounded-full p-1.5 hover:bg-gray-100 hover:text-gray-900"
              aria-label="GitHub"
            >
              <FaGithub className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com/in/yourusername"
              target="_blank"
              rel="noreferrer"
              className="rounded-full p-1.5 hover:bg-gray-100 hover:text-gray-900"
              aria-label="LinkedIn"
            >
              <FaLinkedin className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com/yourusername"
              target="_blank"
              rel="noreferrer"
              className="rounded-full p-1.5 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Twitter"
            >
              <FaTwitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
