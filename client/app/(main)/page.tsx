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
  Lock,
  Unlock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall, eth_call, getRpcClient, encode } from "thirdweb";
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
  isPrivate: boolean;
  avatarUrl?: string;
};

export default function Home() {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isDeleting } = useSendTransaction();
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
        // Prepare the contract call
        const transaction = prepareContractCall({
          contract,
          method: "function getMyPortfolio() view returns ((address ethAddress, string ipfsDocumentHash, bool isPrivate, bool exists, uint256 createdAt, uint256 lastUpdated))",
          params: [],
        });

        // Get the RPC client
        const rpcClient = getRpcClient({ client, chain: defaultChain });

        // Make eth_call with the user's address as 'from' so msg.sender works
        const encodedData = await encode(transaction);
        const resultHex = await eth_call(rpcClient, {
          to: Web3PortfolioAddress,
          data: encodedData,
          from: account.address as `0x${string}`, // This makes msg.sender = user's address
        });

        // Decode the result manually
        // The result is ABI-encoded tuple: (address, string, bool, bool, uint256, uint256)
        const { decodeAbiParameters } = await import("viem");
        const decoded = decodeAbiParameters(
          [
            {
              type: "tuple",
              components: [
                { name: "ethAddress", type: "address" },
                { name: "ipfsDocumentHash", type: "string" },
                { name: "isPrivate", type: "bool" },
                { name: "exists", type: "bool" },
                { name: "createdAt", type: "uint256" },
                { name: "lastUpdated", type: "uint256" },
              ],
            },
          ],
          resultHex as `0x${string}`
        );

        const result = decoded[0] as Portfolio;
        console.log("Portfolio from chain:", result);

        if (result.exists) {
          setPortfolioFromChain(result);
        } else {
          setPortfolioFromChain(null);
        }
      } catch (error: any) {
        console.error("Error reading contract:", error);
        // If error contains "Portfolio not found", user has no portfolio
        if (error.message?.includes("Portfolio not found") || error.message?.includes("execution reverted")) {
          setPortfolioFromChain(null);
        } else {
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
    if (!account) {
      toast.error("Please connect your wallet first!");
      return;
    }

    // Confirm before deleting
    if (!window.confirm("Are you sure you want to delete your portfolio? This action cannot be undone.")) {
      return;
    }

    const toastId = toast.loading("Deleting portfolio...");

    try {
      const transaction = prepareContractCall({
        contract,
        method: "function deleteMyPortfolio()",
        params: [],
      });

      sendTransaction(transaction, {
        onSuccess: (tx) => {
          toast.dismiss(toastId);
          toast.success("Portfolio deleted successfully!");
          console.log("Delete tx:", tx.transactionHash);
          // Clear local state
          setPortfolioFromChain(null);
          setPortfolioData(null);
        },
        onError: (err) => {
          toast.dismiss(toastId);
          console.error("Delete failed:", err);
          toast.error("Failed to delete portfolio. Check console.");
        },
      });
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Error deleting portfolio:", error);
      toast.error("Something went wrong.");
    }
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
          <div 
            className="h-32 sm:h-40"
            style={{ 
              background: portfolioData.bgColor 
                ? `linear-gradient(135deg, ${portfolioData.bgColor} 0%, #374151 100%)`
                : 'linear-gradient(to right, #111827, #374151)'
            }}
          />

          <div className="relative px-6 pb-8 sm:px-10">
            {/* Avatar - overlapping the cover */}
            <div className="absolute -top-12 sm:-top-16">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gray-900 text-2xl font-bold text-white shadow-md sm:h-32 sm:w-32 sm:text-4xl overflow-hidden">
                {portfolioData.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={portfolioData.avatarUrl.replace("ipfs://", "https://ipfs.io/ipfs/")}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  portfolioData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                )}
              </div>
            </div>

            {/* Privacy Badge */}
            <div className="absolute -top-4 left-6 sm:left-10">
              {portfolioFromChain.isPrivate ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                  <Lock className="h-3 w-3" /> Private
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 border border-green-200">
                  <Unlock className="h-3 w-3" /> Public
                </span>
              )}
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
                href="/update"
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <Edit2 className="h-4 w-4 text-gray-500" /> Update
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeleting ? "Deleting..." : "Delete"}
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
