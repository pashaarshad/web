'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiUser, FiPhone, FiMail, FiTruck, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function DriverProfile() {
    const router = useRouter();
    const { user, isAuthenticated, logout, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
        if (!authLoading && user && user.role !== 'driver') {
            router.push('/');
        }
    }, [isAuthenticated, authLoading, user, router]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (authLoading) {
        return <div className={styles.loading}><div className={styles.spinner}></div></div>;
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Link href="/driver-portal" className={styles.backBtn}>
                    <FiArrowLeft /> Back to Dashboard
                </Link>
                <h1>My Profile</h1>
            </header>

            <main className={styles.main}>
                <div className={styles.profileCard}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatar}>
                            {user?.name?.charAt(0) || 'D'}
                        </div>
                        <h2>{user?.name}</h2>
                        <span className={styles.roleBadge}>Delivery Partner</span>
                    </div>

                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <FiMail className={styles.icon} />
                            <div>
                                <label>Email</label>
                                <p>{user?.email}</p>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <FiPhone className={styles.icon} />
                            <div>
                                <label>Phone</label>
                                <p>{user?.phone || '+91 98765 43210'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Vehicle Information</h3>
                    <div className={styles.vehicleCard}>
                        <div className={styles.vehicleIcon}>
                            <FiTruck />
                        </div>
                        <div className={styles.vehicleInfo}>
                            <h4>Honda Activa</h4>
                            <p>KA 05 MN 1234</p>
                        </div>
                        <span className={styles.verifiedBadge}>
                            <FiCheckCircle /> Verified
                        </span>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Documents</h3>
                    <div className={styles.docList}>
                        <div className={styles.docItem}>
                            <span>Driving License</span>
                            <span className={styles.docStatus}>Verified</span>
                        </div>
                        <div className={styles.docItem}>
                            <span>Vehicle Insurance</span>
                            <span className={styles.docStatus}>Verified</span>
                        </div>
                        <div className={styles.docItem}>
                            <span>Pan Card</span>
                            <span className={styles.docStatus}>Verified</span>
                        </div>
                    </div>
                </div>

                <button onClick={handleLogout} className={styles.logoutBtn}>
                    Log Out
                </button>
            </main>
        </div>
    );
}
