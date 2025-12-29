'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiSearch, FiX } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const FOOD_EMOJIS = ['🍛', '🍕', '🍔', '🌮', '🍜', '🍝', '🍲', '🥘', '🍱', '🍣', '🥗', '🍗', '🧀', '🥤', '🍩', '🍰', '☕', '🫓'];

export default function RestaurantMenu() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'Main Course',
        description: '',
        image: '🍛',
        isAvailable: true
    });

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
            // Demo data - in production, fetch from API
            const savedItems = localStorage.getItem('restaurantMenuItems');
            if (savedItems) {
                setMenuItems(JSON.parse(savedItems));
            } else {
                const defaultItems = [
                    { _id: '1', name: 'Butter Chicken', price: 1, category: 'Main Course', isAvailable: true, image: '🍛' },
                    { _id: '2', name: 'Paneer Tikka', price: 1, category: 'Starters', isAvailable: true, image: '🧀' },
                    { _id: '3', name: 'Biryani', price: 1, category: 'Main Course', isAvailable: true, image: '🍚' },
                    { _id: '4', name: 'Naan', price: 1, category: 'Breads', isAvailable: true, image: '🫓' },
                    { _id: '5', name: 'Gulab Jamun', price: 1, category: 'Desserts', isAvailable: true, image: '🍩' },
                    { _id: '6', name: 'Mango Lassi', price: 1, category: 'Beverages', isAvailable: false, image: '🥤' },
                ];
                setMenuItems(defaultItems);
                localStorage.setItem('restaurantMenuItems', JSON.stringify(defaultItems));
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
        }
        setLoading(false);
    };

    const saveItems = (items) => {
        setMenuItems(items);
        localStorage.setItem('restaurantMenuItems', JSON.stringify(items));
    };

    const toggleAvailability = (itemId) => {
        const updated = menuItems.map(item =>
            item._id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
        );
        saveItems(updated);
    };

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            price: '',
            category: 'Main Course',
            description: '',
            image: '🍛',
            isAvailable: true
        });
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            price: item.price.toString(),
            category: item.category,
            description: item.description || '',
            image: item.image,
            isAvailable: item.isAvailable
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name || !formData.price) {
            alert('Please fill in name and price');
            return;
        }

        if (editingItem) {
            // Update existing item
            const updated = menuItems.map(item =>
                item._id === editingItem._id
                    ? { ...item, ...formData, price: parseFloat(formData.price) }
                    : item
            );
            saveItems(updated);
        } else {
            // Add new item
            const newItem = {
                _id: Date.now().toString(),
                ...formData,
                price: parseFloat(formData.price)
            };
            saveItems([...menuItems, newItem]);
        }

        setShowModal(false);
    };

    const deleteItem = (itemId) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            const updated = menuItems.filter(item => item._id !== itemId);
            saveItems(updated);
        }
    };

    const categories = ['all', ...new Set(menuItems.map(item => item.category))];
    const categoryOptions = ['Main Course', 'Starters', 'Breads', 'Desserts', 'Beverages', 'Sides', 'Combos'];

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
                    <button className={styles.addBtn} onClick={openAddModal}>
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
                                    <button className={styles.editBtn} onClick={() => openEditModal(item)}><FiEdit2 /></button>
                                    <button className={styles.deleteBtn} onClick={() => deleteItem(item._id)}><FiTrash2 /></button>
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

            {/* Add/Edit Modal */}
            {showModal && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setShowModal(false)} />
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            {/* Emoji Picker */}
                            <div className={styles.formGroup}>
                                <label>Icon</label>
                                <div className={styles.emojiPicker}>
                                    {FOOD_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            className={`${styles.emojiOption} ${formData.image === emoji ? styles.selected : ''}`}
                                            onClick={() => setFormData({ ...formData, image: emoji })}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Item Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Butter Chicken"
                                    required
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Price (₹) *</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categoryOptions.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the dish..."
                                    rows={3}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    />
                                    Available for ordering
                                </label>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn}>
                                    {editingItem ? 'Save Changes' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}
