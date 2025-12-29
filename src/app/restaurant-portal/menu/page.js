'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiSearch } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { restaurantAPI, menuAPI } from '@/services/api';
import styles from './page.module.css';

export default function RestaurantMenu() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
        if (!authLoading && user && user.role !== 'restaurant') {
            router.push('/');
        }
    }, [isAuthenticated, authLoading, user, router]);

    useEffect(() => {
        fetchMenuItems();
    }, []);

    const fetchMenuItems = async () => {
        setLoading(true);
        try {
            // For now, using demo data
            // In production: const response = await menuAPI.getRestaurantMenu();
            setMenuItems([
                { _id: '1', name: 'Butter Chicken', price: 1, category: 'Main Course', isAvailable: true, image: '🍛' },
                { _id: '2', name: 'Paneer Tikka', price: 1, category: 'Starters', isAvailable: true, image: '🧀' },
                { _id: '3', name: 'Biryani', price: 1, category: 'Main Course', isAvailable: true, image: '🍚' },
                { _id: '4', name: 'Naan', price: 1, category: 'Breads', isAvailable: true, image: '🫓' },
                { _id: '5', name: 'Gulab Jamun', price: 1, category: 'Desserts', isAvailable: true, image: '🍩' },
                { _id: '6', name: 'Mango Lassi', price: 1, category: 'Beverages', isAvailable: false, image: '🥤' },
            ]);
        } catch (error) {
            console.error('Error fetching menu:', error);
        }
        setLoading(false);
    };

    const toggleAvailability = (itemId) => {
        setMenuItems(prev => prev.map(item =>
            item._id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
        ));
    };

    const categories = ['all', ...new Set(menuItems.map(item => item.category))];

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (authLoading || loading) {
        return <div className={styles.loading}><div className={styles.spinner}></div></div>;
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Link href="/restaurant-portal" className={styles.backBtn}>
                    <FiArrowLeft /> Back to Dashboard
                </Link>
                <div className={styles.headerContent}>
                    <h1>Menu Management</h1>
                    <button className={styles.addBtn}>
                        <FiPlus /> Add Item
                    </button>
                </div>
            </header>

            <main className={styles.main}>
                {/* Search & Filter */}
                <div className={styles.filterBar}>
                    <div className={styles.searchBox}>
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Search menu items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className={styles.categoryTabs}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`${styles.categoryTab} ${selectedCategory === cat ? styles.active : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat === 'all' ? 'All Items' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu Items Grid */}
                <div className={styles.menuGrid}>
                    {filteredItems.map(item => (
                        <div key={item._id} className={`${styles.menuCard} ${!item.isAvailable ? styles.unavailable : ''}`}>
                            <div className={styles.cardHeader}>
                                <span className={styles.emoji}>{item.image}</span>
                                <div className={styles.actions}>
                                    <button className={styles.editBtn}><FiEdit2 /></button>
                                    <button className={styles.deleteBtn}><FiTrash2 /></button>
                                </div>
                            </div>
                            <div className={styles.cardBody}>
                                <h3>{item.name}</h3>
                                <span className={styles.category}>{item.category}</span>
                                <div className={styles.priceRow}>
                                    <span className={styles.price}>₹{item.price}</span>
                                    <button
                                        className={`${styles.toggleBtn} ${item.isAvailable ? styles.on : styles.off}`}
                                        onClick={() => toggleAvailability(item._id)}
                                    >
                                        {item.isAvailable ? <FiToggleRight /> : <FiToggleLeft />}
                                        {item.isAvailable ? 'Available' : 'Unavailable'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredItems.length === 0 && (
                    <div className={styles.emptyState}>
                        <span>🍽️</span>
                        <p>No menu items found</p>
                    </div>
                )}
            </main>
        </div>
    );
}
