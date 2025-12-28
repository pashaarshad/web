'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiSearch, FiStar, FiClock, FiFilter, FiX, FiTruck } from 'react-icons/fi';
import { restaurantAPI } from '@/services/api';
import styles from './page.module.css';

export default function RestaurantsPage() {
    const searchParams = useSearchParams();
    const [restaurants, setRestaurants] = useState([]);
    const [cuisines, setCuisines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        cuisine: searchParams.get('cuisine') || '',
        sortBy: 'rating',
        rating: '',
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchCuisines();
    }, []);

    useEffect(() => {
        fetchRestaurants();
    }, [filters]);

    const fetchCuisines = async () => {
        try {
            const response = await restaurantAPI.getCuisines();
            setCuisines(response.data.data.cuisines || []);
        } catch (error) {
            setCuisines(['Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese', 'Fast Food']);
        }
    };

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
            // Fetch recipe images from DummyJSON
            const recipesRes = await fetch('https://dummyjson.com/recipes?limit=10&select=image,name');
            const recipesData = await recipesRes.json();
            const images = recipesData.recipes?.map(r => r.image) || [];

            const params = {};
            if (filters.search) params.search = filters.search;
            if (filters.cuisine) params.cuisine = filters.cuisine;
            if (filters.sortBy) params.sortBy = filters.sortBy;
            if (filters.rating) params.rating = filters.rating;

            const response = await restaurantAPI.getAll(params);
            const restaurantData = response.data.data.restaurants || [];

            // Assign recipe images to restaurants
            const restaurantsWithImages = restaurantData.map((r, idx) => ({
                ...r,
                image: images[idx % images.length] || null
            }));

            setRestaurants(restaurantsWithImages);
        } catch (error) {
            setRestaurants(getDemoRestaurants());
        }
        setLoading(false);
    };

    const getDemoRestaurants = () => [
        { _id: '1', name: 'Spice Garden', cuisine: ['Indian', 'North Indian'], rating: 4.5, deliveryFee: 30, avgDeliveryTime: 25, isOpen: true, totalReviews: 234 },
        { _id: '2', name: 'Dragon Palace', cuisine: ['Chinese', 'Thai'], rating: 4.2, deliveryFee: 40, avgDeliveryTime: 30, isOpen: true, totalReviews: 567 },
        { _id: '3', name: 'Pizza Paradise', cuisine: ['Italian', 'Pizza'], rating: 4.7, deliveryFee: 50, avgDeliveryTime: 35, isOpen: true, totalReviews: 890 },
        { _id: '4', name: 'Taco Town', cuisine: ['Mexican'], rating: 4.0, deliveryFee: 25, avgDeliveryTime: 20, isOpen: true, totalReviews: 123 },
        { _id: '5', name: 'Sushi Station', cuisine: ['Japanese', 'Sushi'], rating: 4.8, deliveryFee: 60, avgDeliveryTime: 40, isOpen: false, totalReviews: 456 },
        { _id: '6', name: 'Burger Barn', cuisine: ['Fast Food', 'American'], rating: 4.3, deliveryFee: 35, avgDeliveryTime: 25, isOpen: true, totalReviews: 789 },
    ];

    const clearFilter = (key) => {
        setFilters({ ...filters, [key]: '' });
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1>Restaurants</h1>
                        <p>{restaurants.length} restaurants found</p>
                    </div>
                </div>

                {/* Search & Filters Bar */}
                <div className={styles.filtersBar}>
                    <div className={styles.searchBox}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search restaurants..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    <div className={styles.filterButtons}>
                        <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                            className={styles.filterSelect}
                        >
                            <option value="rating">Top Rated</option>
                            <option value="deliveryTime">Fastest Delivery</option>
                            <option value="deliveryFee">Lowest Fee</option>
                            <option value="newest">Newest</option>
                        </select>

                        <button
                            className={styles.filterBtn}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FiFilter />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Active Filters */}
                {(filters.cuisine || filters.rating) && (
                    <div className={styles.activeFilters}>
                        {filters.cuisine && (
                            <span className={styles.filterTag}>
                                {filters.cuisine}
                                <button onClick={() => clearFilter('cuisine')}><FiX /></button>
                            </span>
                        )}
                        {filters.rating && (
                            <span className={styles.filterTag}>
                                {filters.rating}+ Rating
                                <button onClick={() => clearFilter('rating')}><FiX /></button>
                            </span>
                        )}
                    </div>
                )}

                {/* Cuisine Tags */}
                <div className={styles.cuisineTags}>
                    <button
                        className={`${styles.cuisineTag} ${!filters.cuisine ? styles.active : ''}`}
                        onClick={() => setFilters({ ...filters, cuisine: '' })}
                    >
                        All
                    </button>
                    {cuisines.slice(0, 8).map((cuisine) => (
                        <button
                            key={cuisine}
                            className={`${styles.cuisineTag} ${filters.cuisine === cuisine ? styles.active : ''}`}
                            onClick={() => setFilters({ ...filters, cuisine: cuisine })}
                        >
                            {cuisine}
                        </button>
                    ))}
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className={styles.filterPanel}>
                        <div className={styles.filterGroup}>
                            <h4>Minimum Rating</h4>
                            <div className={styles.ratingOptions}>
                                {['4.5', '4.0', '3.5', '3.0'].map((rating) => (
                                    <button
                                        key={rating}
                                        className={`${styles.ratingBtn} ${filters.rating === rating ? styles.active : ''}`}
                                        onClick={() => setFilters({ ...filters, rating: filters.rating === rating ? '' : rating })}
                                    >
                                        <FiStar /> {rating}+
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Restaurant Grid */}
                <div className={styles.grid}>
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className={styles.skeletonCard}>
                                <div className={styles.skeletonImage}></div>
                                <div className={styles.skeletonContent}>
                                    <div className={styles.skeletonTitle}></div>
                                    <div className={styles.skeletonText}></div>
                                </div>
                            </div>
                        ))
                    ) : restaurants.length === 0 ? (
                        <div className={styles.noResults}>
                            <span className={styles.noResultsIcon}>🍽️</span>
                            <h3>No restaurants found</h3>
                            <p>Try adjusting your filters or search query</p>
                        </div>
                    ) : (
                        restaurants.map((restaurant) => (
                            <Link
                                key={restaurant._id}
                                href={`/restaurant/${restaurant._id}`}
                                className={styles.restaurantCard}
                            >
                                <div className={styles.restaurantImage}>
                                    {restaurant.image ? (
                                        <img src={restaurant.image} alt={restaurant.name} className={styles.restaurantImg} />
                                    ) : (
                                        <div className={styles.imagePlaceholder}>
                                            <span>🍽️</span>
                                        </div>
                                    )}
                                    {restaurant.isOpen ? (
                                        <span className={styles.openBadge}>Open</span>
                                    ) : (
                                        <span className={styles.closedBadge}>Closed</span>
                                    )}
                                    <div className={styles.ratingBadge}>
                                        <FiStar /> {restaurant.rating || 4.0}
                                    </div>
                                </div>
                                <div className={styles.restaurantInfo}>
                                    <h3>{restaurant.name}</h3>
                                    <p className={styles.cuisineText}>
                                        {restaurant.cuisine?.slice(0, 2).join(' • ') || 'Multi-cuisine'}
                                    </p>
                                    <div className={styles.meta}>
                                        <span><FiClock /> {restaurant.avgDeliveryTime || 30} min</span>
                                        <span><FiTruck /> ₹{restaurant.deliveryFee || 30}</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
