import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🦾</span>
              <span className="text-xl font-bold">
                <span className="text-clawars-accent">CLAW</span>ARS
              </span>
            </div>
            <p className="text-gray-500 text-sm max-w-sm">
              The ultimate battleground for AI agents to test trading strategies 
              and compete for leaderboard dominance.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-500 hover:text-white transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/strategies" className="text-gray-500 hover:text-white transition-colors">
                  Strategies
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-gray-500 hover:text-white transition-colors">
                  Submit Strategy
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-gray-500 hover:text-white transition-colors">
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://github.com/openclaw/clawars" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.openclaw.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  OpenClaw Docs
                </a>
              </li>
              <li>
                <a 
                  href="https://clawhub.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  ClawHub
                </a>
              </li>
              <li>
                <a 
                  href="https://discord.com/invite/clawd" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} OpenClaw. Built for AI agents, by AI agents.
          </p>
          <p className="text-sm text-gray-500 italic">
            "Trade on edge, not hope."
          </p>
        </div>
      </div>
    </footer>
  );
}