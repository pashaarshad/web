'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiPlus, FiTrash2, FiLogOut, FiSave } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { userAPI } from '@/services/api';
import styles from './page.module.css';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading, logout, setUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
    });
    const [addresses, setAddresses] = useState([]);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: 'home',
        street: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
    });

    // Get current location and reverse geocode
    const useCurrentLocation = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Using OpenStreetMap Nominatim for reverse geocoding (free)
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
                    );
                    const data = await response.json();

                    if (data.address) {
                        setNewAddress({
                            ...newAddress,
                            street: data.display_name?.split(',').slice(0, 3).join(', ') || '',
                            city: data.address.city || data.address.town || data.address.village || '',
                            state: data.address.state || '',
                            pincode: data.address.postcode || '',
                        });
                    }
                } catch (error) {
                    console.error('Error getting address:', error);
                    alert('Could not fetch address. Please enter manually.');
                }
                setLocationLoading(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Could not get your location. Please allow location access.');
                setLocationLoading(false);
            }
        );
    };

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
            });
            setAddresses(user.addresses || []);
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            const response = await userAPI.updateProfile(formData);
            setUser(response.data.data.user);
            setEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
        setLoading(false);
    };

    const handleAddAddress = async () => {
        if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
            alert('Please fill in all required fields (Street, City, State, and Pincode)');
            return;
        }

        setLoading(true);
        try {
            const response = await userAPI.addAddress(newAddress);
            // Backend returns { success, message, data: { addresses } }
            setAddresses(response.data.data.addresses);
            setShowAddAddress(false);
            setNewAddress({
                label: 'home',
                street: '',
                city: '',
                state: '',
                pincode: '',
                phone: '',
            });
            alert('Address added successfully!');
        } catch (error) {
            console.error('Error adding address:', error);
            alert('Failed to add address: ' + (error.response?.data?.message || 'Unknown error'));
        }
        setLoading(false);
    };

    const handleDeleteAddress = async (id) => {
        if (!confirm('Delete this address?')) return;

        try {
            await userAPI.deleteAddress(id);
            setAddresses(addresses.filter(a => a._id !== id));
        } catch (error) {
            console.error('Error deleting address:', error);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (authLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>My Profile</h1>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        <FiLogOut /> Logout
                    </button>
                </div>

                <div className={styles.grid}>
                    {/* Profile Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2><FiUser /> Personal Information</h2>
                            {!editing && (
                                <button className={styles.editBtn} onClick={() => setEditing(true)}>
                                    <FiEdit2 /> Edit
                                </button>
                            )}
                        </div>

                        <div className={styles.cardContent}>
                            <div className={styles.avatar}>
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.name} />
                                ) : (
                                    <span>{user?.name?.charAt(0) || 'U'}</span>
                                )}
                            </div>

                            {editing ? (
                                <div className={styles.form}>
                                    <div className={styles.inputGroup}>
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+91 XXXXXXXXXX"
                                        />
                                    </div>
                                    <div className={styles.formActions}>
                                        <button className={styles.cancelBtn} onClick={() => setEditing(false)}>
                                            Cancel
                                        </button>
                                        <button
                                            className={styles.saveBtn}
                                            onClick={handleUpdateProfile}
                                            disabled={loading}
                                        >
                                            <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.info}>
                                    <div className={styles.infoItem}>
                                        <FiUser className={styles.infoIcon} />
                                        <div>
                                            <label>Name</label>
                                            <p>{user?.name || 'Not set'}</p>
                                        </div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <FiMail className={styles.infoIcon} />
                                        <div>
                                            <label>Email</label>
                                            <p>{user?.email}</p>
                                        </div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <FiPhone className={styles.infoIcon} />
                                        <div>
                                            <label>Phone</label>
                                            <p>{user?.phone || 'Not set'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Addresses Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2><FiMapPin /> Saved Addresses</h2>
                            <button className={styles.addBtn} onClick={() => setShowAddAddress(true)}>
                                <FiPlus /> Add New
                            </button>
                        </div>

                        <div className={styles.cardContent}>
                            {showAddAddress && (
                                <div className={styles.addAddressForm}>
                                    <button
                                        type="button"
                                        className={styles.locationBtn}
                                        onClick={useCurrentLocation}
                                        disabled={locationLoading}
                                    >
                                        <FiMapPin /> {locationLoading ? 'Getting location...' : 'Use Current Location'}
                                    </button>
                                    <div className={styles.formRow}>
                                        <select
                                            value={newAddress.label}
                                            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                                        >
                                            <option value="home">Home</option>
                                            <option value="work">Work</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Phone"
                                            value={newAddress.phone}
                                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Street Address *"
                                        value={newAddress.street}
                                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                    />
                                    <div className={styles.formRow}>
                                        <input
                                            type="text"
                                            placeholder="City *"
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
                                    <div className={styles.formActions}>
                                        <button className={styles.cancelBtn} onClick={() => setShowAddAddress(false)}>
                                            Cancel
                                        </button>
                                        <button className={styles.saveBtn} onClick={handleAddAddress} disabled={loading}>
                                            <FiSave /> {loading ? 'Adding...' : 'Add Address'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className={styles.addressList}>
                                {addresses.length === 0 ? (
                                    <p className={styles.noAddresses}>No saved addresses</p>
                                ) : (
                                    addresses.map((address) => (
                                        <div key={address._id} className={styles.addressItem}>
                                            <div className={styles.addressInfo}>
                                                <span className={styles.addressLabel}>{address.label}</span>
                                                <p>{address.street}</p>
                                                <p>{address.city}, {address.state} {address.pincode}</p>
                                                {address.phone && <p>{address.phone}</p>}
                                            </div>
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => handleDeleteAddress(address._id)}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
