'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function LoginPage() {
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
            await login(formData.email, formData.password);
            router.push('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
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
                        <h1>Welcome Back!</h1>
                        <p>Login to order delicious food from your favorite restaurants</p>
                        <div className={styles.features}>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>🚀</span>
                                <span>Fast Delivery</span>
                            </div>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>🍔</span>
                                <span>500+ Restaurants</span>
                            </div>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>💰</span>
                                <span>Best Prices</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className={styles.formSection}>
                    <div className={styles.formContainer}>
                        <h2>Login</h2>
                        <p className={styles.formSubtitle}>
                            Don't have an account? <Link href="/register">Sign up</Link>
                        </p>

                        {error && <div className={styles.error}>{error}</div>}

                        <form onSubmit={handleSubmit} className={styles.form}>
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
                                        placeholder="Enter your password"
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

                            <div className={styles.formOptions}>
                                <label className={styles.checkbox}>
                                    <input type="checkbox" />
                                    <span>Remember me</span>
                                </label>
                                <Link href="/forgot-password" className={styles.forgotLink}>
                                    Forgot password?
                                </Link>
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>

                        <div className={styles.divider}>
                            <span>or continue with</span>
                        </div>

                        <button className={styles.googleBtn} onClick={handleGoogleLogin}>
                            <FcGoogle />
                            <span>Continue with Google</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
