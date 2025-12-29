'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiTruck, FiShoppingBag, FiPhone } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/context/AuthContext';
import PhoneLogin from '@/components/auth/PhoneLogin';
import styles from './page.module.css';

const roleConfig = {
    customer: {
        icon: FiUser,
        label: 'Customer',
        description: 'Order food from restaurants',
        color: '#ff5722',
        redirect: '/',
        testEmail: 'customer@fooddala.com',
        testPassword: 'customer123',
    },
    restaurant: {
        icon: FiShoppingBag,
        label: 'Restaurant',
        description: 'Manage your restaurant',
        color: '#4caf50',
        redirect: '/restaurant-portal',
        testEmail: 'restaurant@fooddala.com',
        testPassword: 'restaurant123',
    },
    driver: {
        icon: FiTruck,
        label: 'Delivery Partner',
        description: 'Deliver orders & earn',
        color: '#2196f3',
        redirect: '/driver-portal',
        testEmail: 'driver@fooddala.com',
        testPassword: 'driver123',
    },
};

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [selectedRole, setSelectedRole] = useState('customer');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPhoneLogin, setShowPhoneLogin] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userData = await login(formData.email, formData.password);

            // Redirect based on user's role
            const userRole = userData?.role || 'customer';
            const redirectPath = roleConfig[userRole]?.redirect || '/';

            router.push(redirectPath);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Store selected role for after OAuth callback
        localStorage.setItem('loginRole', selectedRole);
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/google`;
    };

    // Auto-fill test credentials
    const handleAutoFill = () => {
        const config = roleConfig[selectedRole];
        setFormData({
            email: config.testEmail,
            password: config.testPassword,
        });
    };

    const RoleIcon = roleConfig[selectedRole].icon;

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
                        <p>Login to access your {roleConfig[selectedRole].label.toLowerCase()} dashboard</p>

                        {/* Role Benefits */}
                        <div className={styles.features}>
                            {selectedRole === 'customer' && (
                                <>
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
                                </>
                            )}
                            {selectedRole === 'restaurant' && (
                                <>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>📊</span>
                                        <span>Manage Orders</span>
                                    </div>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>🍽️</span>
                                        <span>Update Menu</span>
                                    </div>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>💵</span>
                                        <span>Track Earnings</span>
                                    </div>
                                </>
                            )}
                            {selectedRole === 'driver' && (
                                <>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>🏍️</span>
                                        <span>Flexible Hours</span>
                                    </div>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>💰</span>
                                        <span>Earn Daily</span>
                                    </div>
                                    <div className={styles.feature}>
                                        <span className={styles.featureIcon}>📍</span>
                                        <span>Easy Navigation</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className={styles.formSection}>
                    <div className={styles.formContainer}>
                        <h2>Login</h2>

                        {/* Role Selection Tabs */}
                        <div className={styles.roleTabs}>
                            {Object.entries(roleConfig).map(([key, config]) => {
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={key}
                                        className={`${styles.roleTab} ${selectedRole === key ? styles.active : ''}`}
                                        onClick={() => setSelectedRole(key)}
                                        style={{ '--role-color': config.color }}
                                    >
                                        <Icon />
                                        <span>{config.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <p className={styles.formSubtitle}>
                            Don't have an account?{' '}
                            <Link href={selectedRole === 'customer' ? '/register' : `/register/${selectedRole}`}>
                                Sign up as {roleConfig[selectedRole].label}
                            </Link>
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
                                        autoComplete="email"
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
                                        autoComplete="current-password"
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

                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={loading}
                                style={{ '--btn-color': roleConfig[selectedRole].color }}
                            >
                                {loading ? 'Logging in...' : `Login as ${roleConfig[selectedRole].label}`}
                            </button>

                            {/* Test Credentials Auto-Fill */}
                            <button
                                type="button"
                                className={styles.testCredBtn}
                                onClick={handleAutoFill}
                            >
                                🧪 Fill Test Credentials ({roleConfig[selectedRole].label})
                            </button>
                        </form>

                        {selectedRole === 'customer' && (
                            <>
                                <div className={styles.divider}>
                                    <span>or continue with</span>
                                </div>

                                {showPhoneLogin ? (
                                    <PhoneLogin
                                        onSuccess={(user) => {
                                            console.log('Phone login success:', user);
                                            // For now, redirect to home
                                            // In production, sync with backend
                                            router.push('/');
                                        }}
                                        onBack={() => setShowPhoneLogin(false)}
                                    />
                                ) : (
                                    <div className={styles.socialButtons}>
                                        <button className={styles.googleBtn} onClick={handleGoogleLogin}>
                                            <FcGoogle />
                                            <span>Continue with Google</span>
                                        </button>
                                        <button className={styles.phoneBtn} onClick={() => setShowPhoneLogin(true)}>
                                            <FiPhone />
                                            <span>Continue with Phone</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Admin Link */}
                        <p className={styles.adminLink}>
                            <Link href="/admin/login">Admin Login →</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
