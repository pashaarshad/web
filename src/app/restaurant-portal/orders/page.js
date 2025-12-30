'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FiPackage, FiDollarSign, FiClock, FiCheck, FiX,
    FiTrendingUp, FiMenu, FiSettings, FiStar, FiAlertCircle,
    FiToggleLeft, FiToggleRight
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/services/api';
import styles from './page.module.css';

export default function RestaurantOrders() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('pending'); // Default to pending, can change to 'all' if backend supports
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (!authLoading && user && user.role !== 'restaurant') {
            router.push('/');
            return;
        }

        if (isAuthenticated && user?.role === 'restaurant') {
            fetchOrders();
        }
    }, [isAuthenticated, authLoading, user, router, activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            let status = activeTab;
            if (activeTab === 'preparing') status = 'confirmed,preparing';
            if (activeTab === 'completed') status = 'picked_up,on_the_way,delivered';

            // If we want a generic 'all' tab, we might need adjustments, but let's stick to tabs
            const response = await orderAPI.getRestaurantOrders({ status });
            if (response.data.success) {
                setOrders(response.data.data.orders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOrderAction = async (orderId, action) => {
        try {
            let newStatus;
            switch (action) {
                case 'accept': newStatus = 'confirmed'; break;
                case 'prepare': newStatus = 'preparing'; break;
                case 'ready': newStatus = 'ready'; break;
                case 'reject': newStatus = 'cancelled'; break;
                default: return;
            }

            await orderAPI.updateStatus(orderId, newStatus);
            fetchOrders();
        } catch (error) {
            console.error('Error updating order:', error);
            alert(error.response?.data?.message || 'Failed to update order');
        }
    };

    const getTimeSinceOrder = (createdAt) => {
        const minutes = Math.floor((new Date() - new Date(createdAt)) / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
    };

    if (authLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.logoIcon}>🍽️</span>
                    <span className={styles.logoText}>Restaurant Portal</span>
                </div>

                <nav className={styles.sidebarNav}>
                    <Link href="/restaurant-portal" className={styles.navItem}>
                        <FiPackage /> Dashboard
                    </Link>
                    <Link href="/restaurant-portal/orders" className={`${styles.navItem} ${styles.active}`}>
                        <FiClock /> All Orders
                    </Link>
                    <Link href="/restaurant-portal/menu" className={styles.navItem}>
                        <FiMenu /> Menu
                    </Link>
                    <Link href="/restaurant-portal/earnings" className={styles.navItem}>
                        <FiDollarSign /> Earnings
                    </Link>
                    <Link href="/restaurant-portal/settings" className={styles.navItem}>
                        <FiSettings /> Settings
                    </Link>
                </nav>

                {/* Restaurant Status Toggle */}
                <div className={styles.statusToggle}>
                    <span className={styles.statusLabel}>
                        {isRestaurantOpen ? '🟢 Accepting Orders' : '🔴 Closed'}
                    </span>
                    <button
                        className={`${styles.toggleBtn} ${isRestaurantOpen ? styles.active : ''}`}
                        onClick={() => setIsRestaurantOpen(!isRestaurantOpen)}
                    >
                        {isRestaurantOpen ? <FiToggleRight /> : <FiToggleLeft />}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {/* Header */}
                <header className={styles.header}>
                    <div>
                        <h1>All Orders</h1>
                        <p>Manage your orders efficiently</p>
                    </div>
                </header>

                {/* Orders Section */}
                <section className={styles.ordersSection}>
                    <div className={styles.sectionHeader}>
                        <h2>Order List</h2>
                        <div className={styles.orderTabs}>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'pending' ? styles.active : ''}`}
                                onClick={() => setActiveTab('pending')}
                            >
                                New
                            </button>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'preparing' ? styles.active : ''}`}
                                onClick={() => setActiveTab('preparing')}
                            >
                                Preparing
                            </button>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'ready' ? styles.active : ''}`}
                                onClick={() => setActiveTab('ready')}
                            >
                                Ready
                            </button>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'completed' ? styles.active : ''}`}
                                onClick={() => setActiveTab('completed')}
                            >
                                Completed
                            </button>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'cancelled' ? styles.active : ''}`}
                                onClick={() => setActiveTab('cancelled')}
                            >
                                Cancelled
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.loading} style={{ minHeight: '200px' }}>
                            <div className={styles.spinner}></div>
                        </div>
                    ) : (
                        <div className={styles.ordersGrid}>
                            {orders.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <span>📦</span>
                                    <p>No orders found</p>
                                </div>
                            ) : (
                                orders.map(order => (
                                    <div key={order._id} className={styles.orderCard}>
                                        <div className={styles.orderHeader}>
                                            <div>
                                                <span className={styles.orderNumber}>{order.orderNumber}</span>
                                                <span className={styles.orderTime}>{getTimeSinceOrder(order.createdAt)}</span>
                                            </div>
                                            <span className={`${styles.paymentBadge} ${order.paymentMethod === 'online' ? styles.paid : styles.cod}`}>
                                                {order.paymentMethod === 'online' ? '✓ Paid' : 'COD'}
                                            </span>
                                        </div>

                                        <div className={styles.customerInfo}>
                                            <span className={styles.customerName}>{order.customer.name}</span>
                                            <span className={styles.customerPhone}>{order.customer.phone}</span>
                                        </div>

                                        <div className={styles.orderItems}>
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className={styles.itemRow}>
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <span>₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className={styles.orderTotal}>
                                            <span>Total</span>
                                            <span>₹{order.total}</span>
                                        </div>

                                        <div className={styles.orderActions}>
                                            {order.status === 'pending' && (
                                                <>
                                                    <button
                                                        className={styles.acceptBtn}
                                                        onClick={() => handleOrderAction(order._id, 'accept')}
                                                    >
                                                        <FiCheck /> Accept
                                                    </button>
                                                    <button
                                                        className={styles.rejectBtn}
                                                        onClick={() => handleOrderAction(order._id, 'reject')}
                                                    >
                                                        <FiX /> Reject
                                                    </button>
                                                </>
                                            )}
                                            {order.status === 'confirmed' && (
                                                <button
                                                    className={styles.readyBtn}
                                                    style={{ background: '#2196f3' }}
                                                    onClick={() => handleOrderAction(order._id, 'prepare')}
                                                >
                                                    <FiClock /> Start Preparing
                                                </button>
                                            )}
                                            {order.status === 'preparing' && (
                                                <button
                                                    className={styles.readyBtn}
                                                    onClick={() => handleOrderAction(order._id, 'ready')}
                                                >
                                                    <FiCheck /> Mark as Ready
                                                </button>
                                            )}
                                            {order.status === 'ready' && (
                                                <span className={styles.waitingPickup}>
                                                    ⏳ Order Ready - Waiting for Pickup
                                                </span>
                                            )}
                                            {['picked_up', 'on_the_way'].includes(order.status) && (
                                                <span className={styles.waitingPickup} style={{ background: '#e3f2fd', color: '#1565c0' }}>
                                                    🚚 On the Way
                                                </span>
                                            )}
                                            {order.status === 'delivered' && (
                                                <span className={styles.waitingPickup} style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                                                    ✅ Delivered
                                                </span>
                                            )}
                                            {order.status === 'cancelled' && (
                                                <span className={styles.waitingPickup} style={{ background: '#ffebee', color: '#c62828' }}>
                                                    ❌ Cancelled
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
