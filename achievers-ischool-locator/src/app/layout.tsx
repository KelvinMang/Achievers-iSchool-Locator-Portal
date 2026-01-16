import "./globals.css";
import { Inter, League_Spartan } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const league = League_Spartan({ subsets: ["latin"], variable: "--font-league" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${league.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
