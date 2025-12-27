"use client";

import { useState, useEffect } from "react";
import { Github, Linkedin, Twitter, Globe, Loader2, Lock, AlertCircle, ExternalLink, Shield } from "lucide-react";
import { getContract, getRpcClient, eth_getLogs, eth_blockNumber } from "thirdweb";
import { download } from "thirdweb/storage";
import { client } from "@/lib/client";
import { defaultChain } from "@/lib/chains";
import { Web3PortfolioAddress } from "@/lib/constant";
import { useParams } from "next/navigation";
import { readContract } from "thirdweb";
import { decodeEventLog, keccak256, toHex } from "viem";

// Initialize contract
const contract = getContract({
    client,
    chain: defaultChain,
    address: Web3PortfolioAddress,
});

// Event ABI for PortfolioCreated
const portfolioCreatedEventAbi = {
    type: "event",
    name: "PortfolioCreated",
    inputs: [
        { indexed: true, name: "owner", type: "address" },
        { indexed: false, name: "userName", type: "string" },
    ],
} as const;

type PortfolioData = {
    name: string;
    role: string;
    location: string;
    email: string;
    website: string;
    github: string;
    linkedin: string;
    twitter: string;
    education: string;
    experience: string;
    projects: string;
    certifications: string;
    about: string;
    bgColor: string;
    isPrivate?: boolean;
};

type Profile = PortfolioData & {
    avatarUrl: string;
    educationList: string[];
    experienceList: string[];
    projectsList: string[];
    certificationsList: string[];
};

