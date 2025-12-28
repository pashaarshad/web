'use client';

import { useState, useRef, useEffect } from 'react';
import { FiMapPin, FiChevronDown, FiNavigation, FiX, FiSearch } from 'react-icons/fi';
import { useLocation } from '@/context/LocationContext';
import styles from './LocationBar.module.css';

export default function LocationBar() {
    const { location, getCurrentLocation, setManualLocation } = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Search for locations using Nominatim
    const searchLocations = async (query) => {
        if (!query || query.length < 3) {
            setSuggestions([]);
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&addressdetails=1`
            );
            const data = await response.json();
            setSuggestions(data.map(item => ({
                display: item.display_name.split(',').slice(0, 3).join(', '),
                fullAddress: item.display_name,
                city: item.address?.city || item.address?.town || item.address?.village || '',
                state: item.address?.state || '',
                lat: item.lat,
                lon: item.lon,
            })));
        } catch (error) {
            console.error('Search error:', error);
        }
        setSearching(false);
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchLocations(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectLocation = (suggestion) => {
        setManualLocation(suggestion.display, suggestion.city, suggestion.state);
        setIsOpen(false);
        setSearchQuery('');
        setSuggestions([]);
    };

    const handleGetCurrentLocation = async () => {
        await getCurrentLocation();
        setIsOpen(false);
    };

    const popularCities = [
        { name: 'Bengaluru', state: 'Karnataka' },
        { name: 'Mumbai', state: 'Maharashtra' },
        { name: 'Delhi', state: 'Delhi' },
        { name: 'Hyderabad', state: 'Telangana' },
        { name: 'Chennai', state: 'Tamil Nadu' },
        { name: 'Pune', state: 'Maharashtra' },
    ];

    return (
        <div className={styles.locationBar} ref={dropdownRef}>
            <button className={styles.locationBtn} onClick={() => setIsOpen(!isOpen)}>
                <FiMapPin className={styles.pinIcon} />
                <div className={styles.locationText}>
                    {location.address ? (
                        <>
                            <span className={styles.locationLabel}>Deliver to</span>
                            <span className={styles.locationValue}>{location.address}</span>
                        </>
                    ) : (
                        <span className={styles.placeholder}>Enter your delivery location</span>
                    )}
                </div>
                <FiChevronDown className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.searchBox}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search for area, street name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className={styles.clearBtn} onClick={() => setSearchQuery('')}>
                                <FiX />
                            </button>
                        )}
                    </div>

                    <button className={styles.currentLocationBtn} onClick={handleGetCurrentLocation}>
                        <FiNavigation />
                        <div>
                            <span className={styles.gpsLabel}>Use current location</span>
                            <span className={styles.gpsHint}>Using GPS</span>
                        </div>
                        {location.isLoading && <div className={styles.spinner}></div>}
                    </button>

                    {suggestions.length > 0 ? (
                        <div className={styles.suggestions}>
                            {suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    className={styles.suggestionItem}
                                    onClick={() => handleSelectLocation(suggestion)}
                                >
                                    <FiMapPin />
                                    <span>{suggestion.display}</span>
                                </button>
                            ))}
                        </div>
                    ) : searchQuery.length >= 3 && !searching ? (
                        <p className={styles.noResults}>No locations found</p>
                    ) : null}

                    <div className={styles.popularCities}>
                        <h4>Popular Cities</h4>
                        <div className={styles.cityGrid}>
                            {popularCities.map((city) => (
                                <button
                                    key={city.name}
                                    className={styles.cityBtn}
                                    onClick={() => {
                                        setManualLocation(city.name, city.name, city.state);
                                        setIsOpen(false);
                                    }}
                                >
                                    {city.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
