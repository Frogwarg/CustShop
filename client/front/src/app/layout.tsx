import type { Metadata } from "next";
import "@/app/globals.css";

import Header from "./Header/Header";
import Footer from "./Footer/Footer";

export const metadata: Metadata = {
  title: "CustShop",
  description: "Online shop selling customized products",
  openGraph: {title: "CustShop", description: "Custom shop"},
  icons: "./favicon.ico"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
