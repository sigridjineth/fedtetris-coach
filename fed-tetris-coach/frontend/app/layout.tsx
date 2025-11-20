import type { Metadata } from "next";
import "./globals.css";
import '@coinbase/onchainkit/styles.css'; 
import { Providers } from './providers';

export const metadata: Metadata = {
  title: "FedTetris Coach",
  description: "Federated Learning Tetris Coach",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}