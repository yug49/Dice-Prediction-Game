import type { Metadata } from "next";
import "./globals.css";
import {Providers} from "./providers";
import {ReactNode} from "react";
import Header from "../components/Header";
import Image from "next/image";
import { Press_Start_2P } from 'next/font/google';

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Dice-Prediction-Game",
  description: "A simple dice prediction game built with Next.js, viem + wagmi and Privy.",
};

export default function RootLayout(props: {children: ReactNode}) {
  return (
    <html lang="en">
      <body className={pressStart2P.className} suppressHydrationWarning={true}>
        <Providers>
          {/* Fixed Background Image */}
          <div className="fixed inset-0 z-0">
            <Image
              src="/background.png"
              alt="Dice Game Background"
              fill
              className="object-cover"
              priority
            />
          </div>
          
          {/* Header positioned over background */}
          <div className="relative z-20">
            <Header />
          </div>
          
          {/* Main content positioned over background */}
          <div className="relative z-10">
            {props.children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
