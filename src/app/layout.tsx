import type { Metadata } from 'next';
import { Geist } from 'next/font/google';

const GeistSans = Geist({ subsets: ['latin'] });
import './globals.css';
import { WalletButton } from '@/components/wallet/WalletButton';
import { Providers } from '@/components/Providers';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'StackMate — Find your builder partner on Bitcoin L2',
  description: 'Connect with builders on the Stacks ecosystem. Find project partners, collaborators, and co-founders.',
  other: {
    'talentapp:project_verification': 'b9294b57f42c718cc231093c3c17fb293c2e251d13e6d44b998964b5e59b1190b814b5cafcbbccc115bf34b55a0b7c2c7878a8995976eb25c9bdb49623932587',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.className} bg-gray-950 text-white min-h-screen`}>
        <Providers>
          <nav className="border-b border-gray-800 px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="text-orange-400 font-bold text-lg tracking-tight">
                  StackMate
                </Link>
                <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
                  <Link href="/" className="hover:text-white transition-colors">Browse</Link>
                  <Link href="/projects/new" className="hover:text-white transition-colors">Post Project</Link>
                  <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                </div>
              </div>
              <WalletButton />
            </div>
          </nav>
          <main className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
