'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function AdminLoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userData = await login(formData.email, formData.password);

            // Check if user is admin
            if (userData.role !== 'admin') {
                setError('Access denied. Admin privileges required.');
                setLoading(false);
                return;
            }

            router.push('/admin');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.adminLoginPage}>
            <div className={styles.loginCard}>
                <div className={styles.logoSection}>
                    <div className={styles.shieldIcon}>
                        <FiShield />
                    </div>
                    <h1>Admin Portal</h1>
                    <p>Fooddala Administration</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>Email</label>
                        <div className={styles.inputWrapper}>
                            <FiMail className={styles.inputIcon} />
                            <input
                                type="email"
                                placeholder="admin@fooddala.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Password</label>
                        <div className={styles.inputWrapper}>
                            <FiLock className={styles.inputIcon} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Login to Admin Panel'}
                    </button>

                    {/* Test Credentials Auto-Fill */}
                    <button
                        type="button"
                        className={styles.testCredBtn}
                        onClick={() => setFormData({ email: 'admin@fooddala.com', password: 'admin123' })}
                    >
                        🧪 Fill Admin Test Credentials
                    </button>
                </form>

                <Link href="/login" className={styles.backLink}>
                    ← Back to regular login
                </Link>
            </div>
        </div>
    );
}
