"use client";

import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { http, WagmiProvider, createConfig } from "wagmi";
import type { Chain } from "wagmi/chains";

const customChain: Chain = {
  id: Number(process.env.CHAIN_ID),
  name: process.env.CHAIN_NAME || '',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [`${process.env.BLOCKCHAIN_NODE}/${process.env.BTP_TOKEN}` || ''] },
  },
} as const satisfies Chain;

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [customChain],
    transports: {
      // RPC URL for each chain
      [customChain.id]: http(`${process.env.NEXT_PUBLIC_SERVER_URL}/proxy/blockchain-node`),
    },

    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",

    // Required App Info
    appName: "My App",

    // Optional App Info
    appDescription: "My App Info",
    appUrl: typeof window === "undefined" ? (process.env.NEXT_PUBLIC_SERVER_URL as string) : window.location.toString(),
  }),
);

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config} reconnectOnMount={true}>
      <ConnectKitProvider
        options={{
          language: "en-US",
          enforceSupportedChains: false,
        }}
        mode="auto"
      >
        {children}
      </ConnectKitProvider>
    </WagmiProvider>
  );
}
