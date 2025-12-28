'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export function LocationProvider({ children }) {
    const [location, setLocation] = useState({
        address: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        coordinates: null,
        isLoading: false,
    });

    // Load saved location from localStorage
    useEffect(() => {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            setLocation(JSON.parse(savedLocation));
        }
    }, []);

    // Save location to localStorage when it changes
    useEffect(() => {
        if (location.address) {
            localStorage.setItem('userLocation', JSON.stringify(location));
        }
    }, [location]);

    const getCurrentLocation = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setLocation(prev => ({ ...prev, isLoading: true }));

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Reverse geocoding using OpenStreetMap Nominatim (free)
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
                    );
                    const data = await response.json();

                    if (data.address) {
                        const city = data.address.city || data.address.town || data.address.village || '';
                        const area = data.address.suburb || data.address.neighbourhood || data.address.road || '';

                        setLocation({
                            address: area ? `${area}, ${city}` : city,
                            city: city,
                            state: data.address.state || '',
                            fullAddress: data.display_name,
                            coordinates: { lat: latitude, lng: longitude },
                            isLoading: false,
                        });
                    }
                } catch (error) {
                    console.error('Error getting address:', error);
                    setLocation(prev => ({ ...prev, isLoading: false }));
                    alert('Could not fetch your location. Please enter manually.');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setLocation(prev => ({ ...prev, isLoading: false }));
                alert('Could not get your location. Please allow location access.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const setManualLocation = (address, city, state) => {
        setLocation({
            address: address || city,
            city,
            state,
            coordinates: null,
            isLoading: false,
        });
    };

    const clearLocation = () => {
        setLocation({
            address: '',
            city: '',
            state: '',
            coordinates: null,
            isLoading: false,
        });
        localStorage.removeItem('userLocation');
    };

    return (
        <LocationContext.Provider value={{
            location,
            getCurrentLocation,
            setManualLocation,
            setLocation,
            clearLocation,
        }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}
