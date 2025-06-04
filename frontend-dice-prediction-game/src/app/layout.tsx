import type { Metadata } from "next";
import "./globals.css";
import {Providers} from "./providers";
import {ReactNode} from "react";
import Header from "../components/Header";

export const metadata: Metadata = {
  title: "Dice-Prediction-Game",
  description: "A simple dice prediction game built with Next.js, viem + wagmi and Privy.",
};

export default function RootLayout(props: {children: ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <Providers>
          <Header />
          {props.children}
        </Providers>
      </body>
    </html>
  );
}
