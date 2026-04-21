import { useState, useEffect, useCallback } from 'react';

interface GoogleMapsState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

// Global state to track Google Maps loading
let globalGoogleMapsState: GoogleMapsState = {
  isLoaded: false,
  isLoading: false,
  error: null,
};

// Global callbacks for when Google Maps loads
const loadCallbacks: Set<() => void> = new Set();

// Global script element reference
let globalScript: HTMLScriptElement | null = null;

export function useGoogleMaps() {
  const [state, setState] = useState<GoogleMapsState>(globalGoogleMapsState);

  const initializeGoogleMaps = useCallback(() => {
    // If already loaded, return immediately
    if (globalGoogleMapsState.isLoaded) {
      setState(globalGoogleMapsState);
      return;
    }

    // If already loading, just add callback
    if (globalGoogleMapsState.isLoading) {
      loadCallbacks.add(() => setState(globalGoogleMapsState));
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      const error = 'Google Maps API key is not configured';
      globalGoogleMapsState = { isLoaded: false, isLoading: false, error };
      setState(globalGoogleMapsState);
      return;
    }

    // Check if Google Maps is already available
    if (window.google && window.google.maps) {
      globalGoogleMapsState = { isLoaded: true, isLoading: false, error: null };
      setState(globalGoogleMapsState);
      return;
    }

    // Check if script is already being loaded
    if (globalScript) {
      globalGoogleMapsState = { isLoaded: false, isLoading: true, error: null };
      setState(globalGoogleMapsState);
      loadCallbacks.add(() => setState(globalGoogleMapsState));
      return;
    }

    // Start loading
    globalGoogleMapsState = { isLoaded: false, isLoading: true, error: null };
    setState(globalGoogleMapsState);

    // Create and load script
    globalScript = document.createElement('script');
    globalScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    globalScript.async = true;
    globalScript.defer = true;
    
    globalScript.onload = () => {
      globalGoogleMapsState = { isLoaded: true, isLoading: false, error: null };
      setState(globalGoogleMapsState);
      
      // Notify all waiting callbacks
      loadCallbacks.forEach(callback => callback());
      loadCallbacks.clear();
    };
    
    globalScript.onerror = () => {
      const error = 'Failed to load Google Maps';
      globalGoogleMapsState = { isLoaded: false, isLoading: false, error };
      setState(globalGoogleMapsState);
      
      // Notify all waiting callbacks
      loadCallbacks.forEach(callback => callback());
      loadCallbacks.clear();
    };

    document.head.appendChild(globalScript);
  }, []);

  useEffect(() => {
    initializeGoogleMaps();
  }, [initializeGoogleMaps]);

  return {
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,
    initializeGoogleMaps,
  };
}
