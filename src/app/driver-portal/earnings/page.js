'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiDollarSign, FiCalendar, FiBriefcase, FiArrowUpRight, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function DriverEarnings() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    // Demo Data for Earnings
    const [stats, setStats] = useState({
        today: 850,
        week: 5400,
        month: 22500,
        totalDeliveries: 42,
        pendingPayout: 2100,
    });

    const [transactions, setTransactions] = useState([
        { id: 1, type: 'payout', amount: 4500, date: '2024-12-25', status: 'completed' },
        { id: 2, type: 'earning', amount: 85, date: '2024-12-28', status: 'completed', desc: 'Delivery #FD-2024-001' },
        { id: 3, type: 'earning', amount: 62, date: '2024-12-28', status: 'completed', desc: 'Delivery #FD-2024-002' },
        { id: 4, type: 'earning', amount: 95, date: '2024-12-27', status: 'completed', desc: 'Delivery #FD-2024-003' },
    ]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
        if (!authLoading && user && user.role !== 'driver') {
            router.push('/');
        }
    }, [isAuthenticated, authLoading, user, router]);

    if (authLoading) {
        return <div className={styles.loading}><div className={styles.spinner}></div></div>;
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Link href="/driver-portal" className={styles.backBtn}>
                    <FiArrowLeft /> Back to Dashboard
                </Link>
                <h1>earnings</h1>
                <div className={styles.balanceCard}>
                    <span className={styles.balanceLabel}>Weekly Earnings</span>
                    <h2 className={styles.balanceAmount}>₹{stats.week}</h2>
                    <div className={styles.balanceMeta}>
                        <span><FiBriefcase /> {stats.totalDeliveries} Deliveries</span>
                        <span className={styles.trend}><FiTrendingUp /> +12%</span>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#e3f2fd', color: '#2196f3' }}>
                            <FiDollarSign />
                        </div>
                        <div className={styles.statInfo}>
                            <span>Today</span>
                            <strong>₹{stats.today}</strong>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#f3e5f5', color: '#9c27b0' }}>
                            <FiCalendar />
                        </div>
                        <div className={styles.statInfo}>
                            <span>This Month</span>
                            <strong>₹{stats.month}</strong>
                        </div>
                    </div>
                </div>

                <div className={styles.payoutSection}>
                    <div className={styles.payoutHeader}>
                        <h3>Recent Activity</h3>
                        <span className={styles.pendingBadge}>Pending: ₹{stats.pendingPayout}</span>
                    </div>

                    <div className={styles.transactionsList}>
                        {transactions.map(tx => (
                            <div key={tx.id} className={styles.transactionItem}>
                                <div className={styles.txIcon} style={{
                                    background: tx.type === 'payout' ? '#e8f5e9' : '#fff3e0',
                                    color: tx.type === 'payout' ? '#2e7d32' : '#f57c00'
                                }}>
                                    {tx.type === 'payout' ? <FiArrowUpRight /> : <FiDollarSign />}
                                </div>
                                <div className={styles.txInfo}>
                                    <h4>{tx.type === 'payout' ? 'Weekly Payout' : tx.desc}</h4>
                                    <span>{new Date(tx.date).toLocaleDateString()}</span>
                                </div>
                                <div className={styles.txAmount}>
                                    <span className={tx.type === 'payout' ? styles.minus : styles.plus}>
                                        {tx.type === 'payout' ? '-' : '+'}₹{tx.amount}
                                    </span>
                                    <span className={styles.txStatus}>{tx.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
