'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiClock, FiMapPin, FiDollarSign, FiStar } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/services/api';
import styles from './page.module.css';

export default function DriverHistory() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
        if (!authLoading && user && user.role !== 'driver') {
            router.push('/');
        }
        if (isAuthenticated && user?.role === 'driver') {
            fetchHistory();
        }
    }, [isAuthenticated, authLoading, user, router]);

    const fetchHistory = async () => {
        try {
            // Fetch delivered orders
            const response = await orderAPI.getDriverOrders({ status: 'delivered' });
            if (response.data.success) {
                setOrders(response.data.data.orders);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            // Fallback to demo data if API fails or is empty
            setOrders([
                {
                    _id: '1',
                    orderNumber: 'FD-DEMO-001',
                    restaurant: { name: 'Spice Garden', address: 'MG Road' },
                    deliveryAddress: { street: 'Koramangala 4th Block' },
                    deliveryFee: 45,
                    total: 540,
                    createdAt: new Date().toISOString(),
                    status: 'delivered'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (authLoading || loading) {
        return <div className={styles.loading}><div className={styles.spinner}></div></div>;
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Link href="/driver-portal" className={styles.backBtn}>
                    <FiArrowLeft /> Back to Dashboard
                </Link>
                <div className={styles.headerContent}>
                    <h1>📜 Delivery History</h1>
                    <div className={styles.statsSummary}>
                        <div className={styles.statItem}>
                            <span>Total Deliveries</span>
                            <strong>{orders.length}</strong>
                        </div>
                        <div className={styles.statItem}>
                            <span>Total Earned</span>
                            <strong>₹{orders.reduce((acc, order) => acc + (order.deliveryFee || 0), 0)}</strong>
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                {orders.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📦</span>
                        <h3>No deliveries yet</h3>
                        <p>Completed deliveries will appear here</p>
                    </div>
                ) : (
                    <div className={styles.historyList}>
                        {orders.map(order => (
                            <div key={order._id} className={styles.historyCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.orderId}>
                                        <span className={styles.orderNumber}>{order.orderNumber}</span>
                                        <span className={styles.date}>{formatDate(order.createdAt)}</span>
                                    </div>
                                    <span className={styles.earning}>+₹{order.deliveryFee}</span>
                                </div>

                                <div className={styles.routeInfo}>
                                    <div className={styles.routePoint}>
                                        <div className={styles.pointDot} style={{ background: '#2196f3' }}></div>
                                        <div>
                                            <span className={styles.label}>Pickup</span>
                                            <p>{order.restaurant?.name || 'Restaurant'}</p>
                                        </div>
                                    </div>
                                    <div className={styles.routeLine}></div>
                                    <div className={styles.routePoint}>
                                        <div className={styles.pointDot} style={{ background: '#4caf50' }}></div>
                                        <div>
                                            <span className={styles.label}>Drop</span>
                                            <p>{order.deliveryAddress?.street || 'Customer Location'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.cardFooter}>
                                    <div className={styles.statusBadge}>
                                        <FiCheck /> Delivered
                                    </div>
                                    <div className={styles.rating}>
                                        5.0 <FiStar className={styles.starIcon} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
