'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave, FiClock, FiMapPin, FiPhone, FiMail, FiDollarSign, FiImage } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function RestaurantSettings() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [settings, setSettings] = useState({
        name: 'My Restaurant',
        description: 'Delicious food delivered to your doorstep',
        phone: '+91 9876543210',
        email: 'restaurant@fooddala.com',
        address: '123 Food Street, Bengaluru',
        cuisines: 'North Indian, Chinese',
        minimumOrder: 100,
        deliveryFee: 0,
        avgDeliveryTime: 30,
        isOpen: true,
        openTime: '10:00',
        closeTime: '22:00',
        acceptingOrders: true
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
        if (!authLoading && user && user.role !== 'restaurant') {
            router.push('/');
        }
    }, [isAuthenticated, authLoading, user, router]);

    useEffect(() => {
        // Load saved settings
        const savedSettings = localStorage.getItem('restaurantSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // In production, save to API
            // await restaurantAPI.updateSettings(settings);
            localStorage.setItem('restaurantSettings', JSON.stringify(settings));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        }
        setSaving(false);
    };

    if (authLoading) {
        return <div className={styles.loading}><div className={styles.spinner}></div></div>;
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Link href="/restaurant-portal" className={styles.backBtn}>
                    <FiArrowLeft /> Back to Dashboard
                </Link>
                <div className={styles.headerContent}>
                    <h1>Restaurant Settings</h1>
                    <button
                        className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <FiSave /> {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            </header>

            <main className={styles.main}>
                {/* Basic Info */}
                <section className={styles.section}>
                    <h2>Basic Information</h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Restaurant Name</label>
                            <input
                                type="text"
                                value={settings.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Your restaurant name"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Cuisines</label>
                            <input
                                type="text"
                                value={settings.cuisines}
                                onChange={(e) => handleChange('cuisines', e.target.value)}
                                placeholder="e.g., North Indian, Chinese"
                            />
                        </div>
                        <div className={styles.formGroupFull}>
                            <label>Description</label>
                            <textarea
                                value={settings.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Brief description of your restaurant"
                                rows={3}
                            />
                        </div>
                    </div>
                </section>

                {/* Contact Info */}
                <section className={styles.section}>
                    <h2><FiPhone /> Contact Details</h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                value={settings.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="+91 9876543210"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                value={settings.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="email@restaurant.com"
                            />
                        </div>
                        <div className={styles.formGroupFull}>
                            <label><FiMapPin /> Address</label>
                            <input
                                type="text"
                                value={settings.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                placeholder="Full address"
                            />
                        </div>
                    </div>
                </section>

                {/* Order Settings */}
                <section className={styles.section}>
                    <h2><FiDollarSign /> Order Settings</h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Minimum Order (₹)</label>
                            <input
                                type="number"
                                value={settings.minimumOrder}
                                onChange={(e) => handleChange('minimumOrder', parseInt(e.target.value))}
                                min="0"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Delivery Fee (₹)</label>
                            <input
                                type="number"
                                value={settings.deliveryFee}
                                onChange={(e) => handleChange('deliveryFee', parseInt(e.target.value))}
                                min="0"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Avg. Delivery Time (mins)</label>
                            <input
                                type="number"
                                value={settings.avgDeliveryTime}
                                onChange={(e) => handleChange('avgDeliveryTime', parseInt(e.target.value))}
                                min="10"
                            />
                        </div>
                    </div>
                </section>

                {/* Operating Hours */}
                <section className={styles.section}>
                    <h2><FiClock /> Operating Hours</h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Opening Time</label>
                            <input
                                type="time"
                                value={settings.openTime}
                                onChange={(e) => handleChange('openTime', e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Closing Time</label>
                            <input
                                type="time"
                                value={settings.closeTime}
                                onChange={(e) => handleChange('closeTime', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.toggleGroup}>
                        <div className={styles.toggleItem}>
                            <div>
                                <strong>Restaurant Status</strong>
                                <p>Turn off to mark as closed</p>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={settings.isOpen}
                                    onChange={(e) => handleChange('isOpen', e.target.checked)}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                        <div className={styles.toggleItem}>
                            <div>
                                <strong>Accepting Orders</strong>
                                <p>Pause to stop receiving new orders</p>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={settings.acceptingOrders}
                                    onChange={(e) => handleChange('acceptingOrders', e.target.checked)}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
