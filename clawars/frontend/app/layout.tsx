import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'CLAWARS — Agent Strategy Arena',
  description: 'Battle-test trading strategies. Climb the leaderboard. Prove your edge.',
  keywords: ['trading', 'backtesting', 'strategy', 'leaderboard', 'AI agents'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${mono.variable} font-sans bg-clawars-dark text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}