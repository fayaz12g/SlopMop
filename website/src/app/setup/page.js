"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1410] via-[#231a13] to-[#0f0c09] text-[#f3e7d0] font-sans">
      
      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-[#3a2b1d]">
        <div className="flex items-center gap-4">
          <Image src="/icon.png" alt="SlopMop Icon" width={42} height={42} />
          <h5 className="text-2xl font-bold tracking-wide text-[#c9a96e]">
            SlopMop
          </h5>
        </div>

        <div className="flex gap-6 text-sm text-[#c9a96e]">
          <button
            onClick={() => router.push("/")}
            className="hover:text-white transition"
          >
            Home
          </button>

          <button onClick={() => router.push("/test")} className="hover:text-white transition">
            Test
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

      {/* HEADER */}
      <section className="text-center px-8 py-20">
        <h1 className="text-5xl font-extrabold text-[#c9a96e] drop-shadow-lg">
          ⚙️ Setup Guide
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-[#d8c7a2]">
          Get SlopMop up and running in minutes. Follow these steps to install
          the browser extension and configure your API keys.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-8 pb-24 space-y-16">

        <InfoBox />

        <Section title="📦 Prerequisites">
          <p>Before you begin, make sure you have:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Google Chrome browser (or Chromium-based browser)</li>
            <li>Node.js installed (for running the video analysis server)</li>
            <li>A Gemini API key (get yours at <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-[#c9a96e] underline hover:text-white">ai.google.dev</a>)</li>
          </ul>
        </Section>

        <Section title="🚀 Quick Start: Browser Extension">
          <div className="space-y-4">
            <p className="font-semibold text-[#e6c889]">Step 1: Install Dependencies</p>
            <CodeBlock>
              cd extension{"\n"}
              npm install{"\n"}
              node twelvelabs.js
            </CodeBlock>

            <p className="font-semibold text-[#e6c889] mt-6">Step 2: Load Extension in Chrome</p>
            <ol className="list-decimal pl-6 space-y-2 mt-4">
              <li>Open Chrome and navigate to <code className="bg-[#0f0c09] px-2 py-1 rounded text-[#c9a96e]">chrome://extensions/</code></li>
              <li>Toggle <strong>Developer mode</strong> ON (top-right corner)</li>
              <li>Click <strong>Load unpacked</strong></li>
              <li>Select the <code className="bg-[#0f0c09] px-2 py-1 rounded text-[#c9a96e]">extension</code> folder from your SlopMop directory</li>
              <li>The SlopMop icon should now appear in your browser toolbar!</li>
            </ol>

            <div className="mt-6 p-4 bg-[#0f0c09] border border-[#3a2b1d] rounded-lg">
              <p className="text-sm text-[#8a735c]">
                💡 <strong>Tip:</strong> Pin the SlopMop extension to your toolbar for easy access by clicking the puzzle icon and pinning it.
              </p>
            </div>
          </div>
        </Section>

        <Section title="🔑 API Key Configuration">
          <div className="space-y-4">
            <p>SlopMop requires a Gemini API key to analyze web content.</p>
            
            <p className="font-semibold text-[#e6c889] mt-6">Getting Your API Key:</p>
            <ol className="list-decimal pl-6 space-y-2 mt-4">
              <li>Visit <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-[#c9a96e] underline hover:text-white">ai.google.dev</a></li>
              <li>Sign in with your Google account</li>
              <li>Navigate to <strong>Get API Key</strong></li>
              <li>Create a new API key or copy an existing one</li>
            </ol>

            <p className="font-semibold text-[#e6c889] mt-6">Configuring the Extension:</p>
            <ol className="list-decimal pl-6 space-y-2 mt-4">
              <li>Click the SlopMop icon in your browser toolbar</li>
              <li>Click the <strong>Settings</strong> icon (⚙️) in the popup</li>
              <li>Paste your Gemini API key in the input field</li>
              <li>Click <strong>Save</strong></li>
            </ol>

            <div className="mt-6 flex justify-center">
              <div className="p-4 bg-[#0f0c09] border border-[#3a2b1d] rounded-lg inline-block">
                <p className="text-sm text-[#8a735c] mb-2 text-center">Example API Key Setup Screen:</p>
                <div className="w-80 h-96 bg-[#1a1410] border border-[#3a2b1d] rounded-lg flex items-center justify-center">
                  <p className="text-[#8a735c] text-xs">[API Key Configuration UI]</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="🎬 Video Analysis Server (Optional)">
          <div className="space-y-4">
            <p>
              For advanced video analysis features using Twelve Labs, you'll need to run the backend server.
            </p>

            <p className="font-semibold text-[#e6c889] mt-6">Setup Instructions:</p>
            <CodeBlock>
              cd extension{"\n"}
              node twelvelabs.js
            </CodeBlock>

            <p className="mt-4">
              The server will start on port 3001 and provide video analysis capabilities for detecting
              synthetic or AI-generated artifacts in videos.
            </p>

            <div className="mt-6 p-4 bg-[#0f0c09] border border-[#3a2b1d] rounded-lg">
              <p className="text-sm text-[#8a735c]">
                ℹ️ <strong>Note:</strong> Video analysis requires additional Twelve Labs API credentials. 
                The extension will work without this feature if the server isn't running.
              </p>
            </div>
          </div>
        </Section>

        <Section title="🌐 Website Development (Optional)">
          <div className="space-y-4">
            <p>
              Want to run the SlopMop website locally? Follow these steps:
            </p>

            <CodeBlock>
              cd website{"\n"}
              npm install{"\n"}
              npm run dev
            </CodeBlock>

            <p className="mt-4">
              Open <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="text-[#c9a96e] underline hover:text-white">http://localhost:3000</a> in your browser to view the site.
            </p>

            <p className="text-sm text-[#8a735c] mt-4">
              Built with Next.js 16, React 19, and Tailwind CSS 4.
            </p>
          </div>
        </Section>

        <Section title="✨ Features Overview">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg text-[#e6c889] mb-2">Content Detection</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><span className="text-purple-400">🟣 Purple</span> - AI-generated content</li>
                <li><span className="text-yellow-400">🟡 Yellow</span> - Misinformation</li>
                <li><span className="text-red-400">🔴 Red</span> - Malicious content</li>
                <li><span className="text-blue-400">🔵 Blue</span> - Trackers and analytics</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg text-[#e6c889] mb-2">Interactive Features</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Hover over highlighted elements to see confidence scores and explanations</li>
                <li>Toggle categories on/off in the extension popup</li>
                <li>Video analysis for detecting synthetic artifacts</li>
                <li>Real-time page scanning and highlighting</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section title="📁 Project Structure">
          <CodeBlock lang="tree">
            SlopMop/{"\n"}
            ├── extension/          # Browser extension + video analysis server{"\n"}
            │   ├── manifest.json   # Extension configuration{"\n"}
            │   ├── popup.html/js   # Popup UI and controls{"\n"}
            │   ├── content.js      # Page scanning & highlighting{"\n"}
            │   ├── gemini.js       # Gemini AI integration{"\n"}
            │   └── twelvelabs.js   # Video analysis API{"\n"}
            ├── website/            # Next.js marketing site{"\n"}
            └── README.md           # Documentation
          </CodeBlock>
        </Section>

        <Section title="🧪 Testing Your Setup">
          <div className="space-y-4">
            <p>Once everything is installed, test SlopMop:</p>
            
            <ol className="list-decimal pl-6 space-y-3 mt-4">
              <li>Navigate to the <button onClick={() => router.push("/test")} className="text-[#c9a96e] underline hover:text-white font-semibold">test page</button></li>
              <li>Click the SlopMop icon in your toolbar</li>
              <li>Click <strong>Analyze Page</strong></li>
              <li>Watch as different content types get highlighted</li>
              <li>Hover over highlights to see confidence scores</li>
            </ol>

            <div className="mt-6 p-4 bg-[#0f0c09] border-l-4 border-[#c9a96e] rounded-lg">
              <p className="text-sm">
                <strong>Expected behavior:</strong> The test page contains deliberately suspicious content 
                that should trigger all detection categories. If everything is working correctly, you'll see 
                purple, yellow, red, and blue highlights throughout the page.
              </p>
            </div>
          </div>
        </Section>

        <Section title="🆘 Troubleshooting">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg text-[#e6c889] mb-2">Extension not appearing?</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Verify Developer mode is enabled in <code className="bg-[#0f0c09] px-2 py-1 rounded text-[#c9a96e]">chrome://extensions/</code></li>
                <li>Check that you selected the correct <code className="bg-[#0f0c09] px-2 py-1 rounded text-[#c9a96e]">extension</code> folder</li>
                <li>Look for any error messages in the Chrome extensions page</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg text-[#e6c889] mb-2">Analysis not working?</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Confirm your API key is correctly entered in settings</li>
                <li>Check your API key quota at <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-[#c9a96e] underline hover:text-white">ai.google.dev</a></li>
                <li>Open the browser console (F12) to check for error messages</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg text-[#e6c889] mb-2">Video analysis not working?</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Ensure <code className="bg-[#0f0c09] px-2 py-1 rounded text-[#c9a96e]">node twelvelabs.js</code> is running</li>
                <li>Verify the server is accessible on port 3001</li>
                <li>Check that Twelve Labs API credentials are configured</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Next Steps */}
        <div className="p-8 bg-[#1e1712] border border-[#c9a96e] rounded-2xl">
          <h3 className="text-2xl text-[#c9a96e] mb-6">
            🎉 You're All Set!
          </h3>
          <p className="text-[#d8c7a2] mb-4">
            SlopMop is now ready to help you identify suspicious content across the web.
          </p>
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => router.push("/test")}
              className="px-6 py-3 bg-[#c9a96e] text-[#1a1410] font-semibold rounded-lg hover:bg-[#e6c889] transition"
            >
              Try the Test Page
            </button>
            <a
              href="https://github.com/fayaz12g/SlopMop"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-[#c9a96e] text-[#c9a96e] font-semibold rounded-lg hover:bg-[#c9a96e] hover:text-[#1a1410] transition"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#3a2b1d] py-8 text-center text-sm text-[#8a735c]">
        © {new Date().getFullYear()} SlopMop — Built to fight digital grime.
      </footer>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="p-10 bg-[#1e1712] border border-[#3a2b1d] rounded-2xl hover:border-[#c9a96e] transition shadow-lg">
      <h2 className="text-2xl text-[#e6c889] mb-6">
        {title}
      </h2>
      <div className="space-y-4 text-[#d8c7a2] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function InfoBox() {
  return (
    <div className="p-6 border-l-4 border-[#c9a96e] bg-[#231a13] rounded-lg shadow-md">
      <strong className="text-[#c9a96e]">Welcome!</strong> Follow the steps below
      to install and configure SlopMop. The entire setup takes less than 5 minutes.
    </div>
  );
}

function CodeBlock({ children, lang = "bash" }) {
  return (
    <div className="relative">
      {lang && (
        <div className="absolute top-2 right-2 text-xs text-[#8a735c] bg-[#0f0c09] px-2 py-1 rounded">
          {lang}
        </div>
      )}
      <pre className="bg-[#0f0c09] border border-[#3a2b1d] rounded-lg p-4 overflow-x-auto">
        <code className="text-[#c9a96e] text-sm font-mono">
          {children}
        </code>
      </pre>
    </div>
  );
}