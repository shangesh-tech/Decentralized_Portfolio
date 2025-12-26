import Link from "next/link";
import { FaGithub, FaLinkedin, FaTwitter, FaGlobe } from "react-icons/fa";

// Demo portfolio data
const demoPortfolio = {
    name: "Jai Menon",
    role: "Blockchain & Web3 Engineer",
    location: "Bangalore, India",
    headline:
        "Building MEV-safe DEXs, account abstraction flows, and multi-chain wallets.",
    about:
        "Web3 engineer focused on DeFi, account abstraction, and security. Loves building infra for the Indian blockchain ecosystem and shipping battle-tested smart contracts.",
    website: "https://jaimenon.xyz",
    email: "jai.menon@example.com",
    bgColor: "#f5f5f5",
    avatarUrl:
        "https://ui-avatars.com/api/?name=Jai+Menon&size=200&background=1f2937&color=fff&bold=true",
    education: [
        "B.Tech Computer Science - NACC+ Institute, Bangalore (2023–2027)",
        "Higher Secondary - Chennai Public School (2023)",
    ],
    experience: [
        "Web3 Intern - DeFi Labs (2024, Remote)",
        "Freelance Smart Contract Developer (2023–Present)",
    ],
    projects: [
        "GhostSwap - MEV Protected DEX",
        "Amal Wallet - Multi-chain Quantum-safe Wallet",
        "EduChain - On-chain Certificates LMS",
    ],
    certifications: [
        "Ethereum Developer Bootcamp",
        "Certified Solidity Developer",
        "Zero-Knowledge Proofs Fundamentals",
    ],
    socials: {
        github: "https://github.com/jaimenon",
        linkedin: "https://linkedin.com/in/jaimenon",
        twitter: "https://twitter.com/jaimenon",
    },
};

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function PortfolioProfilePage({ params }: PageProps) {
    await params;
    const profile = demoPortfolio;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
                {/* MacBook mockup for desktop, plain card for mobile */}
                <div className="flex justify-center">
                    {/* Mobile: Simple card (no mockup) */}
                    <div className="block md:hidden w-full max-w-md">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                            <div
                                className="px-6 py-8"
                                style={{ backgroundColor: profile.bgColor }}
                            >
                                {/* Content - same as before */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg">
                                        <img
                                            src={profile.avatarUrl}
                                            alt={profile.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>

                                    <h1 className="mt-3 text-xl font-semibold text-gray-900">
                                        {profile.name}
                                    </h1>
                                    <p className="text-sm text-gray-600">{profile.role}</p>
                                    {profile.location && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            📍 {profile.location}
                                        </p>
                                    )}

                                    <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
                                        {profile.email && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1.5 text-white">
                                                <span className="text-[10px]">✉️</span>
                                                {profile.email}
                                            </span>
                                        )}
                                        {profile.website && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-gray-800 shadow-sm">
                                                <FaGlobe className="text-[10px]" />
                                                {profile.website}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 flex gap-4 text-gray-600 text-lg">
                                        {profile.socials.github && (
                                            <a
                                                href={profile.socials.github}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:text-gray-900 transition"
                                                aria-label="GitHub"
                                            >
                                                <FaGithub />
                                            </a>
                                        )}
                                        {profile.socials.linkedin && (
                                            <a
                                                href={profile.socials.linkedin}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:text-gray-900 transition"
                                                aria-label="LinkedIn"
                                            >
                                                <FaLinkedin />
                                            </a>
                                        )}
                                        {profile.socials.twitter && (
                                            <a
                                                href={profile.socials.twitter}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:text-gray-900 transition"
                                                aria-label="Twitter"
                                            >
                                                <FaTwitter />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 space-y-4 text-sm">
                                    {profile.about && (
                                        <section className="rounded-xl bg-white/90 p-4 shadow-sm border border-gray-100">
                                            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                About
                                            </h2>
                                            <p className="text-sm leading-relaxed text-gray-700">
                                                {profile.about}
                                            </p>
                                        </section>
                                    )}

                                    {profile.education.length > 0 && (
                                        <section className="rounded-xl bg-white/90 p-4 shadow-sm border border-gray-100">
                                            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Education
                                            </h2>
                                            <ul className="space-y-1.5">
                                                {profile.education.map((item, i) => (
                                                    <li
                                                        key={i}
                                                        className="flex gap-2 text-sm text-gray-700"
                                                    >
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}

                                    {profile.experience.length > 0 && (
                                        <section className="rounded-xl bg-white/90 p-4 shadow-sm border border-gray-100">
                                            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Experience
                                            </h2>
                                            <ul className="space-y-1.5">
                                                {profile.experience.map((item, i) => (
                                                    <li
                                                        key={i}
                                                        className="flex gap-2 text-sm text-gray-700"
                                                    >
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}

                                    {profile.projects.length > 0 && (
                                        <section className="rounded-xl bg-gray-900 text-white p-4 shadow-sm">
                                            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
                                                Projects
                                            </h2>
                                            <ul className="space-y-1.5">
                                                {profile.projects.map((item, i) => (
                                                    <li key={i} className="flex gap-2 text-sm text-white">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-500 flex-shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}

                                    {profile.certifications.length > 0 && (
                                        <section className="rounded-xl bg-white/90 p-4 shadow-sm border border-gray-100">
                                            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Certifications
                                            </h2>
                                            <ul className="space-y-1.5">
                                                {profile.certifications.map((item, i) => (
                                                    <li
                                                        key={i}
                                                        className="flex gap-2 text-sm text-gray-700"
                                                    >
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 flex flex-col items-center animate-fade-in-up">
                            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm hover:shadow-md transition-all duration-300">
                                <span className="text-xs font-medium text-gray-500 tracking-wide uppercase">Powered by</span>
                                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                                    {/* Ethereum Logo */}
                                    <div className="flex items-center gap-1.5 group">
                                        <img
                                            src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                                            alt="Ethereum"
                                            className="h-5 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Ethereum</span>
                                    </div>

                                    <span className="text-gray-300 px-1 font-light">×</span>

                                    {/* Polygon Logo */}
                                    <div className="flex items-center gap-1.5 group">
                                        <img
                                            src="https://cryptologos.cc/logos/polygon-matic-logo.png"
                                            alt="Polygon"
                                            className="h-5 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Polygon</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop: Premium MacBook Pro Mockup */}
                    <div className="hidden md:block w-full max-w-6xl">
                        <div className="relative" style={{ perspective: "1500px" }}>
                            {/* Outer glow effect */}
                            <div className="absolute -inset-4 bg-gradient-to-b from-gray-400/20 via-transparent to-transparent blur-2xl rounded-3xl"></div>

                            {/* MacBook Screen Assembly */}
                            <div
                                className="relative mx-auto"
                                style={{
                                    transform: "rotateX(6deg)",
                                    transformOrigin: "bottom center"
                                }}
                            >
                                {/* Screen lid - outer aluminum shell */}
                                <div className="relative bg-gradient-to-b from-[#2d2d2d] via-[#1a1a1a] to-[#0d0d0d] rounded-t-[18px] p-[3px] shadow-[0_-2px_20px_rgba(0,0,0,0.3),0_4px_40px_rgba(0,0,0,0.4)]">
                                    {/* Inner bezel */}
                                    <div className="bg-[#0a0a0a] rounded-t-[15px] p-[8px] pb-[10px]">
                                        {/* Camera area with notch */}
                                        <div className="absolute top-[3px] left-1/2 -translate-x-1/2 z-30">
                                            <div className="relative">
                                                {/* Notch background */}
                                                <div className="w-[180px] h-[24px] bg-[#0a0a0a] rounded-b-[12px] flex items-center justify-center gap-3">
                                                    {/* Camera lens */}
                                                    <div className="relative">
                                                        <div className="w-[6px] h-[6px] rounded-full bg-[#1a1a1a] ring-1 ring-[#333]">
                                                            <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-[#2a3a4a] to-[#1a2a3a]"></div>
                                                            <div className="absolute top-[1px] left-[1px] w-[2px] h-[2px] rounded-full bg-[#3a4a5a]/50"></div>
                                                        </div>
                                                    </div>
                                                    {/* Camera indicator light */}
                                                    <div className="w-[4px] h-[4px] rounded-full bg-[#1a1a1a]"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Screen glass with reflection */}
                                        <div className="relative bg-black rounded-[8px] overflow-hidden">
                                            {/* Screen reflection overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none z-10"></div>

                                            {/* Browser chrome */}
                                            <div className="bg-gradient-to-b from-[#3d3d3d] to-[#2a2a2a] px-4 py-2.5 flex items-center gap-3">
                                                {/* Window controls */}
                                                <div className="flex gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-inner flex items-center justify-center group cursor-pointer hover:brightness-90">
                                                        <svg className="w-1.5 h-1.5 text-[#99393a] opacity-0 group-hover:opacity-100" fill="currentColor" viewBox="0 0 10 10">
                                                            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                                        </svg>
                                                    </div>
                                                    <div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-inner flex items-center justify-center group cursor-pointer hover:brightness-90">
                                                        <svg className="w-1.5 h-1.5 text-[#9a7a3a] opacity-0 group-hover:opacity-100" fill="currentColor" viewBox="0 0 10 10">
                                                            <rect x="1" y="4.5" width="8" height="1" fill="currentColor" />
                                                        </svg>
                                                    </div>
                                                    <div className="w-3 h-3 rounded-full bg-[#28c840] shadow-inner flex items-center justify-center group cursor-pointer hover:brightness-90">
                                                        <svg className="w-1.5 h-1.5 text-[#2a8a3a] opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 10 10">
                                                            <path d="M2 3l3 3 3-3M2 7l3-3 3 3" stroke="currentColor" strokeWidth="1" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                {/* Navigation buttons */}
                                                <div className="flex gap-1.5 text-[#888]">
                                                    <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                    </button>
                                                    <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {/* URL bar */}
                                                <div className="flex-1 mx-2">
                                                    <div className="bg-[#1a1a1a] rounded-lg px-4 py-2 text-xs text-[#999] flex items-center gap-2 border border-[#333]">
                                                        <svg className="w-3 h-3 text-[#28c840]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                        <span className="text-[#28c840]">https://</span>
                                                        <span className="text-[#ccc]">{profile.website?.replace('https://', '')}</span>
                                                    </div>
                                                </div>

                                                {/* Browser actions */}
                                                <div className="flex gap-2 text-[#888]">
                                                    <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                        </svg>
                                                    </button>
                                                    <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Portfolio content */}
                                            <div
                                                className="overflow-y-auto px-10 py-8 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
                                                style={{
                                                    backgroundColor: profile.bgColor,
                                                    height: "480px",
                                                }}
                                            >
                                                <div className="max-w-3xl mx-auto">
                                                    {/* Header */}
                                                    <div className="flex items-start gap-6">
                                                        <div className="w-28 h-28 rounded-full overflow-hidden shadow-xl flex-shrink-0 ring-4 ring-white/50">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={profile.avatarUrl}
                                                                alt={profile.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>

                                                        <div className="flex-1">
                                                            <h1 className="text-3xl font-bold text-gray-900">
                                                                {profile.name}
                                                            </h1>
                                                            <p className="text-lg text-gray-600 mt-1">
                                                                {profile.role}
                                                            </p>
                                                            {profile.location && (
                                                                <p className="mt-2 text-sm text-gray-500">
                                                                    📍 {profile.location}
                                                                </p>
                                                            )}

                                                            <div className="mt-4 flex flex-wrap gap-2">
                                                                {profile.email && (
                                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm text-white">
                                                                        ✉️ {profile.email}
                                                                    </span>
                                                                )}
                                                                {profile.website && (
                                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm text-gray-800 shadow-sm border border-gray-200">
                                                                        <FaGlobe className="text-xs" />
                                                                        {profile.website}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="mt-4 flex gap-4 text-gray-600 text-xl">
                                                                {profile.socials.github && (
                                                                    <a
                                                                        href={profile.socials.github}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="hover:text-gray-900 transition"
                                                                        aria-label="GitHub"
                                                                    >
                                                                        <FaGithub />
                                                                    </a>
                                                                )}
                                                                {profile.socials.linkedin && (
                                                                    <a
                                                                        href={profile.socials.linkedin}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="hover:text-gray-900 transition"
                                                                        aria-label="LinkedIn"
                                                                    >
                                                                        <FaLinkedin />
                                                                    </a>
                                                                )}
                                                                {profile.socials.twitter && (
                                                                    <a
                                                                        href={profile.socials.twitter}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="hover:text-gray-900 transition"
                                                                        aria-label="Twitter"
                                                                    >
                                                                        <FaTwitter />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Grid sections */}
                                                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                                                        {profile.about && (
                                                            <section className="rounded-2xl bg-white/95 p-5 shadow-sm border border-gray-100 backdrop-blur-sm">
                                                                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                    About
                                                                </h2>
                                                                <p className="text-sm leading-relaxed text-gray-700">
                                                                    {profile.about}
                                                                </p>
                                                            </section>
                                                        )}

                                                        {profile.education.length > 0 && (
                                                            <section className="rounded-2xl bg-white/95 p-5 shadow-sm border border-gray-100 backdrop-blur-sm">
                                                                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                    Education
                                                                </h2>
                                                                <ul className="space-y-2">
                                                                    {profile.education.map((item, i) => (
                                                                        <li
                                                                            key={i}
                                                                            className="flex gap-2 text-sm text-gray-700"
                                                                        >
                                                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                                                            <span>{item}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </section>
                                                        )}

                                                        {profile.experience.length > 0 && (
                                                            <section className="rounded-2xl bg-white/95 p-5 shadow-sm border border-gray-100 backdrop-blur-sm">
                                                                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                    Experience
                                                                </h2>
                                                                <ul className="space-y-2">
                                                                    {profile.experience.map((item, i) => (
                                                                        <li
                                                                            key={i}
                                                                            className="flex gap-2 text-sm text-gray-700"
                                                                        >
                                                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                                                            <span>{item}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </section>
                                                        )}

                                                        {profile.projects.length > 0 && (
                                                            <section className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 shadow-lg">
                                                                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
                                                                    Projects
                                                                </h2>
                                                                <ul className="space-y-2">
                                                                    {profile.projects.map((item, i) => (
                                                                        <li
                                                                            key={i}
                                                                            className="flex gap-2 text-sm text-white"
                                                                        >
                                                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-500 flex-shrink-0" />
                                                                            <span>{item}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </section>
                                                        )}

                                                        {profile.certifications.length > 0 && (
                                                            <section className="rounded-2xl bg-white/95 p-5 shadow-sm border border-gray-100 md:col-span-2 backdrop-blur-sm">
                                                                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                    Certifications
                                                                </h2>
                                                                <ul className="grid md:grid-cols-2 gap-2">
                                                                    {profile.certifications.map((item, i) => (
                                                                        <li
                                                                            key={i}
                                                                            className="flex gap-2 text-sm text-gray-700"
                                                                        >
                                                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                                                            <span>{item}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </section>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MacBook Base / Keyboard Section - Best "Silver Aluminum" Version */}
                            <div className="relative z-10">
                                {/* Hinge Connection (Darker strip connecting screen to base) */}
                                <div
                                    className="relative mx-auto h-[10px] bg-[#1a1a1a] rounded-b-md shadow-inner"
                                    style={{ width: "calc(100% - 4px)" }}
                                >
                                    {/* Subtle metallic reflection on the hinge */}
                                    <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-b from-[#333] to-transparent opacity-50"></div>
                                </div>

                                {/* Main Aluminum Chassis */}
                                <div
                                    className="relative mx-auto rounded-b-[16px] overflow-hidden"
                                    style={{
                                        width: "116%", // Optimized width for perspective
                                        marginLeft: "-8%",
                                        height: "30px",
                                        // Realistic aluminum gradient
                                        background: "linear-gradient(to bottom, #e2e2e4 0%, #c5c5c9 100%)",
                                        // Complex shadow for grounding + top edge highlight
                                        boxShadow: "0 -1px 0 rgba(255,255,255,0.4) inset, 0 15px 40px -10px rgba(0,0,0,0.4)"
                                    }}
                                >
                                    {/* Keyboard Well Indentation (Subtle depth) */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[5px] bg-[#a8a8ad] opacity-40 rounded-b-sm"></div>

                                    {/* Trackpad (Glass surface look) */}
                                    <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[28%] h-[16px]">
                                        <div className="w-full h-full bg-[#d1d1d6] rounded-[3px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.15),0_1px_0_rgba(255,255,255,0.6)]"></div>
                                    </div>

                                    {/* The "Lip" (Opening Cutout) */}
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[18%] h-[4px] bg-[#9ca3af] rounded-t-lg shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"></div>

                                    {/* Side Highlights (Chamfered Edges) */}
                                    <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-white/60 to-transparent"></div>
                                    <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-white/60 to-transparent"></div>
                                </div>

                                {/* Ambient Surface Shadow (The fuzzy shadow on the table) */}
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[100%] h-[20px] bg-black/20 blur-xl rounded-[50%]"></div>
                            </div>

                            <div className="mt-16 flex flex-col items-center animate-fade-in-up">
                                <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm hover:shadow-md transition-all duration-300">
                                    <span className="text-xs font-medium text-gray-500 tracking-wide uppercase">Powered by</span>
                                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                                        {/* Ethereum Logo */}
                                        <div className="flex items-center gap-1.5 group">
                                            <img
                                                src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                                                alt="Ethereum"
                                                className="h-5 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Ethereum</span>
                                        </div>

                                        <span className="text-gray-300 px-1 font-light">×</span>

                                        {/* Polygon Logo */}
                                        <div className="flex items-center gap-1.5 group">
                                            <img
                                                src="https://cryptologos.cc/logos/polygon-matic-logo.png"
                                                alt="Polygon"
                                                className="h-5 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Polygon</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
