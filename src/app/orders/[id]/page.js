'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiMapPin, FiPhone, FiArchive, FiCheck, FiTruck, FiShoppingBag, FiClock, FiX } from 'react-icons/fi';
import { orderAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

// Leaflet Imports
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then(mod => mod.useMap), { ssr: false });

// Map View Handler
function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (map && center && typeof map.flyTo === 'function') {
            map.flyTo(center, 15);
        } else if (map && center && typeof map.setView === 'function') {
            map.setView(center, 15);
        }
    }, [center, map]);
    return null;
}

// Marker Display
function DisplayMarker({ position }) {
    const [icon, setIcon] = useState(null);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const L = require('leaflet');
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
            setIcon(true);
        }
    }, []);

    if (!icon || !position) return null;

    return <Marker position={position} />;
}

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch Order
    useEffect(() => {
        const fetchOrder = async () => {
            if (!params.id) return;
            try {
                // In a real app, you would fetch from API
                // const response = await orderAPI.getById(params.id);
                // setOrder(response.data.data.order);

                // For Demo: Use dummy data if API fails or for demo IDs
                if (params.id.startsWith('demo-') || params.id) {
                    // Try to fetch real order first
                    try {
                        const response = await orderAPI.getById(params.id);
                        if (response.data.success) {
                            setOrder(response.data.data.order);
                            setLoading(false);
                            return;
                        }
                    } catch (e) {
                        // Fallback to demo data
                        console.warn('Using demo order data');
                    }

                    setOrder({
                        _id: params.id,
                        orderNumber: 'FD-2024-' + params.id.slice(-4),
                        restaurant: {
                            name: 'Spice Garden',
                            address: '123, Food Street, Bangalore',
                            image: null
                        },
                        items: [
                            { name: 'Butter Chicken', quantity: 1, price: 320, isVeg: false },
                            { name: 'Garlic Naan', quantity: 2, price: 60, isVeg: true },
                            { name: 'Jeera Rice', quantity: 1, price: 180, isVeg: true }
                        ],
                        total: 620,
                        deliveryFee: 40,
                        tax: 31,
                        grandTotal: 691,
                        status: 'on_the_way', // pending, preparing, on_the_way, delivered
                        createdAt: new Date(),
                        deliveryAddress: {
                            street: '123, Main Road',
                            city: 'Bengaluru',
                            state: 'Karnataka',
                            pincode: '560001',
                            label: 'Home',
                            location: { coordinates: [77.5946, 12.9716] } // [lng, lat]
                        },
                        deliveryPerson: {
                            name: 'Ramesh Kumar',
                            phone: '9876543210'
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching order:', error);
            }
            setLoading(false);
        };

        if (isAuthenticated) {
            fetchOrder();
        }
    }, [params.id, isAuthenticated]);

    // Order Status Steps
    const steps = [
        { key: 'placed', label: 'Order Placed', icon: FiCheck },
        { key: 'confirmed', label: 'Confirmed', icon: FiShoppingBag },
        { key: 'preparing', label: 'Preparing', icon: FiArchive },
        { key: 'on_the_way', label: 'On the Way', icon: FiTruck },
        { key: 'delivered', label: 'Delivered', icon: FiMapPin },
    ];

    const getProgress = (status) => {
        const statusMap = {
            'pending': 0,
            'confirmed': 25,
            'preparing': 50,
            'on_the_way': 75,
            'delivered': 100,
            'cancelled': 0
        };
        return statusMap[status] || 0;
    };

    const getCurrentStepIndex = (status) => {
        const order = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered'];
        return order.indexOf(status);
    };

    if (loading || authLoading) {
        return <div className={styles.loading}><div className={styles.spinner}></div></div>;
    }

    if (!order) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <h1>Order not found</h1>
                    <Link href="/orders" className={styles.backBtn}>Back to Orders</Link>
                </div>
            </div>
        );
    }

    const mapCenter = order.deliveryAddress?.location?.coordinates
        ? { lat: order.deliveryAddress.location.coordinates[1], lng: order.deliveryAddress.location.coordinates[0] }
        : { lat: 12.9716, lng: 77.5946 };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <Link href="/orders" className={styles.backBtn}>
                    <FiArrowLeft /> Back to Orders
                </Link>

                {/* Hero / Status Section */}
                <div className={styles.heroSection}>
                    <div className={styles.headerTop}>
                        <div className={styles.restaurantInfo}>
                            <h1>{order.restaurant.name}</h1>
                            <p className={styles.restaurantAddress}>{order.restaurant.address}</p>
                        </div>
                        <div className={styles.orderMeta}>
                            <div className={`${styles.orderStatus} ${styles['status_' + order.status]}`}>
                                {order.status === 'on_the_way' ? 'On the Way' : order.status}
                            </div>
                            <p className={styles.orderId}>Order #{order.orderNumber}</p>
                        </div>
                    </div>

                    {/* Progress Tracker */}
                    {order.status !== 'cancelled' && (
                        <div className={styles.tracker}>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${getProgress(order.status)}%` }}
                                ></div>
                            </div>
                            <div className={styles.steps}>
                                {steps.map((step, index) => {
                                    const currentIndex = getCurrentStepIndex(order.status);
                                    const isActive = index <= currentIndex;
                                    const isCurrent = index === currentIndex;

                                    return (
                                        <div key={step.key} className={`${styles.step} ${isActive ? styles.active : ''} ${isCurrent ? styles.current : ''}`}>
                                            <div className={styles.stepIcon}>
                                                <step.icon />
                                            </div>
                                            <span className={styles.stepLabel}>{step.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.grid}>
                    {/* Left: Items Checklist */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>Order Items</div>
                        <div className={styles.itemsList}>
                            {order.items.map((item, idx) => (
                                <div key={idx} className={styles.itemRow}>
                                    <div className={item.isVeg ? styles.veg : styles.nonveg}>
                                        ●
                                    </div>
                                    <div className={styles.itemDetails}>
                                        <div className={styles.itemName}>{item.name}</div>
                                        <div className={styles.itemMeta}>
                                            <span>x{item.quantity}</span>
                                            <span>₹{item.price * item.quantity}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bill Summary */}
                        <div className={styles.totalRow}>
                            <span>Grand Total</span>
                            <span>₹{order.grandTotal || order.total}</span>
                        </div>
                    </div>

                    {/* Right: Delivery Details */}
                    <div className={styles.deliveryDetails}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>Delivery Address</div>
                            <div className={styles.detailGroup}>
                                <div className={styles.detailIcon}><FiMapPin /></div>
                                <div className={styles.detailInfo}>
                                    <h4>{order.deliveryAddress.label}</h4>
                                    <p>{order.deliveryAddress.street}</p>
                                    <p>{order.deliveryAddress.city}, {order.deliveryAddress.pincode}</p>
                                </div>
                            </div>

                            {/* Map Preview */}
                            <div className={styles.mapPreview}>
                                <MapContainer
                                    center={mapCenter}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                    dragging={false}
                                    scrollWheelZoom={false}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <ChangeView center={mapCenter} />
                                    <DisplayMarker position={mapCenter} />
                                </MapContainer>
                            </div>
                        </div>

                        {(order.driver || order.deliveryPerson) && ['picked_up', 'on_the_way'].includes(order.status) && (
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>Delivery Partner</div>
                                <div className={styles.detailGroup}>
                                    <div className={styles.detailIcon}><FiTruck /></div>
                                    <div className={styles.detailInfo}>
                                        <h4>{order.driver?.name || order.deliveryPerson?.name}</h4>
                                        <p>+91 {order.driver?.phone || order.deliveryPerson?.phone}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
