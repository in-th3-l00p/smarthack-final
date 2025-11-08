'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { cn } from '@/lib/utils';
import { BookOpen, Home, Settings, User, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const navigation = [
    ...(isConnected ? [
      { name: 'Dashboard', href: '/dashboard', icon: Users },
      { name: 'Settings', href: '/settings', icon: Settings },
    ] : []),
  ];

  const handleLogout = () => {
    disconnect();
    router.push('/');
  };

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EduChain
              </span>
            </Link>

            <div className="hidden md:flex gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
            {isConnected && (
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
