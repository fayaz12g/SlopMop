"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1410] via-[#231a13] to-[#0f0c09] text-[#f3e7d0] font-sans">
      
      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-[#3a2b1d]">
        <div className="flex items-center gap-4">
          <Image
            src="/icon.png"
            alt="SlopMop Icon"
            width={42}
            height={42}
          />
          <h5 className="text-2xl font-bold tracking-wide text-[#c9a96e]">
            SlopMop
          </h5>
        </div>

        <div className="flex gap-6 text-sm text-[#c9a96e]">
          <button onClick={() => router.push("/test")} className="hover:text-white transition">
            Test Page
          </button>
          <button onClick={() => router.push("/setup")} className="hover:text-white transition">
            Setup
          </button>
          <a
            href="https://github.com/fayaz12g/SlopMop"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition"
          >
            GitHub
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-8 py-32">
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#c9a96e] drop-shadow-lg">
          Clean the Web.
        </h1>

        <h2 className="mt-4 text-2xl md:text-3xl font-light text-[#e6d3a3]">
          Sweep away AI slop, malicious links, and misinformation.
        </h2>

        <p className="mt-8 max-w-2xl text-lg text-[#d8c7a2] leading-relaxed">
          SlopMop is a Chrome extension that scans web pages in real-time
          to detect AI-generated content, misinformation, malicious links,
          and suspicious trackers — highlighting threats with bold visual cues
          so you can browse with clarity and confidence.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 mt-12">
          <a
            href="/slopmop.crx"
            download
            className="inline-flex px-8 py-4 rounded-full bg-[#c9a96e] text-black font-semibold hover:bg-[#e6c889] transition shadow-lg"
          >
            Download Now
          </a>

          <a
            href="https://github.com/fayaz12g/SlopMop"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-full border border-[#c9a96e] text-[#c9a96e] hover:bg-[#c9a96e] hover:text-black transition"
          >
            View on GitHub
          </a>

          <button
            onClick={() => router.push("/test")}
            className="px-8 py-4 rounded-full border border-[#5c4431] text-[#d8c7a2] hover:border-[#c9a96e] hover:text-[#c9a96e] transition"
          >
            Try the Demo Page
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-8 pb-32 max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
        <Feature
          color="text-red-400"
          title="🚨 Malicious Detection"
          description="Red highlight boxes identify dangerous links, scam patterns, and harmful content."
        />
        <Feature
          color="text-purple-400"
          title="🧠 AI Detection"
          description="Purple highlights indicate AI-generated content."
        />
        <Feature
          color="text-yellow-400"
          title="⚠️ Misinformation Alerts"
          description="Yellow highlights flag potentially false or misleading statements."
        />
        <Feature
          color="text-blue-400"
          title="🔍 Tracker Awareness"
          description="Blue highlights reveal suspicious tracking scripts or data collection behavior."
        />
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#3a2b1d] py-8 text-center text-sm text-[#8a735c]">
        © {new Date().getFullYear()} SlopMop — Built to fight digital grime.
      </footer>
    </div>
  );
}

function Feature({ title, description, color }) {
  return (
    <div className="bg-[#1e1712] p-8 rounded-2xl border border-[#3a2b1d] hover:border-[#c9a96e] transition shadow-lg">
      <h3 className={`text-xl font-semibold mb-4 ${color}`}>
        {title}
      </h3>
      <p className="text-[#d8c7a2] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
