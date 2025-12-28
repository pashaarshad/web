'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FiPackage, FiDollarSign, FiClock, FiCheck, FiX,
    FiMapPin, FiPhone, FiNavigation, FiUser, FiTruck,
    FiToggleLeft, FiToggleRight, FiStar
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/services/api';
import styles from './page.module.css';

export default function DriverPortal() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [isOnline, setIsOnline] = useState(false);
    const [stats, setStats] = useState({
        todayDeliveries: 0,
        todayEarnings: 0,
        weeklyEarnings: 0,
        rating: 0,
    });
    const [currentOrder, setCurrentOrder] = useState(null);
    const [availableOrders, setAvailableOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (!authLoading && user && user.role !== 'driver') {
            router.push('/');
            return;
        }

        if (isAuthenticated && user?.role === 'driver') {
            fetchData();
        }
    }, [isAuthenticated, authLoading, user, router]);

    // Poll for available orders when online
    useEffect(() => {
        let interval;
        if (isOnline && !currentOrder) {
            fetchAvailableOrders();
            interval = setInterval(fetchAvailableOrders, 10000); // Poll every 10s
        }
        return () => clearInterval(interval);
    }, [isOnline, currentOrder]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Check for active orders
            const activeResponse = await orderAPI.getDriverOrders({ status: 'ready,picked_up,on_the_way' });
            if (activeResponse.data.success && activeResponse.data.data.orders.length > 0) {
                setCurrentOrder(activeResponse.data.data.orders[0]);
                setIsOnline(true);
            }
        } catch (error) {
            console.error('Error fetching driver data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableOrders = async () => {
        try {
            const response = await orderAPI.getAvailableOrders();
            if (response.data.success) {
                setAvailableOrders(response.data.data.orders);
            }
        } catch (error) {
            console.error('Error fetching available orders:', error);
        }
    };

    const handleAcceptOrder = async (order) => {
        try {
            await orderAPI.acceptOrder(order._id);
            setCurrentOrder({ ...order, status: 'ready' });
            setAvailableOrders(prev => prev.filter(o => o._id !== order._id));
        } catch (error) {
            console.error('Error accepting order:', error);
            alert('Failed to accept order');
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!currentOrder) return;

        try {
            await orderAPI.updateStatus(currentOrder._id, newStatus);

            if (newStatus === 'delivered') {
                setStats(prev => ({
                    ...prev,
                    todayDeliveries: prev.todayDeliveries + 1,
                    todayEarnings: prev.todayEarnings + (currentOrder.deliveryFee || 0),
                }));
                setCurrentOrder(null);
                fetchAvailableOrders();
            } else {
                setCurrentOrder(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const toggleOnline = () => {
        setIsOnline(!isOnline);
    };

    const formatAddress = (addr) => {
        if (!addr) return '';
        if (typeof addr === 'string') return addr;
        return `${addr.street || ''}, ${addr.city || ''}`;
    };

    if (authLoading || loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.logo}>🏍️</span>
                    <div>
                        <h1>Delivery Partner</h1>
                        <p>Welcome, {user?.name || 'Partner'}!</p>
                    </div>
                </div>

                {/* Online Toggle */}
                <div className={styles.onlineToggle}>
                    <span className={`${styles.onlineStatus} ${isOnline ? styles.online : styles.offline}`}>
                        {isOnline ? '🟢 Online' : '🔴 Offline'}
                    </span>
                    <button
                        className={`${styles.toggleBtn} ${isOnline ? styles.active : ''}`}
                        onClick={toggleOnline}
                    >
                        {isOnline ? <FiToggleRight /> : <FiToggleLeft />}
                    </button>
                </div>
            </header>

            <main className={styles.main}>
                {/* Stats Cards */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}>
                            <FiTruck />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats.todayDeliveries}</span>
                            <span className={styles.statLabel}>Today's Deliveries</span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }}>
                            <FiDollarSign />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>₹{stats.todayEarnings}</span>
                            <span className={styles.statLabel}>Today's Earnings</span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}>
                            <FiDollarSign />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>₹{stats.weeklyEarnings}</span>
                            <span className={styles.statLabel}>This Week</span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(156, 39, 176, 0.1)', color: '#9c27b0' }}>
                            <FiStar />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats.rating} ⭐</span>
                            <span className={styles.statLabel}>Rating</span>
                        </div>
                    </div>
                </div>

                {/* Current Active Order */}
                {currentOrder && (
                    <section className={styles.activeOrder}>
                        <h2>🚀 Active Delivery</h2>
                        <div className={styles.activeOrderCard}>
                            <div className={styles.orderProgress}>
                                <div className={`${styles.progressStep} ${['ready', 'accepted'].includes(currentOrder.status) ? styles.active : styles.done}`}>
                                    <span className={styles.stepDot}>1</span>
                                    <span>Accepted</span>
                                </div>
                                <div className={styles.progressLine}></div>
                                <div className={`${styles.progressStep} ${currentOrder.status === 'picked_up' ? styles.active : ['on_the_way', 'delivered'].includes(currentOrder.status) ? styles.done : ''}`}>
                                    <span className={styles.stepDot}>2</span>
                                    <span>Picked Up</span>
                                </div>
                                <div className={styles.progressLine}></div>
                                <div className={`${styles.progressStep} ${currentOrder.status === 'on_the_way' ? styles.active : currentOrder.status === 'delivered' ? styles.done : ''}`}>
                                    <span className={styles.stepDot}>3</span>
                                    <span>On the Way</span>
                                </div>
                                <div className={styles.progressLine}></div>
                                <div className={styles.progressStep}>
                                    <span className={styles.stepDot}>4</span>
                                    <span>Delivered</span>
                                </div>
                            </div>

                            <div className={styles.orderDetails}>
                                {/* Pickup Location */}
                                <div className={styles.locationCard}>
                                    <div className={styles.locationIcon} style={{ background: '#e3f2fd' }}>
                                        <FiPackage style={{ color: '#2196f3' }} />
                                    </div>
                                    <div className={styles.locationInfo}>
                                        <span className={styles.locationType}>PICKUP</span>
                                        <h4>{currentOrder.restaurant?.name || 'Restaurant'}</h4>
                                        <p>{formatAddress(currentOrder.restaurant?.address)}</p>
                                    </div>
                                    <button className={styles.navBtn}>
                                        <FiNavigation />
                                    </button>
                                </div>

                                {/* Drop Location */}
                                <div className={styles.locationCard}>
                                    <div className={styles.locationIcon} style={{ background: '#e8f5e9' }}>
                                        <FiMapPin style={{ color: '#4caf50' }} />
                                    </div>
                                    <div className={styles.locationInfo}>
                                        <span className={styles.locationType}>DROP</span>
                                        <h4>{currentOrder.customer?.name || 'Customer'}</h4>
                                        <p>{formatAddress(currentOrder.deliveryAddress)}</p>
                                        <a href={`tel:${currentOrder.customer?.phone}`} className={styles.phoneLink}>
                                            <FiPhone /> {currentOrder.customer?.phone}
                                        </a>
                                    </div>
                                    <button className={styles.navBtn}>
                                        <FiNavigation />
                                    </button>
                                </div>
                            </div>

                            <div className={styles.earningBadge}>
                                Earn <strong>₹{currentOrder.deliveryFee || 0}</strong> on this delivery
                            </div>

                            {/* Action Buttons */}
                            <div className={styles.actionButtons}>
                                {(currentOrder.status === 'ready' || currentOrder.status === 'accepted') && (
                                    <button
                                        className={styles.primaryBtn}
                                        onClick={() => handleUpdateStatus('picked_up')}
                                    >
                                        <FiCheck /> Picked Up Order
                                    </button>
                                )}
                                {currentOrder.status === 'picked_up' && (
                                    <button
                                        className={styles.primaryBtn}
                                        onClick={() => handleUpdateStatus('on_the_way')}
                                    >
                                        <FiTruck /> Start Delivery
                                    </button>
                                )}
                                {currentOrder.status === 'on_the_way' && (
                                    <button
                                        className={`${styles.primaryBtn} ${styles.success}`}
                                        onClick={() => handleUpdateStatus('delivered')}
                                    >
                                        <FiCheck /> Mark as Delivered
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* Available Orders */}
                {!currentOrder && isOnline && (
                    <section className={styles.availableOrders}>
                        <h2>📦 Available Orders</h2>
                        {availableOrders.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span>🔍</span>
                                <p>Looking for orders nearby...</p>
                            </div>
                        ) : (
                            <div className={styles.ordersGrid}>
                                {availableOrders.map(order => (
                                    <div key={order._id} className={styles.orderCard}>
                                        <div className={styles.orderHeader}>
                                            <span className={styles.orderNumber}>{order.orderNumber}</span>
                                            <span className={styles.earnBadge}>Earn ₹{order.deliveryFee}</span>
                                        </div>

                                        <div className={styles.routeInfo}>
                                            <div className={styles.routePoint}>
                                                <FiPackage className={styles.pickupIcon} />
                                                <div>
                                                    <span className={styles.routeLabel}>Pickup</span>
                                                    <p>{order.restaurant?.name}</p>
                                                </div>
                                            </div>
                                            <div className={styles.routeLine}></div>
                                            <div className={styles.routePoint}>
                                                <FiMapPin className={styles.dropIcon} />
                                                <div>
                                                    <span className={styles.routeLabel}>Drop</span>
                                                    <p>{formatAddress(order.deliveryAddress)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.orderMeta}>
                                            <span>{order.items?.length || 0} items · ₹{order.total}</span>
                                        </div>

                                        <button
                                            className={styles.acceptBtn}
                                            onClick={() => handleAcceptOrder(order)}
                                        >
                                            Accept Order
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Offline State */}
                {!isOnline && !currentOrder && (
                    <div className={styles.offlineState}>
                        <span className={styles.offlineIcon}>🔴</span>
                        <h2>You're Offline</h2>
                        <p>Go online to start receiving delivery requests</p>
                        <button className={styles.goOnlineBtn} onClick={toggleOnline}>
                            <FiToggleRight /> Go Online
                        </button>
                    </div>
                )}

                {/* Quick Links */}
                <div className={styles.quickLinks}>
                    <Link href="/driver-portal/history" className={styles.quickLink}>
                        <FiClock /> Delivery History
                    </Link>
                    <Link href="/driver-portal/earnings" className={styles.quickLink}>
                        <FiDollarSign /> Earnings
                    </Link>
                    <Link href="/driver-portal/profile" className={styles.quickLink}>
                        <FiUser /> Profile
                    </Link>
                </div>
            </main>
        </div>
    );
}
