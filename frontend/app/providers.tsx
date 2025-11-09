'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, Theme, lightTheme, darkTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '@/lib/wagmi';
import React from 'react';
import merge from 'lodash.merge';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const customLightTheme = merge(lightTheme(), {
  colors: {
    accentColor: 'oklch(0.65 0.12 15)', // Coral
    accentColorForeground: 'oklch(0.98 0.005 20)', // White
    actionButtonBorder: 'oklch(0.90 0.01 40)', // Border
    actionButtonBorderMobile: 'oklch(0.90 0.01 40)',
    actionButtonSecondaryBackground: 'oklch(0.96 0.005 30)', // Light background
    closeButton: 'oklch(0.45 0.02 250)', // Muted foreground
    closeButtonBackground: 'oklch(0.92 0.03 40)', // Muted
    connectButtonBackground: 'oklch(1 0 0)', // White
    connectButtonBackgroundError: 'oklch(0.577 0.245 27.325)', // Destructive
    connectButtonInnerBackground: 'oklch(0.96 0.005 30)',
    connectButtonText: 'oklch(0.25 0.04 250)', // Foreground
    connectButtonTextError: 'oklch(0.577 0.245 27.325)',
    connectionIndicator: 'oklch(0.65 0.12 15)', // Coral
    error: 'oklch(0.577 0.245 27.325)', // Destructive
    generalBorder: 'oklch(0.90 0.01 40)', // Border
    generalBorderDim: 'oklch(0.92 0.03 40)',
    menuItemBackground: 'oklch(0.65 0.12 15 / 0.1)', // Primary with opacity
    modalBackdrop: 'rgba(0, 0, 0, 0.3)',
    modalBackground: 'oklch(1 0 0)', // White
    modalBorder: 'oklch(0.90 0.01 40)',
    modalText: 'oklch(0.25 0.04 250)',
    modalTextDim: 'oklch(0.45 0.02 250)',
    modalTextSecondary: 'oklch(0.45 0.02 250)',
    profileAction: 'oklch(0.96 0.005 30)',
    profileActionHover: 'oklch(0.94 0.01 40)',
    profileForeground: 'oklch(1 0 0)',
    selectedOptionBorder: 'oklch(0.65 0.12 15)',
    standby: 'oklch(0.55 0.08 10)', // Secondary
  },
  radii: {
    actionButton: '0.75rem',
    connectButton: '0.75rem',
    menuButton: '0.75rem',
    modal: '0.75rem',
    modalMobile: '0.75rem',
  },
  fonts: {
    body: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  shadows: {
    connectButton: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
    dialog: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
    profileDetailsAction: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    selectedOption: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
    selectedWallet: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
    walletLogo: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },
} as Theme);

const customDarkTheme = merge(darkTheme(), {
  colors: {
    accentColor: 'oklch(0.70 0.14 15)', // Coral brighter
    accentColorForeground: 'oklch(0.98 0.005 20)',
    actionButtonBorder: 'oklch(0.35 0.03 250)',
    actionButtonBorderMobile: 'oklch(0.35 0.03 250)',
    actionButtonSecondaryBackground: 'oklch(0.30 0.03 250)',
    closeButton: 'oklch(0.70 0.02 40)',
    closeButtonBackground: 'oklch(0.35 0.03 250)',
    connectButtonBackground: 'oklch(0.28 0.04 250)',
    connectButtonBackgroundError: 'oklch(0.704 0.191 22.216)',
    connectButtonInnerBackground: 'oklch(0.30 0.03 250)',
    connectButtonText: 'oklch(0.95 0.005 40)',
    connectButtonTextError: 'oklch(0.704 0.191 22.216)',
    connectionIndicator: 'oklch(0.70 0.14 15)',
    error: 'oklch(0.704 0.191 22.216)',
    generalBorder: 'oklch(0.35 0.03 250)',
    generalBorderDim: 'oklch(0.30 0.03 250)',
    menuItemBackground: 'oklch(0.70 0.14 15 / 0.1)',
    modalBackdrop: 'rgba(0, 0, 0, 0.5)',
    modalBackground: 'oklch(0.28 0.04 250)',
    modalBorder: 'oklch(0.35 0.03 250)',
    modalText: 'oklch(0.95 0.005 40)',
    modalTextDim: 'oklch(0.70 0.02 40)',
    modalTextSecondary: 'oklch(0.70 0.02 40)',
    profileAction: 'oklch(0.30 0.03 250)',
    profileActionHover: 'oklch(0.35 0.03 250)',
    profileForeground: 'oklch(0.28 0.04 250)',
    selectedOptionBorder: 'oklch(0.70 0.14 15)',
    standby: 'oklch(0.60 0.10 10)',
  },
  radii: {
    actionButton: '0.75rem',
    connectButton: '0.75rem',
    menuButton: '0.75rem',
    modal: '0.75rem',
    modalMobile: '0.75rem',
  },
  fonts: {
    body: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  shadows: {
    connectButton: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -1px rgb(0 0 0 / 0.2)',
    dialog: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -2px rgb(0 0 0 / 0.2)',
    profileDetailsAction: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
    selectedOption: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px 0 rgb(0 0 0 / 0.2)',
    selectedWallet: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -1px rgb(0 0 0 / 0.2)',
    walletLogo: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
  },
} as Theme);

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Check if dark mode is enabled
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    checkDarkMode();

    // Watch for changes to dark mode
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={isDark ? customDarkTheme : customLightTheme}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


