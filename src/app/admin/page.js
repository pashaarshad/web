'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPackage, FiDollarSign, FiUsers, FiTrendingUp, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function AdminDashboard() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [stats, setStats] = useState({
        totalOrders: 156,
        revenue: 45600,
        customers: 89,
        pendingOrders: 5,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check if user has admin/restaurant_owner role
        if (!authLoading && user && !['admin', 'restaurant_owner'].includes(user.role)) {
            router.push('/');
            return;
        }

        fetchDashboardData();
    }, [isAuthenticated, authLoading, user, router]);

    const fetchDashboardData = async () => {
        // Demo data for now
        setRecentOrders([
            { _id: '1', orderNumber: 'FD-001', customer: 'John Doe', total: 450, status: 'pending', createdAt: new Date() },
            { _id: '2', orderNumber: 'FD-002', customer: 'Jane Smith', total: 680, status: 'preparing', createdAt: new Date(Date.now() - 10 * 60000) },
            { _id: '3', orderNumber: 'FD-003', customer: 'Mike Johnson', total: 320, status: 'on_the_way', createdAt: new Date(Date.now() - 30 * 60000) },
            { _id: '4', orderNumber: 'FD-004', customer: 'Sarah Williams', total: 890, status: 'delivered', createdAt: new Date(Date.now() - 60 * 60000) },
        ]);
        setLoading(false);
    };

    const handleOrderAction = (orderId, action) => {
        console.log(`${action} order ${orderId}`);
        // API call would go here
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#ff9800',
            confirmed: '#2196f3',
            preparing: '#9c27b0',
            ready: '#00bcd4',
            on_the_way: '#8bc34a',
            delivered: '#4caf50',
            cancelled: '#f44336',
        };
        return colors[status] || '#999';
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
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1>Dashboard</h1>
                        <p>Welcome back, {user?.name || 'Admin'}!</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(255, 87, 34, 0.1)', color: '#ff5722' }}>
                            <FiPackage />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats.totalOrders}</span>
                            <span className={styles.statLabel}>Total Orders</span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}>
                            <FiDollarSign />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>₹{stats.revenue.toLocaleString()}</span>
                            <span className={styles.statLabel}>Revenue</span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}>
                            <FiUsers />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats.customers}</span>
                            <span className={styles.statLabel}>Customers</span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }}>
                            <FiClock />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats.pendingOrders}</span>
                            <span className={styles.statLabel}>Pending Orders</span>
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Recent Orders</h2>
                    </div>

                    <div className={styles.ordersTable}>
                        <div className={styles.tableHeader}>
                            <span>Order ID</span>
                            <span>Customer</span>
                            <span>Amount</span>
                            <span>Status</span>
                            <span>Time</span>
                            <span>Actions</span>
                        </div>

                        {recentOrders.map((order) => (
                            <div key={order._id} className={styles.tableRow}>
                                <span className={styles.orderId}>{order.orderNumber}</span>
                                <span>{order.customer}</span>
                                <span className={styles.amount}>₹{order.total}</span>
                                <span
                                    className={styles.status}
                                    style={{ color: getStatusColor(order.status) }}
                                >
                                    {order.status.replace('_', ' ')}
                                </span>
                                <span className={styles.time}>
                                    {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                                <div className={styles.actions}>
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
                                    {order.status === 'preparing' && (
                                        <button
                                            className={styles.readyBtn}
                                            onClick={() => handleOrderAction(order._id, 'ready')}
                                        >
                                            Ready for Pickup
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Quick Actions</h2>
                    </div>

                    <div className={styles.quickActions}>
                        <button className={styles.actionCard}>
                            <span className={styles.actionIcon}>🍔</span>
                            <span>Manage Menu</span>
                        </button>
                        <button className={styles.actionCard}>
                            <span className={styles.actionIcon}>📊</span>
                            <span>View Analytics</span>
                        </button>
                        <button className={styles.actionCard}>
                            <span className={styles.actionIcon}>⚙️</span>
                            <span>Settings</span>
                        </button>
                        <button className={styles.actionCard}>
                            <span className={styles.actionIcon}>💬</span>
                            <span>Reviews</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
