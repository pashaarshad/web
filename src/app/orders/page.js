'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiClock, FiMapPin, FiPhone, FiChevronRight, FiPackage, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { orderAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function OrdersPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchOrders();
        }
    }, [isAuthenticated, filter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter === 'active') {
                params.status = 'pending,confirmed,preparing,ready,picked_up,on_the_way';
            } else if (filter !== 'all') {
                params.status = filter;
            }
            const response = await orderAPI.getMyOrders(params);
            setOrders(response.data.data.orders || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders(getDemoOrders());
        }
        setLoading(false);
    };

    const getDemoOrders = () => [
        {
            _id: '1',
            orderNumber: 'FD-2024-001',
            restaurant: { name: 'Spice Garden', logo: null },
            items: [{ name: 'Butter Chicken', quantity: 2 }, { name: 'Naan', quantity: 4 }],
            total: 680,
            status: 'delivered',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
            _id: '2',
            orderNumber: 'FD-2024-002',
            restaurant: { name: 'Pizza Paradise', logo: null },
            items: [{ name: 'Margherita Pizza', quantity: 1 }, { name: 'Garlic Bread', quantity: 1 }],
            total: 450,
            status: 'on_the_way',
            createdAt: new Date(Date.now() - 30 * 60 * 1000),
            estimatedDeliveryTime: new Date(Date.now() + 15 * 60 * 1000),
        },
    ];

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'Pending', color: 'orange', icon: FiClock },
            confirmed: { label: 'Confirmed', color: 'blue', icon: FiCheckCircle },
            preparing: { label: 'Preparing', color: 'purple', icon: FiPackage },
            ready: { label: 'Ready', color: 'teal', icon: FiPackage },
            picked_up: { label: 'Picked Up', color: 'cyan', icon: FiPackage },
            on_the_way: { label: 'On the Way', color: 'lime', icon: FiMapPin },
            delivered: { label: 'Delivered', color: 'green', icon: FiCheckCircle },
            cancelled: { label: 'Cancelled', color: 'red', icon: FiXCircle },
        };
        return statusConfig[status] || statusConfig.pending;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>My Orders</h1>
                    <p>Track and manage your orders</p>
                </div>

                {/* Filter Tabs */}
                <div className={styles.filters}>
                    {[
                        { value: 'all', label: 'All Orders' },
                        { value: 'active', label: 'Active' },
                        { value: 'delivered', label: 'Completed' },
                        { value: 'cancelled', label: 'Cancelled' },
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            className={`${styles.filterBtn} ${filter === tab.value ? styles.active : ''}`}
                            onClick={() => setFilter(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                <div className={styles.ordersList}>
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className={styles.skeletonCard}></div>
                        ))
                    ) : orders.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📦</span>
                            <h3>No orders found</h3>
                            <p>You haven't placed any orders yet</p>
                            <Link href="/restaurants" className={styles.orderBtn}>
                                Order Now
                            </Link>
                        </div>
                    ) : (
                        orders.map((order) => {
                            const statusInfo = getStatusBadge(order.status);
                            const StatusIcon = statusInfo.icon;
                            return (
                                <Link key={order._id} href={`/orders/${order._id}`} className={styles.orderCard}>
                                    <div className={styles.orderHeader}>
                                        <div className={styles.restaurantInfo}>
                                            <div className={styles.restaurantLogo}>🍽️</div>
                                            <div>
                                                <h3>{order.restaurant?.name || 'Restaurant'}</h3>
                                                <p className={styles.orderNumber}>{order.orderNumber}</p>
                                            </div>
                                        </div>
                                        <span className={styles.statusBadge} data-status={order.status}>
                                            <StatusIcon /> {statusInfo.label}
                                        </span>
                                    </div>

                                    <div className={styles.orderItems}>
                                        {order.items?.slice(0, 3).map((item, idx) => (
                                            <span key={idx}>
                                                {item.quantity}x {item.name}
                                                {idx < Math.min(order.items.length, 3) - 1 && ', '}
                                            </span>
                                        ))}
                                        {order.items?.length > 3 && (
                                            <span> +{order.items.length - 3} more</span>
                                        )}
                                    </div>

                                    <div className={styles.orderFooter}>
                                        <div className={styles.orderMeta}>
                                            <span className={styles.orderDate}>
                                                <FiClock /> {formatDate(order.createdAt)}
                                            </span>
                                            <span className={styles.orderTotal}>₹{order.total}</span>
                                        </div>
                                        <FiChevronRight className={styles.chevron} />
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
