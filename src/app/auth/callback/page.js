'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setUser } = useAuth();
    const [status, setStatus] = useState('Processing...');

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (accessToken && refreshToken) {
            // Save tokens
            Cookies.set('accessToken', accessToken, { expires: 7 });
            Cookies.set('refreshToken', refreshToken, { expires: 30 });

            setStatus('Login successful! Redirecting...');

            // Fetch user data and redirect
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setUser(data.data.user);
                    }
                    router.push('/');
                })
                .catch(() => {
                    router.push('/');
                });
        } else {
            setStatus('Authentication failed. Redirecting...');
            setTimeout(() => router.push('/login'), 2000);
        }
    }, [searchParams, router, setUser]);

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.spinner}></div>
                <p>{status}</p>
            </div>
        </div>
    );
}
