'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FiStar, FiClock, FiMapPin, FiPhone, FiPlus, FiMinus, FiHeart, FiShare2 } from 'react-icons/fi';
import { restaurantAPI } from '@/services/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function RestaurantPage() {
    const { id } = useParams();
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        fetchRestaurantData();
    }, [id]);

    const fetchRestaurantData = async () => {
        try {
            // Fetch recipe images from DummyJSON
            const recipesRes = await fetch('https://dummyjson.com/recipes?limit=20&select=image,name');
            const recipesData = await recipesRes.json();
            const images = recipesData.recipes?.map(r => r.image) || [];

            const [restaurantRes, menuRes] = await Promise.all([
                restaurantAPI.getById(id),
                restaurantAPI.getMenu(id),
            ]);
            setRestaurant(restaurantRes.data.data.restaurant);

            // Add images to menu items
            const menuData = menuRes.data.data.items || menuRes.data.data.menuItems || [];
            const menuWithImages = menuData.map((item, idx) => ({
                ...item,
                image: images[idx % images.length] || null
            }));
            setMenuItems(menuWithImages);

            // Extract categories
            const cats = [...new Set(menuData.map(item => item.category) || [])];
            setCategories(['All', ...cats]);
        } catch (error) {
            console.error('Error fetching restaurant:', error);
            // Demo data with images
            const recipesRes = await fetch('https://dummyjson.com/recipes?limit=10&select=image,name');
            const recipesData = await recipesRes.json();
            const images = recipesData.recipes?.map(r => r.image) || [];

            setRestaurant(getDemoRestaurant());
            const demoMenu = getDemoMenuItems().map((item, idx) => ({
                ...item,
                image: images[idx % images.length] || null
            }));
            setMenuItems(demoMenu);
            setCategories(['All', 'Starters', 'Main Course', 'Desserts', 'Beverages']);
        }
        setLoading(false);
    };

    const getDemoRestaurant = () => ({
        _id: id,
        name: 'Spice Garden',
        description: 'Authentic Indian cuisine with a modern twist. Experience the rich flavors of India.',
        cuisine: ['Indian', 'North Indian', 'Mughlai'],
        rating: 4.5,
        totalReviews: 234,
        address: { street: '123 Food Street', city: 'Bengaluru', state: 'Karnataka' },
        phone: '+91 9876543210',
        avgDeliveryTime: 30,
        deliveryFee: 40,
        minimumOrder: 150,
        isOpen: true,
        openingHours: [{ day: 'Monday-Sunday', open: '10:00', close: '23:00' }],
    });

    const getDemoMenuItems = () => [
        { _id: '1', name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 250, category: 'Starters', isVeg: true, isAvailable: true, spiceLevel: 'medium' },
        { _id: '2', name: 'Chicken 65', description: 'Crispy fried chicken with aromatic spices', price: 280, category: 'Starters', isVeg: false, isAvailable: true, spiceLevel: 'hot' },
        { _id: '3', name: 'Dal Makhani', description: 'Creamy black lentils cooked overnight', price: 220, category: 'Main Course', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
        { _id: '4', name: 'Butter Chicken', description: 'Tender chicken in rich tomato gravy', price: 320, category: 'Main Course', isVeg: false, isAvailable: true, spiceLevel: 'medium' },
        { _id: '5', name: 'Biryani', description: 'Fragrant rice with spices and choice of protein', price: 350, category: 'Main Course', isVeg: false, isAvailable: true, spiceLevel: 'medium' },
        { _id: '6', name: 'Gulab Jamun', description: 'Sweet dumplings in sugar syrup', price: 120, category: 'Desserts', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
        { _id: '7', name: 'Mango Lassi', description: 'Refreshing yogurt drink with mango', price: 80, category: 'Beverages', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
        { _id: '8', name: 'Masala Chai', description: 'Traditional Indian spiced tea', price: 50, category: 'Beverages', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
    ];

    const filteredItems = selectedCategory === 'All'
        ? menuItems
        : menuItems.filter(item => item.category === selectedCategory);

    const handleAddToCart = (item) => {
        const cartItem = {
            menuItem: { _id: item._id, name: item.name },
            name: item.name,
            price: item.discountPrice || item.price,
            quantity: 1,
            customizations: [],
        };
        addToCart(cartItem, restaurant);
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading restaurant...</p>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className={styles.notFound}>
                <h2>Restaurant not found</h2>
                <p>The restaurant you're looking for doesn't exist.</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <div className={styles.heroImage}>
                    <div className={styles.heroPlaceholder}>🍽️</div>
                </div>
                <div className={styles.heroOverlay}></div>
                <div className={styles.heroContent}>
                    <div className={styles.container}>
                        <div className={styles.heroInfo}>
                            <div className={styles.badges}>
                                {restaurant.isOpen ? (
                                    <span className={styles.openBadge}>Open Now</span>
                                ) : (
                                    <span className={styles.closedBadge}>Closed</span>
                                )}
                                {restaurant.featured && <span className={styles.featuredBadge}>⭐ Featured</span>}
                            </div>
                            <h1>{restaurant.name}</h1>
                            <p className={styles.cuisine}>{restaurant.cuisine?.join(' • ')}</p>
                            <p className={styles.description}>{restaurant.description}</p>

                            <div className={styles.meta}>
                                <span className={styles.rating}>
                                    <FiStar /> {restaurant.rating || 4.0} ({restaurant.totalReviews || 0} reviews)
                                </span>
                                <span><FiClock /> {restaurant.avgDeliveryTime || 30} min</span>
                                <span><FiMapPin /> {restaurant.address?.city}</span>
                            </div>

                            <div className={styles.heroActions}>
                                <button
                                    className={`${styles.actionBtn} ${isFavorite ? styles.active : ''}`}
                                    onClick={() => setIsFavorite(!isFavorite)}
                                >
                                    <FiHeart /> {isFavorite ? 'Saved' : 'Save'}
                                </button>
                                <button className={styles.actionBtn}>
                                    <FiShare2 /> Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Bar */}
            <div className={styles.infoBar}>
                <div className={styles.container}>
                    <div className={styles.infoItems}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Delivery Fee</span>
                            <span className={styles.infoValue}>₹{restaurant.deliveryFee || 40}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Minimum Order</span>
                            <span className={styles.infoValue}>₹{restaurant.minimumOrder || 150}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Delivery Time</span>
                            <span className={styles.infoValue}>{restaurant.avgDeliveryTime || 30} min</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Contact</span>
                            <span className={styles.infoValue}>{restaurant.phone || '+91 9876543210'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Section */}
            <div className={styles.menuSection}>
                <div className={styles.container}>
                    <div className={styles.menuLayout}>
                        {/* Category Sidebar */}
                        <div className={styles.categorySidebar}>
                            <h3>Menu</h3>
                            <div className={styles.categoryList}>
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        className={`${styles.categoryBtn} ${selectedCategory === category ? styles.active : ''}`}
                                        onClick={() => setSelectedCategory(category)}
                                    >
                                        {category}
                                        <span className={styles.categoryCount}>
                                            {category === 'All' ? menuItems.length : menuItems.filter(i => i.category === category).length}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className={styles.menuContent}>
                            <div className={styles.menuGrid}>
                                {filteredItems.map((item) => (
                                    <div key={item._id} className={styles.menuItem}>
                                        <div className={styles.itemInfo}>
                                            <div className={styles.itemHeader}>
                                                <span className={item.isVeg ? styles.vegBadge : styles.nonVegBadge}>
                                                    {item.isVeg ? '🟢' : '🔴'}
                                                </span>
                                                <h4>{item.name}</h4>
                                            </div>
                                            <p className={styles.itemDescription}>{item.description}</p>
                                            <div className={styles.itemMeta}>
                                                {item.spiceLevel && (
                                                    <span className={styles.spiceLevel}>
                                                        {item.spiceLevel === 'hot' ? '🌶️🌶️🌶️' : item.spiceLevel === 'medium' ? '🌶️🌶️' : '🌶️'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.itemPrice}>
                                                {item.discountPrice ? (
                                                    <>
                                                        <span className={styles.originalPrice}>₹{item.price}</span>
                                                        <span className={styles.discountPrice}>₹{item.discountPrice}</span>
                                                    </>
                                                ) : (
                                                    <span>₹{item.price}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.itemAction}>
                                            <div className={styles.itemImage}>
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} />
                                                ) : (
                                                    <span>🍽️</span>
                                                )}
                                            </div>
                                            <button
                                                className={styles.addBtn}
                                                onClick={() => handleAddToCart(item)}
                                                disabled={!item.isAvailable}
                                            >
                                                <FiPlus /> ADD
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
