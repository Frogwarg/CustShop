import type { Metadata } from "next";
import "@/app/globals.css";

import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

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
      <AuthProvider>
        <CartProvider>
          <Header />
            <main>
              {children}
              <Toaster expand={true} position="bottom-left" richColors closeButton/>
            </main>
          <Footer />
        </CartProvider>
      </AuthProvider>
      </body>
    </html>
  );
}