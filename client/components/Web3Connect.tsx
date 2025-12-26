"use client";

import {
    ConnectButton,
    useActiveAccount,
    useDisconnect,
    useActiveWallet,
    useActiveWalletChain,
    useWalletBalance
} from "thirdweb/react";
import { client } from "@/lib/client";
import { wallets } from "@/lib/wallets";
import { supportedChains, defaultChain } from "@/lib/chains";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, Wallet, Check, Copy } from "lucide-react";
import toast from "react-hot-toast";

export default function Web3Connect() {
    const account = useActiveAccount();
    const wallet = useActiveWallet();
    const chain = useActiveWalletChain();
    const { disconnect } = useDisconnect();

    // Fetch user balance for the active chain
    const { data: balance, isLoading: isBalanceLoading } = useWalletBalance({
        client,
        chain,
        address: account?.address,
    });

    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const copyAddress = () => {
        if (account?.address) {
            navigator.clipboard.writeText(account.address);
            setCopied(true);
            toast.success("Address copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (account) {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="bg-gray-900 hover:bg-gray-800 transition-colors px-6 py-3 rounded-full font-semibold text-white flex items-center gap-3 shadow-md"
                >
                    <span>
                        {account.address.slice(0, 6)}...{account.address.slice(-4)}
                    </span>

                    {/* Animated Arrow Icon */}
                    <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? "rotate-180" : "rotate-0"
                            }`}
                    />
                </button>

                {showDropdown && (
                    <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        {/* Header Section */}
                        <div className="px-4 py-3 border-b-2 border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Connected</span>
                                {chain && (
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                        {chain.name}
                                    </span>
                                )}
                            </div>

                            {/* Address Copy Row */}
                            <button
                                onClick={copyAddress}
                                className="flex items-center gap-2 text-sm font-mono text-gray-700 hover:text-gray-900 w-full group"
                            >
                                {account.address.slice(0, 12)}...
                                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />}
                            </button>
                        </div>

                        {/* Balance Section */}
                        <div className="px-4 py-3 border-b-2 border-gray-100">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <Wallet className="w-4 h-4" />
                                <span className="text-sm font-medium">Balance</span>
                            </div>
                            <div className="text-lg font-bold text-gray-900 pl-6">
                                {isBalanceLoading ? (
                                    <span className="text-sm text-gray-400 animate-pulse">Loading...</span>
                                ) : (
                                    <>
                                        {Number(balance?.displayValue).toFixed(4)}
                                        <span className="text-sm font-medium text-gray-500 ml-1">{balance?.symbol}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Actions Section */}
                        <div className="p-1">
                            <button
                                onClick={() => {
                                    if (wallet) {
                                        disconnect(wallet);
                                        setShowDropdown(false);
                                    }
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Disconnect Wallet
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    } else {
        return (
            <ConnectButton
                client={client}
                wallets={wallets}
                chains={supportedChains}
                chain={defaultChain}
                autoConnect={true}
                theme="light"
                accountAbstraction={{
                    chain: defaultChain,
                    sponsorGas: true,
                }}
                connectModal={{
                    size: "wide",
                    title: "Decentralized Portfolio",
                    // titleIcon: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
                    showThirdwebBranding: false,
                }}
                connectButton={{
                    label: "Connect Wallet",
                    className: "!bg-gray-900 !md:px-6 !md:py-2 !rounded-full !font-semibold !text-white hover:!bg-gray-800 transition-all"
                }}
            />
        );
    }
}
