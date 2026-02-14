export default function TestPage() {
  return (
    <div className="min-h-screen bg-[#14100c] text-[#f3e7d0] px-6 py-16 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-[#c9a96e] mb-10">
          SlopMop Test Page
        </h1>

        <InfoBox />

        <Section title="✅ Safe Content">
          <p>This is completely normal and safe text.</p>
          <p>This paragraph contains regular verified information.</p>
          <p>
            <a href="https://example.com" className="text-[#c9a96e] underline">
              This is a normal link to Example.com
            </a>
          </p>
        </Section>

        <Section title="🚨 Malicious Content (RED)">
          <p>Be careful! This is malicious content that could harm your computer.</p>
          <p>Click here to download a file - <a href="#">this is malicious link</a></p>
          <p>Warning: this link leads to dangerous website content.</p>
        </Section>

        <Section title="🧠 AI Generated (PURPLE)">
          <p>This article was written by an AI. This is AI generated content.</p>
        </Section>

        <Section title="⚠️ Misinformation (YELLOW)">
          <p>The following statement contains this is false information: The moon is made of cheese.</p>
          <p>This paragraph discusses misinformation spreading online.</p>
        </Section>

        <Section title="🔍 Tracker Indicators (BLUE)">
          <p>This page contains suspicious tracking behavior and data collection patterns.</p>
        </Section>

        <div className="mt-16 p-6 bg-[#1e1712] border border-[#3a2b1d] rounded-xl">
          <h3 className="text-xl text-[#c9a96e] mb-4">Expected Results</h3>
          <ul className="list-disc pl-6 space-y-2 text-[#d8c7a2]">
            <li>Red highlights for malicious content</li>
            <li>Purple highlights for AI content</li>
            <li>Yellow highlights for misinformation</li>
            <li>Blue highlights for trackers</li>
            <li>Safe content remains untouched</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-12 p-8 bg-[#1e1712] border border-[#3a2b1d] rounded-2xl">
      <h2 className="text-2xl text-[#e6c889] mb-4">{title}</h2>
      <div className="space-y-3 text-[#d8c7a2]">
        {children}
      </div>
    </div>
  );
}

function InfoBox() {
  return (
    <div className="mb-12 p-6 border-l-4 border-[#c9a96e] bg-[#231a13] rounded">
      <strong className="text-[#c9a96e]">Instructions:</strong> Open the
      SlopMop extension while viewing this page. It should detect and
      highlight suspicious content.
    </div>
  );
}
