'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FiMapPin, FiCreditCard, FiCheck, FiPlus, FiClock, FiHome, FiBriefcase, FiX, FiArrowLeft, FiNavigation } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { orderAPI, userAPI } from '@/services/api';
import PaymentQRModal from '@/components/payment/PaymentQRModal';
import styles from './page.module.css';

// Leaflet Imports (Dynamic import to avoid SSR issues)
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then(mod => mod.useMap), { ssr: false });
const useMapEvents = dynamic(() => import('react-leaflet').then(mod => mod.useMapEvents), { ssr: false });

const defaultCenter = {
    lat: 12.9716,
    lng: 77.5946,
};

const loadScript = (src) => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

// Fix Leaflet marker icon issue
const MarkerIcon = () => {
    // Only run on client side
    if (typeof window !== 'undefined') {
        const L = require('leaflet');
        return new L.Icon({
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
    }
    return null;
};

// Component to handle map view updates
function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (map && center && typeof map.flyTo === 'function') {
            map.flyTo(center, 16);
        } else if (map && center && typeof map.setView === 'function') {
            map.setView(center, 16);
        }
    }, [center, map]);
    return null;
}

// Component for draggable marker
function DraggableMarker({ position, setPosition, onDragEnd }) {
    const markerRef = useRef(null);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const newPos = marker.getLatLng();
                    setPosition(newPos);
                    onDragEnd(newPos);
                }
            },
        }),
        [onDragEnd, setPosition],
    );

    // Fix for Leaflet default icon not showing
    const [icon, setIcon] = useState(null);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const L = require('leaflet');
            // Fix for default marker icon
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
            setIcon(true);
        }
    }, []);

    if (!icon) return null;

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        />
    );
}

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, getCartTotal, clearCart } = useCart();
    const { user, isAuthenticated, loading: authLoading, setUser } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Add Address Modal State
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [markerPosition, setMarkerPosition] = useState(defaultCenter);
    const [mapCenter, setMapCenter] = useState(defaultCenter);

    const [newAddress, setNewAddress] = useState({
        street: '',
        city: '',
        state: '',
        pincode: '',
        doorFlat: '',
        landmark: '',
        label: 'home',
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (user?.addresses) {
            setAddresses(user.addresses);
            if (user.addresses.length > 0) {
                const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
                setSelectedAddress(defaultAddr._id);
            }
        }
    }, [user]);

    useEffect(() => {
        if (cart.items.length === 0 && !orderPlaced) {
            router.push('/restaurants');
        }
    }, [cart.items, orderPlaced, router]);

    // Reverse geocode to get address from coordinates (using free OpenStreetMap Nominatim)
    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
            );
            const data = await response.json();

            if (data && data.address) {
                const addr = data.address;

                // Build street from available components
                let street = '';
                if (addr.road) street = addr.road;
                if (addr.neighbourhood) street = addr.neighbourhood + (street ? ', ' + street : '');
                if (addr.suburb) street = addr.suburb + (street ? ', ' + street : '');

                // If still no street, use display name
                if (!street && data.display_name) {
                    street = data.display_name.split(',').slice(0, 2).join(', ');
                }

                setNewAddress(prev => ({
                    ...prev,
                    street: street || '',
                    city: addr.city || addr.town || addr.village || addr.county || '',
                    state: addr.state || '',
                    pincode: addr.postcode || '',
                }));
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
    };

    // Handle marker drag end
    const handleMarkerDragEnd = useCallback((newPos) => {
        setMarkerPosition(newPos);
        reverseGeocode(newPos.lat, newPos.lng);
    }, []);

    // Get current location
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const newPos = { lat: latitude, lng: longitude };
                setMarkerPosition(newPos);
                setMapCenter(newPos);
                reverseGeocode(latitude, longitude);
                setLocationLoading(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Could not get your location. Please allow location access or drag the pin.');
                setLocationLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    // Open add address modal and get location
    const handleAddNewAddress = () => {
        setShowAddressModal(true);
        // Get location when modal opens
        setTimeout(() => {
            getCurrentLocation();
        }, 500);
    };

    // Save address
    const handleSaveAddress = async () => {
        if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
            alert('Please fill in all required address fields');
            return;
        }

        setLoading(true);
        try {
            const addressData = {
                label: newAddress.label,
                street: newAddress.doorFlat
                    ? `${newAddress.doorFlat}, ${newAddress.street}`
                    : newAddress.street,
                city: newAddress.city,
                state: newAddress.state,
                pincode: newAddress.pincode,
                landmark: newAddress.landmark || '',
                location: {
                    type: 'Point',
                    coordinates: [markerPosition.lng, markerPosition.lat],
                },
            };

            const response = await userAPI.addAddress(addressData);
            const newAddresses = response.data.data.addresses;
            setAddresses(newAddresses);

            // Select the newly added address
            if (newAddresses.length > 0) {
                setSelectedAddress(newAddresses[newAddresses.length - 1]._id);
            }

            setShowAddressModal(false);
            setNewAddress({
                street: '',
                city: '',
                state: '',
                pincode: '',
                doorFlat: '',
                landmark: '',
                label: 'home',
            });
        } catch (error) {
            console.error('Error saving address:', error);
            alert('Failed to save address: ' + (error.response?.data?.message || 'Unknown error'));
        }
        setLoading(false);
    };

    const subtotal = getCartTotal();
    const deliveryFee = 0; // Free delivery for testing
    const tax = 0; // No tax for testing
    const total = subtotal + deliveryFee + tax;

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            alert('Please select a delivery address');
            return;
        }

        if (!cart.restaurant?._id) {
            console.error('Restaurant ID missing in cart:', cart);
            alert('Error: Restaurant information missing. Please clear cart and try again.');
            return;
        }

        setLoading(true);

        // Validation check for items
        const validItems = cart.items.every(item => item.menuItem?._id || item._id);
        if (!validItems) {
            console.error('Invalid items in cart:', cart.items);
            alert('Error: Some items in cart are invalid. Please clear cart and add items again.');
            setLoading(false);
            return;
        }

        // Create demo order structure
        const demoOrder = {
            _id: 'order-' + Date.now().toString().slice(-6),
            orderNumber: 'FD-' + Date.now().toString().slice(-6),
            total: total,
            createdAt: new Date(),
            status: 'confirmed',
            items: cart.items,
            restaurant: cart.restaurant
        };

        // Helper to check if ID is MongoID (24 hex chars)
        const isMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

        // Check if we are using demo data (non-MongoIDs)
        const isDemoData = !isMongoId(cart.restaurant._id) ||
            cart.items.some(item => !isMongoId(item.menuItem?._id || item._id));

        if (isDemoData) {
            console.log('Detected demo data (invalid MongoIDs), processing as local demo order...');

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For Online Payment - Show QR Modal
            if (paymentMethod === 'online') {
                setOrderId(demoOrder._id);
                setOrderDetails(demoOrder);
                setShowPaymentModal(true);
            } else {
                // COD - Success
                setOrderId(demoOrder._id);
                setOrderDetails(demoOrder);
                setOrderPlaced(true);
                clearCart();
            }
            setLoading(false);
            return;
        }

        // For Online Payment - Show QR Modal immediately
        if (paymentMethod === 'online') {
            setOrderId(demoOrder._id);
            setOrderDetails(demoOrder);
            setShowPaymentModal(true);
            setLoading(false);
            return;
        }

        // For COD - Real Backend Call
        try {
            const address = addresses.find(a => a._id === selectedAddress);

            const orderData = {
                restaurantId: cart.restaurant._id,
                items: cart.items.map(item => ({
                    menuItemId: item.menuItem?._id || item._id,
                    quantity: item.quantity,
                    customizations: item.customizations || [],
                    specialInstructions: item.specialInstructions || ''
                })),
                amount: total,
                deliveryAddress: {
                    label: address?.label || 'home',
                    street: address?.street || 'Demo Street',
                    city: address?.city || 'Bengaluru',
                    state: address?.state || 'Karnataka',
                    pincode: address?.pincode || '560001',
                    phone: address?.phone || user?.phone || '',
                    location: address?.location
                },
                deliveryAddressId: address?._id,
                paymentMethod: paymentMethod,
            };

            console.log('Sending order payload:', JSON.stringify(orderData, null, 2));

            const response = await orderAPI.create(orderData);

            if (response.data.success) {
                const { order, payment } = response.data.data;

                // Online Payment - Use Razorpay Checkout (Auto-Verified)
                if (paymentMethod === 'online' && payment && payment.razorpayKeyId) {
                    // ... (Razorpay logic same as before)
                    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
                    if (!res) {
                        alert('Payment gateway failed to load');
                        setLoading(false);
                        return;
                    }

                    const options = {
                        key: payment.razorpayKeyId,
                        amount: payment.amount,
                        currency: payment.currency,
                        name: "Fooddala",
                        description: "Order #" + order.orderNumber,
                        order_id: payment.razorpayOrderId,
                        handler: async function (response) {
                            try {
                                await orderAPI.verifyPayment(order._id, {
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpaySignature: response.razorpay_signature
                                });
                                setOrderId(order._id);
                                setOrderDetails(order);
                                setOrderPlaced(true);
                                clearCart();
                            } catch (err) {
                                console.error(err);
                                alert('Payment verification failed');
                            }
                        },
                        prefill: {
                            name: user?.name,
                            email: user?.email,
                            contact: user?.phone
                        },
                        theme: { color: "#ff4757" },
                        config: {
                            display: {
                                blocks: {
                                    upi: {
                                        name: "Pay using UPI",
                                        instruments: [{ method: "upi" }]
                                    }
                                },
                                sequence: ["block.upi"],
                                preferences: { show_default_blocks: true }
                            }
                        }
                    };
                    const paymentObject = new window.Razorpay(options);
                    paymentObject.open();
                }
                // Online but no Razorpay - Show QR Modal
                else if (paymentMethod === 'online') {
                    setOrderId(order._id);
                    setOrderDetails(order);
                    setShowPaymentModal(true);
                }
                // COD - Direct Success
                else {
                    setOrderId(order._id);
                    setOrderDetails(order);
                    setOrderPlaced(true);
                    clearCart();
                }
            }
        } catch (error) {
            console.error('Order error full object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
            console.error('Order error response:', error.response);

            const errorMsg = error.response?.data?.message || error.message || 'Order failed';

            // Only show alert for specific errors
            if (error.response?.status === 400 || error.response?.status === 404) {
                alert(`Order Failed: ${errorMsg}`);
                setLoading(false);
                return;
            }

            // Fallback for network errors or other issues
            console.warn('Network error or server unavailable, using fallback demo order.');
            setOrderId(demoOrder._id);
            setOrderDetails(demoOrder);
            setOrderPlaced(true);
            clearCart();
        }
        setLoading(false);
    };

    if (authLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (orderPlaced) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.successCard}>
                        <div className={styles.successIcon}>
                            <FiCheck />
                        </div>
                        <h1>Order Placed Successfully!</h1>
                        <p>Your order has been confirmed and will be delivered soon.</p>
                        <div className={styles.orderInfo}>
                            <span>Order ID: {orderId}</span>
                            <strong style={{ display: 'block', marginTop: '10px', fontSize: '1.2rem', color: '#27ae60' }}>
                                Total Paid: ₹{orderDetails?.total || 0}
                            </strong>
                            <div style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
                                <span style={{ display: 'block', color: '#666', fontSize: '0.9rem' }}>Estimated Arrival</span>
                                <strong style={{ color: '#333' }}>
                                    {new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toDateString()}
                                </strong>
                                <span style={{ display: 'block', fontSize: '0.8rem', color: '#999' }}>(Receive after 6 days)</span>
                            </div>
                        </div>
                        <div className={styles.successActions}>
                            <button onClick={() => router.push('/orders')} className={styles.primaryBtn}>
                                Track Order
                            </button>
                            <button onClick={() => router.push('/')} className={styles.secondaryBtn}>
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Back Button */}
                <button className={styles.backBtn} onClick={() => router.back()}>
                    <FiArrowLeft /> Back
                </button>

                <h1 className={styles.title}>Checkout</h1>

                <div className={styles.layout}>
                    {/* Left - Steps */}
                    <div className={styles.stepsSection}>
                        {/* Step 1: Delivery Address */}
                        <div className={`${styles.stepCard} ${step >= 1 ? styles.active : ''}`}>
                            <div className={styles.stepHeader} onClick={() => setStep(1)}>
                                <div className={styles.stepIcon}>
                                    <FiMapPin />
                                </div>
                                <div className={styles.stepInfo}>
                                    <h3>Select delivery address</h3>
                                    {addresses.length > 0 && (
                                        <p>You have {addresses.length} saved address{addresses.length > 1 ? 'es' : ''}</p>
                                    )}
                                </div>
                            </div>

                            {step === 1 && (
                                <div className={styles.stepContent}>
                                    <div className={styles.addressGrid}>
                                        {/* Existing Addresses */}
                                        {addresses.map((address) => (
                                            <div
                                                key={address._id}
                                                className={`${styles.addressCard} ${selectedAddress === address._id ? styles.selected : ''}`}
                                                onClick={() => setSelectedAddress(address._id)}
                                            >
                                                <div className={styles.addressIcon}>
                                                    <FiMapPin />
                                                </div>
                                                <div className={styles.addressContent}>
                                                    <span className={styles.addressLabel}>
                                                        {address.label?.charAt(0).toUpperCase() + address.label?.slice(1)}
                                                    </span>
                                                    <p>{address.street}</p>
                                                    <p>{address.city}, {address.state} {address.pincode}</p>
                                                </div>
                                                {selectedAddress === address._id && (
                                                    <button
                                                        className={styles.deliverHereBtn}
                                                        onClick={() => setStep(2)}
                                                    >
                                                        DELIVER HERE
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {/* Add New Address Card */}
                                        <div
                                            className={`${styles.addressCard} ${styles.addNewCard}`}
                                            onClick={handleAddNewAddress}
                                        >
                                            <div className={styles.addNewIcon}>
                                                <FiPlus />
                                            </div>
                                            <div className={styles.addressContent}>
                                                <span className={styles.addNewLabel}>Add New Address</span>
                                                <p>Use map to select location</p>
                                            </div>
                                            <button className={styles.addNewBtn}>
                                                ADD NEW
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Payment Method */}
                        <div className={`${styles.stepCard} ${step >= 2 ? styles.active : ''}`}>
                            <div className={styles.stepHeader} onClick={() => step >= 2 && setStep(2)}>
                                <div className={styles.stepIcon}>
                                    <FiCreditCard />
                                </div>
                                <div className={styles.stepInfo}>
                                    <h3>Payment</h3>
                                    {step > 2 && (
                                        <p>{paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                                    )}
                                </div>
                            </div>

                            {step === 2 && (
                                <div className={styles.stepContent}>
                                    <div className={styles.paymentOptions}>
                                        <label className={`${styles.paymentOption} ${paymentMethod === 'cod' ? styles.selected : ''}`}>
                                            <input
                                                type="radio"
                                                name="payment"
                                                checked={paymentMethod === 'cod'}
                                                onChange={() => setPaymentMethod('cod')}
                                            />
                                            <div className={styles.paymentIcon}>💵</div>
                                            <div className={styles.paymentInfo}>
                                                <h4>Cash on Delivery</h4>
                                                <p>Pay when you receive your order</p>
                                            </div>
                                        </label>

                                        <label className={`${styles.paymentOption} ${paymentMethod === 'online' ? styles.selected : ''}`}>
                                            <input
                                                type="radio"
                                                name="payment"
                                                checked={paymentMethod === 'online'}
                                                onChange={() => setPaymentMethod('online')}
                                            />
                                            <div className={styles.paymentIcon}>💳</div>
                                            <div className={styles.paymentInfo}>
                                                <h4>Online Payment</h4>
                                                <p>Pay securely with Razorpay</p>
                                            </div>
                                        </label>
                                    </div>

                                    <button
                                        className={styles.placeOrderBtn}
                                        onClick={handlePlaceOrder}
                                        disabled={loading}
                                    >
                                        {loading ? 'Placing Order...' : `Place Order • ₹${total}`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right - Order Summary */}
                    <div className={styles.summarySection}>
                        <div className={styles.summaryCard}>
                            {cart.restaurant && (
                                <div className={styles.restaurantInfo}>
                                    <span className={styles.restaurantIcon}>🍽️</span>
                                    <div>
                                        <h4>{cart.restaurant.name}</h4>
                                        <p>{cart.items.length} item{cart.items.length > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            )}

                            <div className={styles.cartItems}>
                                {cart.items.map((item, idx) => (
                                    <div key={idx} className={styles.cartItem}>
                                        <span className={styles.itemQty}>{item.quantity}x</span>
                                        <span className={styles.itemName}>{item.name}</span>
                                        <span className={styles.itemPrice}>₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.billDetails}>
                                <div className={styles.billRow}>
                                    <span>Item Total</span>
                                    <span>₹{subtotal}</span>
                                </div>
                                <div className={styles.billRow}>
                                    <span>Delivery Fee</span>
                                    <span>₹{deliveryFee}</span>
                                </div>
                                <div className={styles.billRow}>
                                    <span>GST & Other Charges</span>
                                    <span>₹{tax}</span>
                                </div>
                                <div className={`${styles.billRow} ${styles.total}`}>
                                    <span>TO PAY</span>
                                    <span>₹{total}</span>
                                </div>
                            </div>

                            <div className={styles.deliveryTime}>
                                <FiClock />
                                <span>Estimated delivery in 30-40 mins</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Address Modal with Leaflet Map */}
            {showAddressModal && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setShowAddressModal(false)} />
                    <div className={styles.addressModal}>
                        <div className={styles.modalHeader}>
                            <button className={styles.closeModal} onClick={() => setShowAddressModal(false)}>
                                <FiX />
                            </button>
                            <h3>Save delivery address</h3>
                        </div>

                        <div className={styles.modalContent}>
                            {/* Leaflet Map */}
                            <div className={styles.mapContainer}>
                                <div className={styles.dragMapHint}>Drag pin to adjust</div>
                                <MapContainer
                                    center={mapCenter}
                                    zoom={16}
                                    style={{ height: '100%', width: '100%' }}
                                    scrollWheelZoom={false}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <ChangeView center={mapCenter} />
                                    <DraggableMarker
                                        position={markerPosition}
                                        setPosition={setMarkerPosition}
                                        onDragEnd={handleMarkerDragEnd}
                                    />
                                </MapContainer>
                            </div>

                            {/* Use Current Location Button */}
                            <button
                                className={styles.locationBtn}
                                onClick={getCurrentLocation}
                                disabled={locationLoading}

                            >
                                <FiNavigation />
                                {locationLoading ? 'Getting location...' : 'Use Current Location'}
                            </button>

                            {/* Auto-filled Address */}
                            <div className={styles.addressPreview}>
                                <label>Address</label>
                                <input
                                    type="text"
                                    placeholder="Street address"
                                    value={newAddress.street}
                                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={newAddress.city}
                                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="State"
                                    value={newAddress.state}
                                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Pincode"
                                    value={newAddress.pincode}
                                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                />
                            </div>

                            {/* Door / Flat No */}
                            <input
                                type="text"
                                className={styles.fullWidth}
                                placeholder="Door / Flat No."
                                value={newAddress.doorFlat}
                                onChange={(e) => setNewAddress({ ...newAddress, doorFlat: e.target.value })}
                            />

                            {/* Landmark */}
                            <input
                                type="text"
                                className={styles.fullWidth}
                                placeholder="Landmark (optional)"
                                value={newAddress.landmark}
                                onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                            />

                            {/* Label Selection */}
                            <div className={styles.labelSelection}>
                                <button
                                    type="button"
                                    className={`${styles.labelBtn} ${newAddress.label === 'home' ? styles.active : ''}`}
                                    onClick={() => setNewAddress({ ...newAddress, label: 'home' })}
                                >
                                    <FiHome /> Home
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.labelBtn} ${newAddress.label === 'work' ? styles.active : ''}`}
                                    onClick={() => setNewAddress({ ...newAddress, label: 'work' })}
                                >
                                    <FiBriefcase /> Work
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.labelBtn} ${newAddress.label === 'other' ? styles.active : ''}`}
                                    onClick={() => setNewAddress({ ...newAddress, label: 'other' })}
                                >
                                    <FiMapPin /> Other
                                </button>
                            </div>

                            {/* Save Button */}
                            <button
                                className={styles.saveAddressBtn}
                                onClick={handleSaveAddress}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'SAVE ADDRESS & PROCEED'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Payment QR Modal */}
            <PaymentQRModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                amount={orderDetails?.total || total}
                orderId={orderId}
                orderNumber={orderDetails?.orderNumber}
                onPaymentSuccess={() => {
                    setShowPaymentModal(false);
                    setOrderPlaced(true);
                    clearCart();
                }}
                onPaymentTimeout={() => {
                    // User can try again
                }}
            />
        </div>
    );
}
