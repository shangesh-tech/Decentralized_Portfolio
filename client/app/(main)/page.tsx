"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Edit2,
  Trash2,
  Globe,
  Mail,
  MapPin,
  Calendar,
  ExternalLink,
  Plus,
  Copy,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useActiveAccount } from "thirdweb/react";
import { getContract, readContract } from "thirdweb";
import { client } from "@/lib/client";
import { defaultChain } from "@/lib/chains";
import { Web3PortfolioAddress } from "@/lib/constant";
import { download } from "thirdweb/storage";

// Initialize contract
const contract = getContract({
  client,
  chain: defaultChain,
  address: Web3PortfolioAddress,
});

type Portfolio = {
  ethAddress: string;
  ipfsDocumentHash: string;
  isPrivate: boolean;
  exists: boolean;
  createdAt: bigint;
  lastUpdated: bigint;
};

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
};

export default function Home() {
  const account = useActiveAccount();
  const [portfolioFromChain, setPortfolioFromChain] = useState<Portfolio | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isLoadingChain, setIsLoadingChain] = useState(false);
  const [isLoadingIPFS, setIsLoadingIPFS] = useState(false);

  // Fetch portfolio from blockchain when account changes
  useEffect(() => {
    async function fetchPortfolio() {
      if (!account) {
        setPortfolioFromChain(null);
        setPortfolioData(null);
        return;
      }

      setIsLoadingChain(true);
      try {
        // Call getMyPortfolio() - Fixed method signature format
        const result = await readContract({
          contract,
          method: "function getMyPortfolio() view returns ((address ethAddress, string ipfsDocumentHash, bool isPrivate, bool exists, uint256 createdAt, uint256 lastUpdated))",
          params: [],
        });

        console.log(result);

        setPortfolioFromChain(result as Portfolio);
      } catch (error: any) {
        // If error contains "Portfolio not found", user has no portfolio
        if (error.message?.includes("Portfolio not found") || error.message?.includes("execution reverted")) {
          setPortfolioFromChain(null);
        } else {
          console.error("Error reading contract:", error);
          toast.error("Failed to load portfolio from blockchain");
        }
      } finally {
        setIsLoadingChain(false);
      }
    }

    fetchPortfolio();
  }, [account]);


  // Fetch IPFS data when portfolio exists
  useEffect(() => {
    async function fetchIPFSData() {
      if (!portfolioFromChain || !portfolioFromChain.exists) {
        setPortfolioData(null);
        return;
      }

      setIsLoadingIPFS(true);
      try {
        // Download from IPFS
        const response = await download({
          client,
          uri: portfolioFromChain.ipfsDocumentHash,
        });

        const json = await response.json();
        setPortfolioData(json as PortfolioData);
      } catch (err) {
        console.error("Failed to fetch IPFS data:", err);
        toast.error("Failed to load portfolio data from IPFS");
      } finally {
        setIsLoadingIPFS(false);
      }
    }

    fetchIPFSData();
  }, [portfolioFromChain]);

  // Handle delete
  const handleDelete = () => {
    toast.error("Delete functionality coming soon! You'll need to implement a delete function in your contract.");
  };

  // Copy URL function
  const handleCopyUrl = () => {
    if (!account?.address) return;
    const url = `${window.location.origin}/portfolio/${account.address}`;
    navigator.clipboard.writeText(url);
    toast.success("Public URL copied to clipboard!");
  };

  // Format timestamp
  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Loading state
  if (!account) {
    return (
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
          <p className="text-gray-500">Please connect your wallet to view your portfolio</p>
        </div>
      </main>
    );
  }

  if (isLoadingChain || isLoadingIPFS) {
    return (
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading your portfolio...</p>
        </div>
      </main>
    );
  }

  // No portfolio found
  if (!portfolioFromChain?.exists || !portfolioData) {
    return (
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-gray-50 px-4 py-10 md:px-8">
        <div className="flex w-full max-w-lg flex-col items-center justify-center text-center">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            No portfolio yet
          </h1>
          <p className="mb-8 max-w-sm text-gray-500">
            You haven&apos;t created your on-chain portfolio yet. Build your Web3 profile in minutes
            and share it with the world.
          </p>

          <Link
            href="/new"
            className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gray-900 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-black hover:shadow-lg sm:w-auto gap-2"
          >
            <Plus className="h-5 w-5" /> Create my portfolio
          </Link>
        </div>
      </main>
    );
  }

  // Portfolio exists - show it
  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-gray-50 px-4 py-10 md:px-8">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Your Portfolio</h2>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-200/50">
          {/* Header / Cover area */}
          <div className="h-32 bg-gradient-to-r from-gray-900 to-gray-700 sm:h-40" />

          <div className="relative px-6 pb-8 sm:px-10">
            {/* Avatar - overlapping the cover */}
            <div className="absolute -top-12 sm:-top-16">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gray-900 text-2xl font-bold text-white shadow-md sm:h-32 sm:w-32 sm:text-4xl">
                {portfolioData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            </div>

            {/* Action Buttons (Top Right) */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={handleCopyUrl}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition"
                title="Copy Link"
              >
                <Copy className="h-4 w-4" />
              </button>
              <Link
                href="/new"
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <Edit2 className="h-4 w-4 text-gray-500" /> Update
              </Link>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>

            {/* Main Content */}
            <div className="mt-4 sm:mt-6">
              <h1 className="text-3xl font-bold text-gray-900">{portfolioData.name}</h1>
              <p className="text-lg font-medium text-gray-600">{portfolioData.role}</p>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {portfolioData.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {portfolioData.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Created {formatDate(portfolioFromChain.createdAt)}
                </span>
              </div>

              <div className="my-6 border-t border-gray-100" />

              {/* Quick Links */}
              <div className="mt-6 flex flex-wrap gap-3">
                {portfolioData.website && (
                  <a
                    href={portfolioData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                  >
                    <Globe className="h-4 w-4" /> Website
                  </a>
                )}
                {portfolioData.email && (
                  <a
                    href={`mailto:${portfolioData.email}`}
                    className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                  >
                    <Mail className="h-4 w-4" /> Email
                  </a>
                )}
                <Link
                  href={`/portfolio/${account.address}`}
                  className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-black transition"
                >
                  View Public Page <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
