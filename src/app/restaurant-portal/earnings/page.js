'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FiDollarSign, FiTrendingUp, FiCalendar, FiDownload,
    FiArrowLeft, FiCreditCard, FiPieChart, FiBarChart2
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function RestaurantEarnings() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [period, setPeriod] = useState('week');
    const [loading, setLoading] = useState(false);

    // Calculate scheduled payout date (6 days from now)
    const getScheduledDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 6);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Demo earnings data
    const [earnings, setEarnings] = useState({
        today: 2450,
        week: 18650,
        month: 72400,
        total: 324500,
        pendingPayout: 12500,
        lastPayout: 45000,
        lastPayoutDate: '2024-12-20',
        commission: 15,
        scheduledDate: getScheduledDate()
    });

    const [transactions, setTransactions] = useState([
        { id: 1, orderNumber: 'FD-2024-001', amount: 520, commission: 78, net: 442, date: '2024-12-28', status: 'completed' },
        { id: 2, orderNumber: 'FD-2024-002', amount: 380, commission: 57, net: 323, date: '2024-12-28', status: 'completed' },
        { id: 3, orderNumber: 'FD-2024-003', amount: 750, commission: 112, net: 638, date: '2024-12-27', status: 'completed' },
        { id: 4, orderNumber: 'FD-2024-004', amount: 290, commission: 43, net: 247, date: '2024-12-27', status: 'completed' },
        { id: 5, orderNumber: 'FD-2024-005', amount: 640, commission: 96, net: 544, date: '2024-12-26', status: 'completed' },
    ]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
        if (!authLoading && user && user.role !== 'restaurant') {
            router.push('/');
        }
    }, [isAuthenticated, authLoading, user, router]);

    if (authLoading) {
        return <div className={styles.loading}><div className={styles.spinner}></div></div>;
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Link href="/restaurant-portal" className={styles.backBtn}>
                    <FiArrowLeft /> Back to Dashboard
                </Link>
                <h1>💰 Earnings & Payouts</h1>
            </header>

            <main className={styles.main}>
                {/* Summary Cards */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}>
                            <FiDollarSign />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>₹{earnings.today.toLocaleString()}</span>
                            <span className={styles.statLabel}>Today's Earnings</span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}>
                            <FiTrendingUp />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>₹{earnings.week.toLocaleString()}</span>
                            <span className={styles.statLabel}>This Week</span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(156, 39, 176, 0.1)', color: '#9c27b0' }}>
                            <FiCalendar />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>₹{earnings.month.toLocaleString()}</span>
                            <span className={styles.statLabel}>This Month</span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }}>
                            <FiCreditCard />
                        </div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>₹{earnings.pendingPayout.toLocaleString()}</span>
                            <span className={styles.statLabel}>Pending Payout</span>
                        </div>
                    </div>
                </div>

                {/* Payout Section */}
                <section className={styles.payoutSection}>
                    <div className={styles.payoutCard}>
                        <h3>💳 Payout Information</h3>

                        {/* Dynamic Schedule Message */}
                        <div className={styles.scheduleMessage} style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
                            <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>
                                Next Payout: ₹{earnings.pendingPayout.toLocaleString()}
                            </h4>
                            <p style={{ margin: '0.5rem 0 0', color: 'rgba(255,255,255,0.8)' }}>
                                Scheduled to be received on <strong>{earnings.scheduledDate}</strong> (after 6 days)
                            </p>
                        </div>

                        <div className={styles.payoutDetails}>
                            <div className={styles.payoutItem}>
                                <span>Commission Rate</span>
                                <strong>{earnings.commission}%</strong>
                            </div>
                            <div className={styles.payoutItem}>
                                <span>Last Payout</span>
                                <strong>₹{earnings.lastPayout.toLocaleString()}</strong>
                            </div>
                            <div className={styles.payoutItem}>
                                <span>Payout Date</span>
                                <strong>{earnings.lastPayoutDate}</strong>
                            </div>
                            <div className={styles.payoutItem}>
                                <span>Total Earned</span>
                                <strong>₹{earnings.total.toLocaleString()}</strong>
                            </div>
                        </div>
                        <button className={styles.withdrawBtn}>
                            <FiDownload /> Request Withdrawal
                        </button>
                    </div>
                </section>

                {/* Transactions Table */}
                <section className={styles.transactionsSection}>
                    <div className={styles.sectionHeader}>
                        <h3>📊 Recent Transactions</h3>
                        <div className={styles.periodTabs}>
                            {['today', 'week', 'month'].map(p => (
                                <button
                                    key={p}
                                    className={`${styles.periodTab} ${period === p ? styles.active : ''}`}
                                    onClick={() => setPeriod(p)}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Commission</th>
                                    <th>Net Earning</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(tx => (
                                    <tr key={tx.id}>
                                        <td><strong>{tx.orderNumber}</strong></td>
                                        <td>{tx.date}</td>
                                        <td>₹{tx.amount}</td>
                                        <td className={styles.commission}>-₹{tx.commission}</td>
                                        <td className={styles.netEarning}>₹{tx.net}</td>
                                        <td>
                                            <span className={`${styles.status} ${styles[tx.status]}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}
