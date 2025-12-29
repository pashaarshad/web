import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCQckXQZm423HekTNuO6u7nBUZ9gneKyw4",
    authDomain: "fooddala-otp.firebaseapp.com",
    projectId: "fooddala-otp",
    storageBucket: "fooddala-otp.firebasestorage.app",
    messagingSenderId: "476565755708",
    appId: "1:476565755708:web:db021d5f07361b8efcb039",
    measurementId: "G-VZJV20JY5P"
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Setup invisible reCAPTCHA
export const setupRecaptcha = (containerId) => {
    if (typeof window !== 'undefined') {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
                size: 'invisible',
                callback: () => {
                    console.log('reCAPTCHA verified');
                },
                'expired-callback': () => {
                    console.log('reCAPTCHA expired');
                }
            });
        }
    }
    return window.recaptchaVerifier;
};

// Send OTP to phone number
export const sendOTP = async (phoneNumber) => {
    try {
        const recaptchaVerifier = window.recaptchaVerifier;
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
        window.confirmationResult = confirmationResult;
        return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
        console.error('Error sending OTP:', error);
        return { success: false, message: error.message };
    }
};

// Verify OTP
export const verifyOTP = async (otp) => {
    try {
        const result = await window.confirmationResult.confirm(otp);
        const user = result.user;
        return {
            success: true,
            user: {
                uid: user.uid,
                phoneNumber: user.phoneNumber,
            }
        };
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return { success: false, message: 'Invalid OTP. Please try again.' };
    }
};

export { auth };
