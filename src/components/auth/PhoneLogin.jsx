'use client';

import { useState, useEffect, useRef } from 'react';
import { FiPhone, FiArrowRight, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { setupRecaptcha, sendOTP, verifyOTP } from '@/lib/firebase';
import styles from './PhoneLogin.module.css';

export default function PhoneLogin({ onSuccess, onBack }) {
    const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'verifying'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);
    const otpInputs = useRef([]);
    const recaptchaRef = useRef(null);

    useEffect(() => {
        // Setup reCAPTCHA when component mounts
        if (recaptchaRef.current) {
            setupRecaptcha('recaptcha-container');
        }
    }, []);

    useEffect(() => {
        // Countdown timer for resend
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendOTP = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Reinitialize recaptcha if needed
            setupRecaptcha('recaptcha-container');

            const result = await sendOTP(phoneNumber);

            if (result.success) {
                setStep('otp');
                setCountdown(30);
            } else {
                setError(result.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Failed to send OTP. Please try again.');
        }

        setLoading(false);
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) {
            value = value.slice(-1);
        }

        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpInputs.current[index + 1]?.focus();
        }

        // Auto-verify when all digits entered
        if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
            handleVerifyOTP(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async (otpCode = otp.join('')) => {
        if (otpCode.length !== 6) {
            setError('Please enter the 6-digit OTP');
            return;
        }

        setStep('verifying');
        setError('');

        try {
            const result = await verifyOTP(otpCode);

            if (result.success) {
                onSuccess?.(result.user);
            } else {
                setError(result.message || 'Invalid OTP');
                setStep('otp');
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
            setStep('otp');
        }
    };

    const handleResendOTP = async () => {
        if (countdown > 0) return;

        setOtp(['', '', '', '', '', '']);
        await handleSendOTP();
    };

    return (
        <div className={styles.container}>
            {/* Hidden reCAPTCHA container */}
            <div id="recaptcha-container" ref={recaptchaRef}></div>

            {step === 'phone' && (
                <div className={styles.phoneStep}>
                    <div className={styles.iconWrapper}>
                        <FiPhone />
                    </div>
                    <h3>Login with Phone</h3>
                    <p>We'll send you a 6-digit verification code</p>

                    <div className={styles.phoneInput}>
                        <span className={styles.countryCode}>+91</span>
                        <input
                            type="tel"
                            placeholder="Enter mobile number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            maxLength={10}
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button
                        className={styles.submitBtn}
                        onClick={handleSendOTP}
                        disabled={loading || phoneNumber.length < 10}
                    >
                        {loading ? 'Sending...' : 'Send OTP'}
                        {!loading && <FiArrowRight />}
                    </button>

                    {onBack && (
                        <button className={styles.backBtn} onClick={onBack}>
                            Back to other options
                        </button>
                    )}
                </div>
            )}

            {step === 'otp' && (
                <div className={styles.otpStep}>
                    <div className={styles.iconWrapper}>
                        <FiCheck />
                    </div>
                    <h3>Verify OTP</h3>
                    <p>Enter the code sent to +91 {phoneNumber}</p>

                    <div className={styles.otpInputs}>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (otpInputs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button
                        className={styles.submitBtn}
                        onClick={() => handleVerifyOTP()}
                        disabled={otp.join('').length !== 6}
                    >
                        Verify & Login
                        <FiArrowRight />
                    </button>

                    <div className={styles.resendRow}>
                        <span>Didn't receive OTP?</span>
                        <button
                            className={styles.resendBtn}
                            onClick={handleResendOTP}
                            disabled={countdown > 0}
                        >
                            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                            {countdown === 0 && <FiRefreshCw />}
                        </button>
                    </div>

                    <button className={styles.changeNum} onClick={() => setStep('phone')}>
                        Change phone number
                    </button>
                </div>
            )}

            {step === 'verifying' && (
                <div className={styles.verifyingStep}>
                    <div className={styles.spinner}></div>
                    <h3>Verifying...</h3>
                    <p>Please wait while we verify your OTP</p>
                </div>
            )}
        </div>
    );
}
