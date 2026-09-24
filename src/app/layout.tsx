import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "XPLOSION 2K26 | The Ultimate College Afterparty",
  description: "Official ticketing experience and pass issuance platform for XPLOSION 2K26. 26.09.26 Saturday at Reborn Club & Kitchen, 12 PM onwards. Real-time pass reservations & cryptographic QR credentials.",
  keywords: ["XPLOSION 2K26", "College Afterparty", "College Fresher Party", "Nightclub Tickets", "Reborn Club & Kitchen"],
  openGraph: {
    title: "XPLOSION 2K26 | The Ultimate College Afterparty",
    description: "Official ticketing experience for XPLOSION 2K26. Saturday 26.09.26 at Reborn Club & Kitchen.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#030303",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#030303]">
      <body className="bg-[#030303] text-[#F5F5F5] min-h-screen flex flex-col font-sans antialiased selection:bg-[#FF0000] selection:text-black">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
