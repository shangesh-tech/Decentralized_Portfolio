"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { Github, Linkedin, Twitter, Globe, Loader2 } from "lucide-react";
import {
  useActiveAccount,
  useSendTransaction,
} from "thirdweb/react";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { upload } from "thirdweb/storage";
import { client } from "@/lib/client";
import { defaultChain } from "@/lib/chains";
import { Web3PortfolioAddress } from "@/lib/constant";
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
  isPrivate: boolean;
  avatarUrl: string;
};

type Portfolio = {
  ethAddress: string;
  ipfsDocumentHash: string;
  isPrivate: boolean;
  exists: boolean;
  createdAt: bigint;
  lastUpdated: bigint;
};

const contract = getContract({
  client,
  chain: defaultChain,
  address: Web3PortfolioAddress,
});

export default function CreatePortfolioPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const [form, setForm] = useState<FormState>({
    name: "Your Name",
    role: "Your Role / Title",
    location: "City, Country",
    email: "you@example.com",
    website: "https://yoursite.xyz",
    github: "https://github.com/yourusername",
    linkedin: "https://linkedin.com/in/yourusername",
    twitter: "https://twitter.com/yourusername",
    education: "Degree - Institute (Year)",
    experience: "Role - Company (Year)",
    projects: "Project 1, Project 2",
    certifications: "Certification 1, Certification 2",
    about: "Write a short bio about yourself...",
    bgColor: "#f5f5f5",
    isPrivate: false,
    avatarUrl: "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isReadingPortfolio, setIsReading] = useState(true);

  useEffect(() => {
    if (!account?.address) {
      setIsReading(false);
      return;
    }

    const checkPortfolio = async () => {
      try {
        setIsReading(true);
        
        const data = await readContract({
          contract,
          method:
            "function getMyPortfolio() view returns ((address ethAddress, string ipfsDocumentHash, bool isPrivate, bool exists, uint256 createdAt, uint256 lastUpdated))",
          params: [],
          from: account.address as `0x${string}`, 
        });

        console.log("Portfolio found:", data);
        setPortfolio(data as Portfolio);
      } catch (err:any) {
        console.log("No portfolio exists (this is normal):", err.message);
        setPortfolio(null);
      } finally {
        setIsReading(false);
      }
    };

    checkPortfolio();
  }, [account?.address]);

  console.log("portfolio exists:", portfolio?.exists);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (file) {
      setAvatarFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!account) {
      toast.error("Please connect your wallet");
      return;
    }

    const toastId = toast.loading("Uploading to IPFS...");

    try {
      const portfolioData = { ...form };

      if (avatarFile) {
        toast.loading("Uploading avatar...", { id: toastId });
        const avatarUri = await upload({
          client,
          files: [avatarFile],
        });
        portfolioData.avatarUrl = avatarUri;
      }

      toast.loading("Uploading portfolio JSON...", { id: toastId });

      const uri = await upload({
        client,
        files: [
          new File(
            [JSON.stringify(portfolioData)],
            `portfolio-${Date.now()}.json`,
            { type: "application/json" }
          ),
        ],
      });

      const transaction = prepareContractCall({
        contract,
        method:
          "function createPortfolio(string _userName, string _ipfsHash, bool _isPrivate)",
        params: [form.name, uri, form.isPrivate],
      });

      toast.loading("Confirm transaction...", { id: toastId });

      sendTransaction(transaction, {
        onSuccess: (tx) => {
          toast.dismiss(toastId);

          const explorerUrl =
            tx.chain.blockExplorers?.[0]?.url + "/tx/" + tx.transactionHash;

          toast.success("Portfolio created successfully!");
          toast.success(
            explorerUrl
              ? `View transaction: ${explorerUrl}`
              : "Transaction submitted"
          );

          router.push("/");
        },
        onError: (err) => {
          toast.dismiss(toastId);
          toast.error("Transaction failed");
          console.error(err);
        },
      });
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Something went wrong");
      console.error(err);
    }
  }

  const splitList = (value: string) => {
    const list = value.split(",").map((item) => item.trim());
    return list;
  };

  if (isReadingPortfolio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-500">
            Please connect your wallet to create your portfolio
          </p>
        </div>
      </div>
    );
  }

  if (portfolio?.exists === true) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Portfolio Already Exists
          </h1>
          <p className="text-gray-500 mb-6">
            You already have a portfolio. Would you like to update it instead?
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push("/update")}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black transition"
            >
              Update Portfolio
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* LEFT: fixed phone mockup */}
            <div className="lg:w-100 lg:shrink-0">
              <div className="lg:sticky lg:top-6 flex justify-center">
                <div className="relative w-[320px] sm:w-90 h-160 border-14 border-gray-900 rounded-[40px] shadow-2xl bg-white overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-30 h-7 bg-gray-900 rounded-b-[20px] z-10" />

                  {/* Content with user-selected bg color */}
                  <div
                    className="h-full overflow-y-auto px-5 pb-6 pt-12 [&::-webkit-scrollbar]:hidden"
                    style={{
                      backgroundColor: form.bgColor,
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
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
                            <Globe className="text-[10px]" />
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
                            <Github />
                          </a>
                        )}
                        {form.linkedin && (
                          <a
                            href={form.linkedin}
                            className="hover:text-gray-900"
                            aria-label="LinkedIn"
                          >
                            <Linkedin />
                          </a>
                        )}
                        {form.twitter && (
                          <a
                            href={form.twitter}
                            className="hover:text-gray-900"
                            aria-label="Twitter"
                          >
                            <Twitter />
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
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Create Portfolio
                </h1>
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  New
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Fill in your details and see your phone portfolio update in real
                time.
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
                      Full name *{" "}
                      <span className="text-xs text-gray-400">
                        (used as your username)
                      </span>
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

                {/* Privacy Toggle */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    name="isPrivate"
                    checked={form.isPrivate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isPrivate: e.target.checked,
                      }))
                    }
                    className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                  />
                  <div>
                    <label
                      htmlFor="isPrivate"
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Make portfolio private
                    </label>
                    <p className="text-xs text-gray-500">
                      Only you can view your portfolio. Others will see
                      &quot;Private portfolio&quot; message.
                    </p>
                  </div>
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
}
