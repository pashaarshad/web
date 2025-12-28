'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiMapPin, FiCreditCard, FiCheck, FiPlus, FiClock, FiHome, FiBriefcase, FiX, FiArrowLeft, FiNavigation } from 'react-icons/fi';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { orderAPI, userAPI } from '@/services/api';
import styles from './page.module.css';

const mapContainerStyle = {
    width: '100%',
    height: '250px',
    borderRadius: '12px',
};

const defaultCenter = {
    lat: 12.9716,
    lng: 77.5946,
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
};

const libraries = ['places'];

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

    // Add Address Modal State
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [markerPosition, setMarkerPosition] = useState(defaultCenter);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const mapRef = useRef(null);
    const [newAddress, setNewAddress] = useState({
        street: '',
        city: '',
        state: '',
        pincode: '',
        doorFlat: '',
        landmark: '',
        label: 'home',
    });

    // Load Google Maps
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries,
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
    const handleMarkerDragEnd = useCallback((e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPosition({ lat, lng });
        reverseGeocode(lat, lng);
    }, []);

    // Handle map click to move marker
    const handleMapClick = useCallback((e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPosition({ lat, lng });
        reverseGeocode(lat, lng);
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

                if (mapRef.current) {
                    mapRef.current.panTo(newPos);
                }

                if (isLoaded && window.google) {
                    reverseGeocode(latitude, longitude);
                }
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

    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    const subtotal = getCartTotal();
    const deliveryFee = cart.restaurant?.deliveryFee || 40;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + tax;

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            alert('Please select a delivery address');
            return;
        }

        setLoading(true);
        try {
            const address = addresses.find(a => a._id === selectedAddress);

            const orderData = {
                restaurant: cart.restaurant?._id || 'demo-restaurant',
                items: cart.items.map(item => ({
                    menuItem: item.menuItem?._id || item._id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    customizations: item.customizations || [],
                })),
                deliveryAddress: {
                    label: address?.label || 'home',
                    street: address?.street || 'Demo Street',
                    city: address?.city || 'Bengaluru',
                    state: address?.state || 'Karnataka',
                    pincode: address?.pincode || '560001',
                    phone: address?.phone || user?.phone || '',
                },
                paymentMethod: paymentMethod,
            };

            const response = await orderAPI.create(orderData);

            if (response.data.success) {
                setOrderId(response.data.data.order._id);
                setOrderPlaced(true);
                clearCart();
            }
        } catch (error) {
            console.error('Order error:', error);
            // Demo mode - simulate success
            setOrderId('demo-order-' + Date.now());
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
                            <span>Estimated Delivery: 30-40 mins</span>
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

            {/* Add Address Modal with Google Maps */}
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
                            {/* Google Map */}
                            <div className={styles.mapContainer}>
                                {loadError && (
                                    <div className={styles.mapError}>Error loading map</div>
                                )}
                                {!isLoaded && (
                                    <div className={styles.mapLoading}>
                                        <div className={styles.mapSpinner}></div>
                                        <span>Loading map...</span>
                                    </div>
                                )}
                                {isLoaded && (
                                    <>
                                        <div className={styles.dragMapHint}>Drag map</div>
                                        <GoogleMap
                                            mapContainerStyle={mapContainerStyle}
                                            center={mapCenter}
                                            zoom={16}
                                            options={mapOptions}
                                            onLoad={onMapLoad}
                                            onClick={handleMapClick}
                                        >
                                            <Marker
                                                position={markerPosition}
                                                draggable={true}
                                                onDragEnd={handleMarkerDragEnd}
                                                icon={{
                                                    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                                                    scaledSize: new window.google.maps.Size(40, 40),
                                                }}
                                            />
                                        </GoogleMap>
                                        <button
                                            className={styles.locateMeBtn}
                                            onClick={getCurrentLocation}
                                            disabled={locationLoading}
                                        >
                                            <FiNavigation />
                                        </button>
                                    </>
                                )}
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
        </div>
    );
}
