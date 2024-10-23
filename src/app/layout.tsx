import 'leaflet/dist/leaflet.css';
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import QueryProvider from "../providers/query";
import Web3Provider from "../providers/web3";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({ weight: ["400", "600", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coffee Beans Tracker",
  description: "Coffee beans"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${poppins.className}`}>
        <QueryProvider>
          <Web3Provider>{children} </Web3Provider>
        </QueryProvider>
      </body>
    </html>
  );
}