export default function PortfolioProfilePage() {
    const params = useParams();
    const walletAddress = params.id as string;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPrivate, setIsPrivate] = useState(false);

    // Get chain explorer URL
    const getExplorerUrl = () => {
        const explorerBaseUrl = defaultChain.blockExplorers?.[0]?.url || "https://amoy.polygonscan.com";
        return `${explorerBaseUrl}/address/${Web3PortfolioAddress}`;
    };

    useEffect(() => {
        async function fetchPortfolio() {
            if (!walletAddress) return;

            setIsLoading(true);
            setError(null);

            try {
                console.log("📡 Fetching portfolio for:", walletAddress);

                // Step 1: Get the PortfolioCreated event to find the username
                const rpcClient = getRpcClient({ client, chain: defaultChain });
                
                // Get current block number
                const currentBlock = await eth_blockNumber(rpcClient);
                
                // Event topic for PortfolioCreated(address indexed owner, string userName)
                const eventSignature = keccak256(toHex("PortfolioCreated(address,string)"));
                
                // Pad the wallet address to 32 bytes for topic filtering
                const paddedAddress = `0x000000000000000000000000${walletAddress.slice(2).toLowerCase()}` as `0x${string}`;

                // Query in chunks of 1000 blocks (RPC limit)
                const CHUNK_SIZE = BigInt(1000);
                let logs: Awaited<ReturnType<typeof eth_getLogs>> = [];
                let toBlock = currentBlock;
                let fromBlock = toBlock > CHUNK_SIZE ? toBlock - CHUNK_SIZE : BigInt(0);
                
                // Search backwards in chunks until we find the event or reach block 0
                const MAX_ITERATIONS = 100; // Limit to prevent infinite loops
                for (let i = 0; i < MAX_ITERATIONS && logs.length === 0; i++) {
                    logs = await eth_getLogs(rpcClient, {
                        address: Web3PortfolioAddress,
                        topics: [eventSignature, paddedAddress],
                        fromBlock: fromBlock,
                        toBlock: toBlock,
                    });
                    
                    if (logs.length > 0) break;
                    
                    // Move to previous chunk
                    if (fromBlock === BigInt(0)) break; // Reached the beginning
                    toBlock = fromBlock - BigInt(1);
                    fromBlock = toBlock > CHUNK_SIZE ? toBlock - CHUNK_SIZE : BigInt(0);
                }

                if (!logs || logs.length === 0) {
                    console.log("❌ No portfolio found");
                    setError("Portfolio not found for this address");
                    setIsLoading(false);
                    return;
                }

                // Decode the event to get userName
                const decodedLog = decodeEventLog({
                    abi: [portfolioCreatedEventAbi],
                    data: logs[0].data,
                    topics: logs[0].topics,
                });

                const userName = decodedLog.args.userName;
                console.log("✅ Found username:", userName);

                // Step 2: Call getPortfolioByUsername to get portfolio data
                const portfolioResult = await readContract({
                    contract,
                    method: "function getPortfolioByUsername(string userName) view returns ((address ethAddress, string ipfsDocumentHash, bool isPrivate, bool exists, uint256 createdAt, uint256 lastUpdated))",
                    params: [userName],
                });

                console.log("✅ Portfolio data:", portfolioResult);

                if (!portfolioResult.exists) {
                    setError("Portfolio not found");
                    setIsLoading(false);
                    return;
                }

                if (portfolioResult.isPrivate) {
                    console.log("🔒 Portfolio is private");
                    setIsPrivate(true);
                    setError("This portfolio is private");
                    setIsLoading(false);
                    return;
                }

                // Step 3: Fetch IPFS data
                console.log("📦 Downloading IPFS data:", portfolioResult.ipfsDocumentHash);
                const response = await download({
                    client,
                    uri: portfolioResult.ipfsDocumentHash,
                });

                const data = (await response.json()) as PortfolioData & { avatarUrl?: string };
                console.log("✅ Portfolio loaded successfully");

                // Transform data to profile format
                const splitList = (value: string) =>
                    value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];

                // Use IPFS avatar if exists, otherwise generate from name
                const avatarUrl = data.avatarUrl 
                    ? data.avatarUrl.replace("ipfs://", "https://ipfs.io/ipfs/")
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&size=200&background=1f2937&color=fff&bold=true`;

                setProfile({
                    ...data,
                    avatarUrl,
                    educationList: splitList(data.education),
                    experienceList: splitList(data.experience),
                    projectsList: splitList(data.projects),
                    certificationsList: splitList(data.certifications),
                });
            } catch (err: unknown) {
                console.error("❌ Error fetching portfolio:", err);
                const errorMessage = err instanceof Error ? err.message : "";
                if (errorMessage.includes("Private portfolio")) {
                    setIsPrivate(true);
                    setError("This portfolio is private");
                } else {
                    setError("Failed to load portfolio");
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchPortfolio();
    }, [walletAddress]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
                    <p className="text-gray-600">Loading portfolio...</p>
                </div>
            </div>
        );
    }

    // Private portfolio state
    if (isPrivate) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="h-8 w-8 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Private Portfolio</h1>
                    <p className="text-gray-500">
                        This portfolio is set to private by the owner and cannot be viewed publicly.
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Portfolio Not Found</h1>
                    <p className="text-gray-500">
                        {error || "No portfolio exists for this wallet address."}
                    </p>
                    <p className="text-xs text-gray-400 mt-4 font-mono break-all">
                        {walletAddress}
                    </p>
                </div>
            </div>
        );
    }

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
                                style={{ backgroundColor: profile.bgColor || "#f5f5f5" }}
                            >
                                {/* Content */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
                                                <Globe className="w-3 h-3" />
                                                {profile.website}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 flex gap-4 text-gray-600 text-lg">
                                        {profile.github && (
                                            <a
                                                href={profile.github}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:text-gray-900 transition"
                                                aria-label="GitHub"
                                            >
                                                <Github />
                                            </a>
                                        )}
                                        {profile.linkedin && (
                                            <a
                                                href={profile.linkedin}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:text-gray-900 transition"
                                                aria-label="LinkedIn"
                                            >
                                                <Linkedin />
                                            </a>
                                        )}
                                        {profile.twitter && (
                                            <a
                                                href={profile.twitter}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="hover:text-gray-900 transition"
                                                aria-label="Twitter"
                                            >
                                                <Twitter />
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

                                    {profile.educationList.length > 0 && (
                                        <section className="rounded-xl bg-white/90 p-4 shadow-sm border border-gray-100">
                                            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Education
                                            </h2>
                                            <ul className="space-y-1.5">
                                                {profile.educationList.map((item, i) => (
                                                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}

                                    {profile.experienceList.length > 0 && (
                                        <section className="rounded-xl bg-white/90 p-4 shadow-sm border border-gray-100">
                                            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Experience
                                            </h2>
                                            <ul className="space-y-1.5">
                                                {profile.experienceList.map((item, i) => (
                                                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}

                                    {profile.projectsList.length > 0 && (
                                        <section className="rounded-xl bg-gray-900 text-white p-4 shadow-sm">
                                            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
                                                Projects
                                            </h2>
                                            <ul className="space-y-1.5">
                                                {profile.projectsList.map((item, i) => (
                                                    <li key={i} className="flex gap-2 text-sm text-white">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-500 flex-shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}

                                    {profile.certificationsList.length > 0 && (
                                        <section className="rounded-xl bg-white/90 p-4 shadow-sm border border-gray-100">
                                            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Certifications
                                            </h2>
                                            <ul className="space-y-1.5">
                                                {profile.certificationsList.map((item, i) => (
                                                    <li key={i} className="flex gap-2 text-sm text-gray-700">
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

                        {/* Verified Contract Section - Mobile */}
                        <div className="mt-8 flex justify-center">
                            <a
                                href={getExplorerUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-md"
                            >
                                <Shield className="w-4 h-4 text-green-600" />
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-medium text-green-700">Verified on Polygon</span>
                                    <span className="text-[10px] text-green-600/70 font-mono">
                                        {Web3PortfolioAddress.slice(0, 6)}...{Web3PortfolioAddress.slice(-4)}
                                    </span>
                                </div>
                                <ExternalLink className="w-3 h-3 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                        </div>

                        {/* Powered by section - Mobile */}
                        <div className="mt-6 flex flex-col items-center animate-fade-in-up">
                            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm hover:shadow-md transition-all duration-300">
                                <span className="text-xs font-medium text-gray-500 tracking-wide uppercase">Powered by</span>
                                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                                    <div className="flex items-center gap-1.5 group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                                            alt="Ethereum"
                                            className="h-5 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Ethereum</span>
                                    </div>
                                    <span className="text-gray-300 px-1 font-light">×</span>
                                    <div className="flex items-center gap-1.5 group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
                                                <div className="w-[180px] h-[24px] bg-[#0a0a0a] rounded-b-[12px] flex items-center justify-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-[6px] h-[6px] rounded-full bg-[#1a1a1a] ring-1 ring-[#333]">
                                                            <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-[#2a3a4a] to-[#1a2a3a]"></div>
                                                            <div className="absolute top-[1px] left-[1px] w-[2px] h-[2px] rounded-full bg-[#3a4a5a]/50"></div>
                                                        </div>
                                                    </div>
                                                    <div className="w-[4px] h-[4px] rounded-full bg-[#1a1a1a]"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Screen glass with reflection */}
                                        <div className="relative bg-black rounded-[8px] overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none z-10"></div>

                                            {/* Browser chrome */}
                                            <div className="bg-gradient-to-b from-[#3d3d3d] to-[#2a2a2a] px-4 py-2.5 flex items-center gap-3">
                                                <div className="flex gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-inner"></div>
                                                    <div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-inner"></div>
                                                    <div className="w-3 h-3 rounded-full bg-[#28c840] shadow-inner"></div>
                                                </div>

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

                                                <div className="flex-1 mx-2">
                                                    <div className="bg-[#1a1a1a] rounded-lg px-4 py-2 text-xs text-[#999] flex items-center gap-2 border border-[#333]">
                                                        <svg className="w-3 h-3 text-[#28c840]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                        <span className="text-[#28c840]">https://</span>
                                                        <span className="text-[#ccc]">{profile.website?.replace('https://', '') || `portfolio/${walletAddress.slice(0, 8)}...`}</span>
                                                    </div>
                                                </div>

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
                                                    backgroundColor: profile.bgColor || "#f5f5f5",
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
                                                                        <Globe className="w-4 h-4" />
                                                                        {profile.website}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="mt-4 flex gap-4 text-gray-600 text-xl">
                                                                {profile.github && (
                                                                    <a
                                                                        href={profile.github}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="hover:text-gray-900 transition"
                                                                        aria-label="GitHub"
                                                                    >
                                                                        <Github />
                                                                    </a>
                                                                )}
                                                                {profile.linkedin && (
                                                                    <a
                                                                        href={profile.linkedin}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="hover:text-gray-900 transition"
                                                                        aria-label="LinkedIn"
                                                                    >
                                                                        <Linkedin />
                                                                    </a>
                                                                )}
                                                                {profile.twitter && (
                                                                    <a
                                                                        href={profile.twitter}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="hover:text-gray-900 transition"
                                                                        aria-label="Twitter"
                                                                    >
                                                                        <Twitter />
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

                                                        {profile.educationList.length > 0 && (
                                                            <section className="rounded-2xl bg-white/95 p-5 shadow-sm border border-gray-100 backdrop-blur-sm">
                                                                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                    Education
                                                                </h2>
                                                                <ul className="space-y-2">
                                                                    {profile.educationList.map((item, i) => (
                                                                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                                                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                                                            <span>{item}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </section>
                                                        )}

                                                        {profile.experienceList.length > 0 && (
                                                            <section className="rounded-2xl bg-white/95 p-5 shadow-sm border border-gray-100 backdrop-blur-sm">
                                                                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                    Experience
                                                                </h2>
                                                                <ul className="space-y-2">
                                                                    {profile.experienceList.map((item, i) => (
                                                                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                                                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                                                            <span>{item}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </section>
                                                        )}

                                                        {profile.projectsList.length > 0 && (
                                                            <section className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 shadow-lg">
                                                                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
                                                                    Projects
                                                                </h2>
                                                                <ul className="space-y-2">
                                                                    {profile.projectsList.map((item, i) => (
                                                                        <li key={i} className="flex gap-2 text-sm text-white">
                                                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-500 flex-shrink-0" />
                                                                            <span>{item}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </section>
                                                        )}

                                                        {profile.certificationsList.length > 0 && (
                                                            <section className="rounded-2xl bg-white/95 p-5 shadow-sm border border-gray-100 md:col-span-2 backdrop-blur-sm">
                                                                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                    Certifications
                                                                </h2>
                                                                <ul className="grid md:grid-cols-2 gap-2">
                                                                    {profile.certificationsList.map((item, i) => (
                                                                        <li key={i} className="flex gap-2 text-sm text-gray-700">
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

                            {/* MacBook Base */}
                            <div className="relative z-10">
                                <div
                                    className="relative mx-auto h-[10px] bg-[#1a1a1a] rounded-b-md shadow-inner"
                                    style={{ width: "calc(100% - 4px)" }}
                                >
                                    <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-b from-[#333] to-transparent opacity-50"></div>
                                </div>

                                <div
                                    className="relative mx-auto rounded-b-[16px] overflow-hidden"
                                    style={{
                                        width: "116%",
                                        marginLeft: "-8%",
                                        height: "30px",
                                        background: "linear-gradient(to bottom, #e2e2e4 0%, #c5c5c9 100%)",
                                        boxShadow: "0 -1px 0 rgba(255,255,255,0.4) inset, 0 15px 40px -10px rgba(0,0,0,0.4)"
                                    }}
                                >
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[5px] bg-[#a8a8ad] opacity-40 rounded-b-sm"></div>
                                    <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[28%] h-[16px]">
                                        <div className="w-full h-full bg-[#d1d1d6] rounded-[3px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.15),0_1px_0_rgba(255,255,255,0.6)]"></div>
                                    </div>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[18%] h-[4px] bg-[#9ca3af] rounded-t-lg shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"></div>
                                    <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-white/60 to-transparent"></div>
                                    <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-white/60 to-transparent"></div>
                                </div>

                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[100%] h-[20px] bg-black/20 blur-xl rounded-[50%]"></div>
                            </div>

                            {/* Verified Contract Section - Desktop */}
                            <div className="mt-12 flex justify-center">
                                <a
                                    href={getExplorerUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-lg hover:scale-105"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                                        <Shield className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm font-semibold text-green-700 flex items-center gap-2">
                                            Verified Blockchain Contract
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-200 text-green-800">
                                                Polygon 
                                            </span>
                                        </span>
                                        <span className="text-xs text-green-600/70 font-mono mt-0.5">
                                            {Web3PortfolioAddress}
                                        </span>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </div>

                            {/* Powered by section - Desktop */}
                            <div className="mt-8 flex flex-col items-center animate-fade-in-up">
                                <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm hover:shadow-md transition-all duration-300">
                                    <span className="text-xs font-medium text-gray-500 tracking-wide uppercase">Powered by</span>
                                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                                        <div className="flex items-center gap-1.5 group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                                                alt="Ethereum"
                                                className="h-5 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Ethereum</span>
                                        </div>
                                        <span className="text-gray-300 px-1 font-light">×</span>
                                        <div className="flex items-center gap-1.5 group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
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
