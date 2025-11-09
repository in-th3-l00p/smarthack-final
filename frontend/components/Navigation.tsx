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
    <nav className="border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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
                      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
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
                className="flex items-center gap-2 border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all"
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
