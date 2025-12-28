'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/context/AuthContext';
import styles from '../login/page.module.css';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await register(formData.name, formData.email, formData.password);
            router.push('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/google`;
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authContainer}>
                {/* Left Side - Branding */}
                <div className={styles.brandingSection}>
                    <div className={styles.brandingContent}>
                        <div className={styles.logo}>
                            <span className={styles.logoIcon}>🍕</span>
                            <span className={styles.logoText}>Fooddala</span>
                        </div>
                        <h1>Join Fooddala!</h1>
                        <p>Create an account to start ordering delicious food</p>
                        <div className={styles.features}>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>✨</span>
                                <span>Exclusive Offers</span>
                            </div>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>📦</span>
                                <span>Track Orders Live</span>
                            </div>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>❤️</span>
                                <span>Save Favorites</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className={styles.formSection}>
                    <div className={styles.formContainer}>
                        <h2>Create Account</h2>
                        <p className={styles.formSubtitle}>
                            Already have an account? <Link href="/login">Login</Link>
                        </p>

                        {error && <div className={styles.error}>{error}</div>}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label>Full Name</label>
                                <div className={styles.inputWrapper}>
                                    <FiUser className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        placeholder="Enter your name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Email</label>
                                <div className={styles.inputWrapper}>
                                    <FiMail className={styles.inputIcon} />
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
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
                                        placeholder="Create a password"
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

                            <div className={styles.inputGroup}>
                                <label>Confirm Password</label>
                                <div className={styles.inputWrapper}>
                                    <FiLock className={styles.inputIcon} />
                                    <input
                                        type="password"
                                        placeholder="Confirm your password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>

                        <div className={styles.divider}>
                            <span>or continue with</span>
                        </div>

                        <button className={styles.googleBtn} onClick={handleGoogleLogin}>
                            <FcGoogle />
                            <span>Continue with Google</span>
                        </button>

                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
                            By creating an account, you agree to our{' '}
                            <Link href="/terms" style={{ color: 'var(--primary)' }}>Terms</Link> and{' '}
                            <Link href="/privacy" style={{ color: 'var(--primary)' }}>Privacy Policy</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
