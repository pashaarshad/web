'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FiMapPin, FiNavigation, FiPackage, FiDollarSign, FiClock,
    FiCheck, FiX, FiRefreshCcw
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/services/api';
import styles from './page.module.css';

// Leaflet Imports
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

// Fix Leaflet marker
const MarkerIcon = () => {
    if (typeof window !== 'undefined') {
        const L = require('leaflet');
        return new L.Icon({
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
        });
    }
    return null;
};

export default function DriverAvailableOrders() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [driverLocation, setDriverLocation] = useState(null);

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
            // Get location
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => console.error(err)
            );
            fetchOrders();
        }
    }, [isAuthenticated, authLoading, user, router]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await orderAPI.getAvailableOrders();
            if (response.data.success) {
                setOrders(response.data.data.orders);
            }
        } catch (error) {
            console.error('Error fetching available orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOrder = async (orderId) => {
        try {
            await orderAPI.acceptOrder(orderId);
            alert('Order Accepted! Redirecting to dashboard...');
            router.push('/driver-portal');
        } catch (error) {
            console.error('Error accepting order:', error);
            alert(error.response?.data?.message || 'Failed to accept order');
        }
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
            <header className={styles.header}>
                <div>
                    <h1>Available Orders</h1>
                    <p>Orders ready for pickup in your area</p>
                </div>
                <button className={styles.refreshBtn} onClick={fetchOrders}>
                    <FiRefreshCcw /> Refresh
                </button>
            </header>

            <main className={styles.main}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📭</span>
                        <h2>No orders available right now</h2>
                        <p>Check back later or try moving to a different area.</p>
                    </div>
                ) : (
                    <div className={styles.ordersGrid}>
                        {orders.map(order => (
                            <div key={order._id} className={styles.orderCard}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.orderId}>{order.orderNumber}</span>
                                    <span className={styles.earnings}>₹{Math.floor(order.total * 0.15)} Earnings</span>
                                </div>

                                <div className={styles.routeInfo}>
                                    <div className={styles.routePoint}>
                                        <div className={styles.pointIcon} style={{ background: '#e3f2fd', color: '#1565c0' }}>🏪</div>
                                        <div>
                                            <h4>{order.restaurant.name}</h4>
                                            <p>{order.restaurant.address.street}, {order.restaurant.address.city}</p>
                                        </div>
                                    </div>
                                    <div className={styles.routeLine}></div>
                                    <div className={styles.routePoint}>
                                        <div className={styles.pointIcon} style={{ background: '#e8f5e9', color: '#2e7d32' }}>👤</div>
                                        <div>
                                            <h4>{order.customer.name}</h4>
                                            <p>{order.deliveryAddress.street}, {order.deliveryAddress.city}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.orderDetails}>
                                    <div className={styles.detailItem}>
                                        <FiPackage />
                                        <span>{order.items.length} Items</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <FiDollarSign />
                                        <span>{order.paymentMethod === 'cod' ? `Collect ₹${order.total}` : 'Prepaid'}</span>
                                    </div>
                                </div>

                                <button
                                    className={styles.acceptBtn}
                                    onClick={() => handleAcceptOrder(order._id)}
                                >
                                    Accept Order
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
