import Link from 'next/link';
import { FiFacebook, FiTwitter, FiInstagram, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {/* Brand Section */}
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <span className={styles.logoIcon}>🍕</span>
                            <span className={styles.logoText}>Fooddala</span>
                        </Link>
                        <p className={styles.tagline}>
                            Delivering happiness, one meal at a time. Order from the best restaurants near you.
                        </p>
                        <div className={styles.social}>
                            <a href="#" className={styles.socialLink}><FiFacebook /></a>
                            <a href="#" className={styles.socialLink}><FiTwitter /></a>
                            <a href="#" className={styles.socialLink}><FiInstagram /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className={styles.linkSection}>
                        <h4>Quick Links</h4>
                        <Link href="/restaurants">Browse Restaurants</Link>
                        <Link href="/about">About Us</Link>
                        <Link href="/contact">Contact</Link>
                        <Link href="/faq">FAQs</Link>
                    </div>

                    {/* For Restaurants */}
                    <div className={styles.linkSection}>
                        <h4>For Restaurants</h4>
                        <Link href="/partner">Partner with us</Link>
                        <Link href="/restaurant/register">Register Restaurant</Link>
                        <Link href="/restaurant/login">Restaurant Login</Link>
                    </div>

                    {/* Contact */}
                    <div className={styles.linkSection}>
                        <h4>Contact Us</h4>
                        <div className={styles.contactItem}>
                            <FiMail />
                            <span>support@fooddala.com</span>
                        </div>
                        <div className={styles.contactItem}>
                            <FiPhone />
                            <span>+91 1234567890</span>
                        </div>
                        <div className={styles.contactItem}>
                            <FiMapPin />
                            <span>Bengaluru, Karnataka</span>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>© 2024 Fooddala. All rights reserved.</p>
                    <div className={styles.legal}>
                        <Link href="/privacy">Privacy Policy</Link>
                        <Link href="/terms">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
