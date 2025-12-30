import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import CartSidebar from '@/components/cart/CartSidebar';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { LocationProvider } from '@/context/LocationContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Fooddala - Food Delivery App',
  description: 'Order delicious food from the best restaurants near you. Fast delivery, great prices!',
  keywords: 'food delivery, restaurant, order food, fast food, delivery app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <LocationProvider>
              <Navbar />
              <main style={{ minHeight: 'calc(100vh - 140px)', paddingTop: 'var(--nav-height)' }}>
                {children}
              </main>
              <Footer />
              <CartSidebar />
            </LocationProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
