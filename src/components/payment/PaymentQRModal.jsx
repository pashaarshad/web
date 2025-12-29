'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FiX, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import styles from './PaymentQRModal.module.css';

const TIMER_DURATION = 300; // 5 minutes in seconds

export default function PaymentQRModal({
    isOpen,
    onClose,
    amount,
    orderId,
    orderNumber,
    upiId = "7760554350@axl", // Merchant UPI ID
    merchantName = "Fooddala",
    onPaymentSuccess,
    onPaymentTimeout
}) {
    const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
    const [status, setStatus] = useState('pending'); // pending, checking, success, failed, timeout

    // Generate UPI payment string
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=Order${orderNumber || orderId}`;

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Countdown timer
    useEffect(() => {
        if (!isOpen || status === 'success') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setStatus('timeout');
                    onPaymentTimeout?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, status, onPaymentTimeout]);

    // Reset timer when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeLeft(TIMER_DURATION);
            setStatus('pending');
        }
    }, [isOpen]);

    // Handle manual confirmation (for demo/testing)
    const handleConfirmPayment = () => {
        setStatus('checking');
        // Simulate payment verification
        setTimeout(() => {
            setStatus('success');
            setTimeout(() => {
                onPaymentSuccess?.();
            }, 1500);
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <h2>Scan & Pay</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {status === 'pending' && (
                        <>
                            {/* Timer */}
                            <div className={styles.timerSection}>
                                <FiClock className={styles.timerIcon} />
                                <span className={styles.timerText}>
                                    Expires in <strong>{formatTime(timeLeft)}</strong>
                                </span>
                                <div className={styles.timerBar}>
                                    <div
                                        className={styles.timerProgress}
                                        style={{ width: `${(timeLeft / TIMER_DURATION) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className={styles.qrContainer}>
                                <div className={styles.qrWrapper}>
                                    <QRCodeSVG
                                        value={upiString}
                                        size={200}
                                        level="H"
                                        includeMargin={true}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                    />
                                </div>
                                <p className={styles.scanText}>Scan with any UPI app</p>
                            </div>

                            {/* Amount */}
                            <div className={styles.amountSection}>
                                <span className={styles.amountLabel}>Amount to Pay</span>
                                <span className={styles.amount}>₹{amount}</span>
                            </div>

                            {/* UPI Apps */}
                            <div className={styles.upiApps}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png" alt="GPay" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png" alt="PhonePe" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/512px-Paytm_Logo_%28standalone%29.svg.png" alt="Paytm" />
                                <img src="https://www.bhimupi.org.in/images/BHIM-logo.png" alt="BHIM" />
                            </div>

                            {/* Divider */}
                            <div className={styles.divider}>
                                <span>or</span>
                            </div>

                            {/* Manual Confirm Button (for testing) */}
                            <button className={styles.confirmBtn} onClick={handleConfirmPayment}>
                                I've Completed Payment
                            </button>
                        </>
                    )}

                    {status === 'checking' && (
                        <div className={styles.statusSection}>
                            <div className={styles.spinner}></div>
                            <h3>Verifying Payment...</h3>
                            <p>Please wait while we confirm your payment</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className={styles.statusSection}>
                            <FiCheckCircle className={styles.successIcon} />
                            <h3>Payment Successful!</h3>
                            <p>Your order has been confirmed</p>
                        </div>
                    )}

                    {status === 'timeout' && (
                        <div className={styles.statusSection}>
                            <FiAlertCircle className={styles.timeoutIcon} />
                            <h3>Payment Expired</h3>
                            <p>The QR code has expired. Please try again.</p>
                            <button
                                className={styles.retryBtn}
                                onClick={() => {
                                    setTimeLeft(TIMER_DURATION);
                                    setStatus('pending');
                                }}
                            >
                                Generate New QR
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <div className={styles.secureNote}>
                        <span>🔒</span> Secured by UPI
                    </div>
                </div>
            </div>
        </>
    );
}
