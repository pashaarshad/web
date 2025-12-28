'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiMapPin } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import styles from './Navbar.module.css';

export default function Navbar() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();
    const { getCartCount, setIsOpen } = useCart();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const cartCount = getCartCount();

    const navLinks = [
        { href: '/', label: 'Home', icon: FiHome },
        { href: '/restaurants', label: 'Restaurants', icon: FiSearch },
    ];

    return (
        <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
            <div className={styles.container}>
                {/* Logo */}
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>🍕</span>
                    <span className={styles.logoText}>Fooddala</span>
                </Link>

                {/* Location Selector */}
                <div className={styles.location}>
                    <FiMapPin className={styles.locationIcon} />
                    <span>Bengaluru, India</span>
                </div>

                {/* Desktop Navigation */}
                <div className={styles.navLinks}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                        >
                            <link.icon />
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </div>

                {/* Right Side Actions */}
                <div className={styles.actions}>
                    {/* Cart Button */}
                    <button className={styles.cartBtn} onClick={() => setIsOpen(true)}>
                        <FiShoppingCart />
                        {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
                    </button>

                    {/* User Menu */}
                    {isAuthenticated ? (
                        <div className={styles.userMenu}>
                            <button
                                className={styles.userBtn}
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                <div className={styles.avatar}>
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} />
                                    ) : (
                                        <span>{user?.name?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                            </button>

                            {userMenuOpen && (
                                <div className={styles.dropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <p className={styles.userName}>{user?.name}</p>
                                        <p className={styles.userEmail}>{user?.email}</p>
                                    </div>
                                    <Link href="/profile" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                                        Profile
                                    </Link>
                                    <Link href="/orders" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                                        My Orders
                                    </Link>
                                    {user?.role === 'admin' && (
                                        <Link href="/admin" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                                            Admin Panel
                                        </Link>
                                    )}
                                    <button className={styles.logoutBtn} onClick={() => { logout(); setUserMenuOpen(false); }}>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.authButtons}>
                            <Link href="/login" className={styles.loginBtn}>
                                Login
                            </Link>
                            <Link href="/register" className={styles.registerBtn}>
                                Register
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button className={styles.mobileToggle} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className={styles.mobileMenu}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={styles.mobileLink}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <link.icon />
                            <span>{link.label}</span>
                        </Link>
                    ))}
                    {!isAuthenticated && (
                        <Link href="/login" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>
                            <FiUser />
                            <span>Login</span>
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}
