'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingBag, FiMapPin, FiEdit2, FiClock, FiTag } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import styles from './CartSidebar.module.css';

export default function CartSidebar() {
    const { cart, isOpen, setIsOpen, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
    const { isAuthenticated, user } = useAuth();
    const { location, getCurrentLocation } = useLocation();
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [setIsOpen]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleApplyCoupon = () => {
        if (couponCode.toLowerCase() === 'welcome10') {
            setAppliedCoupon({ code: 'WELCOME10', discount: 10, type: 'percent' });
        } else if (couponCode.toLowerCase() === 'flat50') {
            setAppliedCoupon({ code: 'FLAT50', discount: 50, type: 'flat' });
        } else {
            alert('Invalid coupon code');
        }
        setCouponCode('');
    };

    if (!isOpen) return null;

    const subtotal = getCartTotal();
    const deliveryFee = cart.restaurant?.deliveryFee || 40;
    const tax = Math.round(subtotal * 0.05);

    // Calculate discount
    let discount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percent') {
            discount = Math.round(subtotal * (appliedCoupon.discount / 100));
        } else {
            discount = appliedCoupon.discount;
        }
    }

    const total = subtotal + deliveryFee + tax - discount;

    return (
        <>
            {/* Overlay */}
            <div className={styles.overlay} onClick={() => setIsOpen(false)} />

            {/* Sidebar */}
            <div className={styles.sidebar}>
                {/* Header */}
                <div className={styles.header}>
                    <h2>
                        <FiShoppingBag /> Cart
                    </h2>
                    <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                        <FiX />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {cart.items.length === 0 ? (
                        <div className={styles.emptyCart}>
                            <span className={styles.emptyIcon}>🛒</span>
                            <h3>Your cart is empty</h3>
                            <p>Add items from a restaurant to get started</p>
                            <Link href="/restaurants" className={styles.browseBtn} onClick={() => setIsOpen(false)}>
                                Browse Restaurants
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Restaurant Info */}
                            {cart.restaurant && (
                                <div className={styles.restaurantInfo}>
                                    <span className={styles.restaurantIcon}>🍽️</span>
                                    <div>
                                        <h4>{cart.restaurant.name}</h4>
                                        <p><FiClock /> {cart.restaurant.avgDeliveryTime || 30} min delivery</p>
                                    </div>
                                </div>
                            )}

                            {/* Delivery Address */}
                            <div className={styles.deliveryAddress}>
                                <div className={styles.addressHeader}>
                                    <FiMapPin className={styles.addressIcon} />
                                    <span>Deliver to</span>
                                </div>
                                {location.address ? (
                                    <div className={styles.addressContent}>
                                        <p>{location.address}</p>
                                        <button
                                            className={styles.changeBtn}
                                            onClick={() => getCurrentLocation()}
                                            disabled={location.isLoading}
                                        >
                                            {location.isLoading ? 'Getting...' : 'Change'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className={styles.useLocationBtn}
                                        onClick={() => getCurrentLocation()}
                                        disabled={location.isLoading}
                                    >
                                        <FiMapPin />
                                        {location.isLoading ? 'Getting location...' : 'Use Current Location'}
                                    </button>
                                )}
                            </div>

                            {/* Cart Items */}
                            <div className={styles.items}>
                                {cart.items.map((item, index) => (
                                    <div key={index} className={styles.cartItem}>
                                        <div className={styles.itemInfo}>
                                            <span className={styles.vegIndicator}>
                                                {item.isVeg !== false ? '🟢' : '🔴'}
                                            </span>
                                            <div>
                                                <h4>{item.name}</h4>
                                                <p className={styles.itemPrice}>₹{item.price}</p>
                                            </div>
                                        </div>
                                        <div className={styles.itemActions}>
                                            <div className={styles.quantityControl}>
                                                <button onClick={() => updateQuantity(index, item.quantity - 1)}>
                                                    <FiMinus />
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(index, item.quantity + 1)}>
                                                    <FiPlus />
                                                </button>
                                            </div>
                                            <span className={styles.itemTotal}>₹{item.price * item.quantity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon Section */}
                            <div className={styles.couponSection}>
                                {appliedCoupon ? (
                                    <div className={styles.appliedCoupon}>
                                        <FiTag />
                                        <span>{appliedCoupon.code} applied</span>
                                        <button onClick={() => setAppliedCoupon(null)}>Remove</button>
                                    </div>
                                ) : (
                                    <div className={styles.couponInput}>
                                        <FiTag />
                                        <input
                                            type="text"
                                            placeholder="Apply coupon code"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                        />
                                        <button onClick={handleApplyCoupon} disabled={!couponCode}>
                                            Apply
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Clear Cart */}
                            <button className={styles.clearBtn} onClick={clearCart}>
                                <FiTrash2 /> Clear Cart
                            </button>
                        </>
                    )}
                </div>

                {/* Footer - Bill Details & Checkout */}
                {cart.items.length > 0 && (
                    <div className={styles.footer}>
                        <div className={styles.billDetails}>
                            <h4>Bill Details</h4>
                            <div className={styles.billRow}>
                                <span>Item Total</span>
                                <span>₹{subtotal}</span>
                            </div>
                            <div className={styles.billRow}>
                                <span>Delivery Fee | {cart.restaurant?.avgDeliveryTime || 30} min</span>
                                <span>₹{deliveryFee}</span>
                            </div>
                            <div className={styles.billRow}>
                                <span>GST & Other Charges</span>
                                <span>₹{tax}</span>
                            </div>
                            {appliedCoupon && (
                                <div className={`${styles.billRow} ${styles.discount}`}>
                                    <span>Discount ({appliedCoupon.code})</span>
                                    <span>-₹{discount}</span>
                                </div>
                            )}
                            <div className={`${styles.billRow} ${styles.total}`}>
                                <span>TO PAY</span>
                                <span>₹{total}</span>
                            </div>
                        </div>

                        {isAuthenticated ? (
                            <Link href="/checkout" className={styles.checkoutBtn} onClick={() => setIsOpen(false)}>
                                Proceed to Pay • ₹{total}
                            </Link>
                        ) : (
                            <Link href="/login" className={styles.checkoutBtn} onClick={() => setIsOpen(false)}>
                                Login to Continue
                            </Link>
                        )}

                        <p className={styles.disclaimer}>
                            Review your order and address details to avoid cancellations
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
