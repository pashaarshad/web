'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiSearch, FiStar, FiClock, FiArrowRight, FiTruck } from 'react-icons/fi';
import { restaurantAPI } from '@/services/api';
import LocationBar from '@/components/common/LocationBar';
import styles from './page.module.css';

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [recipeImages, setRecipeImages] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch recipe images from DummyJSON
      const recipesRes = await fetch('https://dummyjson.com/recipes?limit=10&select=image,name');
      const recipesData = await recipesRes.json();
      const images = recipesData.recipes?.map(r => r.image) || [];
      setRecipeImages(images);

      const [restaurantsRes, cuisinesRes] = await Promise.all([
        restaurantAPI.getAll({ limit: 8 }),
        restaurantAPI.getCuisines(),
      ]);

      // Assign recipe images to restaurants
      const restaurantData = restaurantsRes.data.data.restaurants || [];
      const restaurantsWithImages = restaurantData.map((r, idx) => ({
        ...r,
        image: images[idx % images.length] || null
      }));

      setRestaurants(restaurantsWithImages);
      setCuisines(cuisinesRes.data.data.cuisines || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set demo data if API fails
      setRestaurants(getDemoRestaurants());
      setCuisines(['Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese']);
    }
    setLoading(false);
  };

  const getDemoRestaurants = () => [
    { _id: '1', name: 'Spice Garden', cuisine: ['Indian', 'North Indian'], rating: 4.5, deliveryFee: 30, avgDeliveryTime: 25, isOpen: true },
    { _id: '2', name: 'Dragon Palace', cuisine: ['Chinese', 'Thai'], rating: 4.2, deliveryFee: 40, avgDeliveryTime: 30, isOpen: true },
    { _id: '3', name: 'Pizza Paradise', cuisine: ['Italian', 'Pizza'], rating: 4.7, deliveryFee: 50, avgDeliveryTime: 35, isOpen: true },
    { _id: '4', name: 'Taco Town', cuisine: ['Mexican', 'Fast Food'], rating: 4.0, deliveryFee: 25, avgDeliveryTime: 20, isOpen: true },
  ];

  const categories = [
    { name: 'Pizza', icon: '🍕', color: '#FF5722' },
    { name: 'Burger', icon: '🍔', color: '#FFC107' },
    { name: 'Biryani', icon: '🍛', color: '#4CAF50' },
    { name: 'Chinese', icon: '🥡', color: '#E91E63' },
    { name: 'Desserts', icon: '🍰', color: '#9C27B0' },
    { name: 'Healthy', icon: '🥗', color: '#00BCD4' },
  ];

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroGlow}></div>
        </div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Delicious Food,
            <span className={styles.highlight}> Delivered Fast</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Order from the best restaurants near you. Fresh food, quick delivery, amazing taste.
          </p>

          {/* Location & Search Bar */}
          <div className={styles.searchContainer}>
            <div className={styles.locationSearchBar}>
              <LocationBar />
              <div className={styles.searchBox}>
                <FiSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search for restaurant, item or more"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <Link href="/restaurants" className={styles.orderNowBtn}>
                Order Now
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>500+</span>
              <span className={styles.statLabel}>Restaurants</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>10K+</span>
              <span className={styles.statLabel}>Happy Customers</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>30 min</span>
              <span className={styles.statLabel}>Avg. Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>What are you craving?</h2>
            <p>Explore by category</p>
          </div>

          <div className={styles.categories}>
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/restaurants?cuisine=${cat.name}`}
                className={styles.categoryCard}
                style={{ '--accent-color': cat.color }}
              >
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryName}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Restaurants */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Popular Restaurants</h2>
              <p>Top picks for you</p>
            </div>
            <Link href="/restaurants" className={styles.viewAll}>
              View All <FiArrowRight />
            </Link>
          </div>

          <div className={styles.restaurantGrid}>
            {loading ? (
              // Skeleton loader
              [...Array(4)].map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonImage}></div>
                  <div className={styles.skeletonContent}>
                    <div className={styles.skeletonTitle}></div>
                    <div className={styles.skeletonText}></div>
                  </div>
                </div>
              ))
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
                      <div className={styles.restaurantImagePlaceholder}>
                        <span>🍽️</span>
                      </div>
                    )}
                    {restaurant.isOpen ? (
                      <span className={styles.openBadge}>Open</span>
                    ) : (
                      <span className={styles.closedBadge}>Closed</span>
                    )}
                  </div>
                  <div className={styles.restaurantInfo}>
                    <h3 className={styles.restaurantName}>{restaurant.name}</h3>
                    <p className={styles.restaurantCuisine}>
                      {restaurant.cuisine?.slice(0, 2).join(' • ') || 'Multi-cuisine'}
                    </p>
                    <div className={styles.restaurantMeta}>
                      <span className={styles.rating}>
                        <FiStar /> {restaurant.rating || 4.0}
                      </span>
                      <span className={styles.time}>
                        <FiClock /> {restaurant.avgDeliveryTime || 30} min
                      </span>
                      <span className={styles.delivery}>
                        <FiTruck /> ₹{restaurant.deliveryFee || 30}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>How It Works</h2>
            <p>Order in 3 simple steps</p>
          </div>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepIcon}>📍</div>
              <h3>Choose Location</h3>
              <p>Enter your delivery address to find nearby restaurants</p>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepIcon}>🍔</div>
              <h3>Select Food</h3>
              <p>Browse menus and add your favorite items to cart</p>
            </div>
            <div className={styles.stepArrow}>→</div>
            <div className={styles.step}>
              <div className={styles.stepIcon}>🚀</div>
              <h3>Fast Delivery</h3>
              <p>Track your order in real-time until it arrives</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.cta}>
            <div className={styles.ctaContent}>
              <h2>Ready to order?</h2>
              <p>Download our app for a better experience with exclusive offers</p>
              <div className={styles.ctaButtons}>
                <Link href="/restaurants" className="btn btn-primary btn-lg">
                  Order Now
                </Link>
              </div>
            </div>
            <div className={styles.ctaEmoji}>🍕🍔🌮🍜</div>
          </div>
        </div>
      </section>
    </div>
  );
}
