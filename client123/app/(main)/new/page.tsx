"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { FaGithub, FaLinkedin, FaTwitter, FaGlobe } from "react-icons/fa";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { upload } from "thirdweb/storage";
import { client } from "@/lib/client";
import { defaultChain } from "@/lib/chains";
import { Web3PortfolioAddress, TrustedForwarderAddress } from "@/lib/constant";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";


type FormState = {
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

const contract = getContract({
  client,
  chain: defaultChain,
  address: Web3PortfolioAddress,
});

export default function PortfolioOnboardPage() {

  const router = useRouter();
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const [form, setForm] = useState<FormState>({
    name: "Jai Menon",
    role: "Blockchain & Web3 Engineer",
    location: "Bangalore, India",
    email: "jai.menon@example.com",
    website: "https://jaimenon.xyz",
    github: "https://github.com/jaimenon",
    linkedin: "https://linkedin.com/in/jaimenon",
    twitter: "https://twitter.com/jaimenon",
    education:
      "B.Tech Computer Science - NACC+ Institute, Bangalore (2023–2027), Higher Secondary - Chennai Public School (2023)",
    experience:
      "Web3 Intern - DeFi Labs (2024, Remote), Freelance Smart Contract Developer (2023–Present)",
    projects:
      "GhostSwap - MEV Protected DEX, Amal Wallet - Multi-chain Quantum-safe Wallet, EduChain - On-chain Certificates LMS",
    certifications:
      "Ethereum Developer Bootcamp, Certified Solidity Developer, Zero-Knowledge Proofs Fundamentals",
    about:
      "Web3 engineer focused on DeFi, account abstraction, and security. Loves building infra for the Indian blockchain ecosystem and shipping battle-tested smart contracts.",
    bgColor: "#f5f5f5",
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === "string") {
          setAvatarPreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!account) {
      toast.error("Please connect your wallet first!");
      return;
    }

    // 1. Capture the toast ID so we can dismiss it later
    const toastId = toast.loading("Uploading to IPFS...");

    try {
      // 1. Upload Form Data to IPFS
      const uri = await upload({
        client,
        files: [
          new File([JSON.stringify(form)], `portfolio-${form.name}-${Date.now()}.json`, {
            type: "application/json",
          }),
        ],
      });

      console.log("IPFS URI:", uri);

      // Update the loading message (Optional, keeps the same toast)
      toast.loading("Waiting for transaction signature...", { id: toastId });

      // 2. Prepare the Contract Call
      const transaction = prepareContractCall({
        contract,
        method: "function createPortfolio(string _userName, string _ipfsHash, bool _isPrivate)",
        params: [form.name, uri, false],
      });

      // 3. Send Transaction
      sendTransaction(transaction, {
        onSuccess: (tx) => {
          // DISMISS loading toast AND show success
          toast.dismiss(toastId);
          toast.success("Portfolio created successfully!");

          console.log("tx", tx);
          console.log("Transaction hash:", tx.transactionHash);
        },
        onError: (err) => {
          // DISMISS loading toast AND show error
          toast.dismiss(toastId);
          console.error("Transaction failed:", err);
          toast.error("Transaction failed. Check console.");
        },
      });

    } catch (error) {
      // DISMISS loading toast on catch block too
      toast.dismiss(toastId);
      console.error("Error creating portfolio:", error);
      toast.error("Something went wrong during upload.");
    }
  }


  const splitList = (value: string) => {
    const list = value.split(",").map((item) => item.trim());
    return list;
  };

  useEffect(() => {
    if (!account) {
      toast.error("Wallet not connected!");
      router.push("/");
    }
  }, [account]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* LEFT: fixed phone mockup */}
          <div className="lg:w-[400px] lg:shrink-0">
            <div className="lg:sticky lg:top-6 flex justify-center">
              <div className="relative w-[320px] sm:w-[360px] h-[640px] border-14 border-gray-900 rounded-[40px] shadow-2xl bg-white overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-gray-900 rounded-b-[20px] z-10" />

                {/* Content with user-selected bg color */}
                <div
                  className="h-full overflow-y-auto px-5 pb-6 pt-12 [&::-webkit-scrollbar]:hidden"
                  style={{
                    backgroundColor: form.bgColor,
                    scrollbarWidth: "none",
                    msOverflowStyle: "none"
                  }}
                >

                  {/* Top section */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-gray-800 to-gray-600 flex items-center justify-center text-3xl text-white shadow-lg overflow-hidden">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        form.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                      )}
                    </div>

                    <h1 className="mt-3 text-xl font-semibold text-gray-900">
                      {form.name}
                    </h1>
                    <p className="text-sm text-gray-600">{form.role}</p>
                    {form.location && (
                      <p className="mt-1 text-xs text-gray-500">
                        📍 {form.location}
                      </p>
                    )}

                    {/* Contact pills */}
                    <div className="mt-3 flex flex-wrap justify-center gap-2 text-[11px]">
                      {form.email && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-white">
                          <span className="text-[10px]">✉️</span>
                          {form.email}
                        </span>
                      )}
                      {form.website && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-gray-800 shadow-sm">
                          <FaGlobe className="text-[10px]" />
                          {form.website}
                        </span>
                      )}
                    </div>

                    {/* Social icons */}
                    <div className="mt-4 flex gap-4 text-gray-600 text-lg">
                      {form.github && (
                        <a
                          href={form.github}
                          className="hover:text-gray-900"
                          aria-label="GitHub"
                        >
                          <FaGithub />
                        </a>
                      )}
                      {form.linkedin && (
                        <a
                          href={form.linkedin}
                          className="hover:text-gray-900"
                          aria-label="LinkedIn"
                        >
                          <FaLinkedin />
                        </a>
                      )}
                      {form.twitter && (
                        <a
                          href={form.twitter}
                          className="hover:text-gray-900"
                          aria-label="Twitter"
                        >
                          <FaTwitter />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="mt-5 space-y-4 text-xs">
                    {form.about && (
                      <section className="rounded-xl bg-white/90 p-3 shadow-sm border border-gray-100">
                        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          About
                        </h2>
                        <p className="text-[11px] leading-snug text-gray-700">
                          {form.about}
                        </p>
                      </section>
                    )}

                    {form.education && (
                      <section className="rounded-xl bg-white/90 p-3 shadow-sm border border-gray-100">
                        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Education
                        </h2>
                        <ul className="space-y-1">
                          {splitList(form.education).map((item, i) => (
                            <li
                              key={i}
                              className="flex gap-1.5 text-[11px] text-gray-700"
                            >
                              <span className="mt-0.5 text-gray-400">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {form.experience && (
                      <section className="rounded-xl bg-white/90 p-3 shadow-sm border border-gray-100">
                        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Experience
                        </h2>
                        <ul className="space-y-1">
                          {splitList(form.experience).map((item, i) => (
                            <li
                              key={i}
                              className="flex gap-1.5 text-[11px] text-gray-700"
                            >
                              <span className="mt-0.5 text-gray-400">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {form.projects && (
                      <section className="rounded-xl bg-gray-900 text-white p-3 shadow-sm">
                        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-300">
                          Projects
                        </h2>
                        <ul className="space-y-1">
                          {splitList(form.projects).map((item, i) => (
                            <li
                              key={i}
                              className="flex gap-1.5 text-[11px] text-white"
                            >
                              <span className="mt-0.5 text-gray-500">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {form.certifications && (
                      <section className="rounded-xl bg-white/90 p-3 shadow-sm border border-gray-100">
                        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Certifications
                        </h2>
                        <ul className="space-y-1">
                          {splitList(form.certifications).map((item, i) => (
                            <li
                              key={i}
                              className="flex gap-1.5 text-[11px] text-gray-700"
                            >
                              <span className="mt-0.5 text-gray-400">•</span>
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

          {/* RIGHT: scrollable form */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Personal portfolio
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Edit the sample data on the right and see your phone portfolio
              update in real time.
            </p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              {/* Profile image + BG color */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-black"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Square images work best.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone background color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="bgColor"
                      value={form.bgColor}
                      onChange={handleChange}
                      className="h-10 w-16 cursor-pointer rounded border border-gray-300 bg-transparent"
                    />
                    <input
                      type="text"
                      name="bgColor"
                      value={form.bgColor}
                      onChange={handleChange}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="#f5f5f5"
                    />
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role / Title *
                  </label>
                  <input
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    placeholder="What you do (e.g. Web3 Engineer)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="City, Country"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website / Portfolio
                  </label>
                  <input
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="https://yourdomain.xyz"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GitHub
                  </label>
                  <input
                    name="github"
                    value={form.github}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
                  <input
                    name="linkedin"
                    value={form.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter
                  </label>
                  <input
                    name="twitter"
                    value={form.twitter}
                    onChange={handleChange}
                    placeholder="https://twitter.com/username"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Portfolio sections */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education (comma separated)
                </label>
                <input
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  placeholder="Degree - Institute (Year), Another degree..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (comma separated)
                </label>
                <input
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="Role - Company (Year), Another role..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Projects (comma separated)
                </label>
                <input
                  name="projects"
                  value={form.projects}
                  onChange={handleChange}
                  placeholder="Project name, Another project..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certifications (comma separated)
                </label>
                <input
                  name="certifications"
                  value={form.certifications}
                  onChange={handleChange}
                  placeholder="Certification name, Another certification..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  About you
                </label>
                <textarea
                  name="about"
                  value={form.about}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Short bio about who you are and what you like to build."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Minting Portfolio...
                  </>
                ) : (
                  "Mint Portfolio On-Chain"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
