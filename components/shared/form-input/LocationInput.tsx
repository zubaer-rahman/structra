"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, X, Loader2, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface LocationData {
  address: string;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  country?: string;
}

export interface LocationInputProps {
  value: LocationData;
  onChange: (location: LocationData) => void;
  onBlur?: () => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  showMap?: boolean;
  showSelectedLocation?: boolean;
  disabled?: boolean;
}

interface SearchResultItem {
  id: string;
  mainText: string;
  secondaryText: string;
  locationData: LocationData;
}

// Mapbox Static Map & OpenStreetMap interactive preview (Free & high performance)
function LocationMap({
  latitude,
  longitude,
  address,
  className = "",
}: {
  latitude: number;
  longitude: number;
  address: string;
  className?: string;
}) {
  if (latitude === 0 || longitude === 0) {
    return null;
  }

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapboxStaticUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+ea580c(${longitude},${latitude})/${longitude},${latitude},14,0/600x260@2x?access_token=${mapboxToken}`
    : null;

  const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <div className={`mt-3 space-y-2 ${className}`}>
      <div className="relative w-full h-[220px] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm bg-gray-900">
        {mapboxStaticUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mapboxStaticUrl}
            alt={address || "Location Preview"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
            <MapPin className="h-8 w-8 text-orange-500 mb-2" />
            <p className="text-xs text-gray-300 font-medium">{address}</p>
            <p className="text-[11px] text-gray-500 mt-1">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
        <a
          href={osmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 hover:underline font-medium"
        >
          <Globe className="h-3 w-3" />
          View on Map
        </a>
      </div>
    </div>
  );
}

export function LocationInput({
  value,
  onChange,
  onBlur,
  label,
  placeholder = "Search for an address or city...",
  required = false,
  error,
  helperText,
  className = "",
  showMap = false,
  showSelectedLocation = true,
  disabled = false,
}: LocationInputProps) {
  const [searchQuery, setSearchQuery] = useState(value?.address || "");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Synchronize internal query state with incoming value
  useEffect(() => {
    if (value?.address !== undefined && value.address !== searchQuery) {
      setSearchQuery(value.address);
      setSelectedLocation(value);
    }
  }, [value?.address]);

  // Fast Address Geocoding: Mapbox Places API -> Photon (OSM) -> Nominatim
  const searchLocation = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

      // 1. Try Mapbox Geocoding (if token is available)
      if (mapboxToken) {
        try {
          const mbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            trimmed
          )}.json?access_token=${mapboxToken}&autocomplete=true&limit=6`;
          const mbResponse = await fetch(mbUrl);
          if (mbResponse.ok) {
            const mbData = await mbResponse.json();
            if (mbData.features && mbData.features.length > 0) {
              const results: SearchResultItem[] = mbData.features.map((f: any) => {
                const [lng, lat] = f.center || [0, 0];
                const context = f.context || [];

                const getContext = (prefix: string) => {
                  const item = context.find((c: any) => c.id?.startsWith(prefix));
                  return item ? item.text : null;
                };

                const city =
                  getContext("place") ||
                  getContext("district") ||
                  (f.place_type?.includes("place") ? f.text : null);
                const province = getContext("region");
                const postalCode = getContext("postcode");
                const country = getContext("country") || "USA";

                return {
                  id: f.id,
                  mainText: f.text || trimmed,
                  secondaryText: f.place_name?.replace(`${f.text}, `, "") || "",
                  locationData: {
                    address: f.place_name || f.text,
                    city,
                    province,
                    postalCode,
                    latitude: typeof lat === "number" ? lat : 0,
                    longitude: typeof lng === "number" ? lng : 0,
                    country,
                  },
                };
              });

              setSearchResults(results);
              setIsSearching(false);
              return;
            }
          }
        } catch (mbErr) {
          console.warn("Mapbox geocoding fallback:", mbErr);
        }
      }

      // 2. Try Photon API (Fast OSM search-as-you-type)
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=6`;
      const response = await fetch(photonUrl);

      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const results: SearchResultItem[] = data.features.map((f: any, idx: number) => {
            const p = f.properties || {};
            const [lng, lat] = f.geometry?.coordinates || [0, 0];

            const streetPart = [p.housenumber, p.street || p.name].filter(Boolean).join(" ");
            const mainText = streetPart || p.name || p.city || trimmed;
            const secondaryText = [p.city, p.state, p.country].filter(Boolean).join(", ");

            const fullAddress = [
              p.housenumber,
              p.street,
              p.name && p.name !== p.street ? p.name : null,
              p.city,
              p.state,
              p.postcode,
              p.country,
            ].filter(Boolean).join(", ");

            return {
              id: `photon-${idx}-${lat}-${lng}`,
              mainText,
              secondaryText,
              locationData: {
                address: fullAddress || mainText,
                city: p.city || null,
                province: p.state || null,
                postalCode: p.postcode || null,
                latitude: typeof lat === 'number' ? lat : 0,
                longitude: typeof lng === 'number' ? lng : 0,
                country: p.country || "USA",
              },
            };
          });

          setSearchResults(results);
          setIsSearching(false);
          return;
        }
      }

      // 3. Fallback to Nominatim (Official OpenStreetMap search)
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=6&addressdetails=1`;
      const nomResponse = await fetch(nomUrl);
      if (nomResponse.ok) {
        const nomData = await nomResponse.json();
        const results: SearchResultItem[] = nomData.map((item: any, idx: number) => {
          const addr = item.address || {};
          const road = [addr.house_number, addr.road || item.name].filter(Boolean).join(" ");
          const mainText = road || item.name || trimmed;
          const secondaryText = [addr.city || addr.town || addr.village, addr.state, addr.country].filter(Boolean).join(", ");

          return {
            id: `nom-${item.place_id || idx}`,
            mainText,
            secondaryText,
            locationData: {
              address: item.display_name || mainText,
              city: addr.city || addr.town || addr.village || null,
              province: addr.state || null,
              postalCode: addr.postcode || null,
              latitude: parseFloat(item.lat) || 0,
              longitude: parseFloat(item.lon) || 0,
              country: addr.country || "USA",
            },
          };
        });

        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.warn("Free location lookup fallback:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowResults(true);
    setHighlightedIndex(-1);

    // Immediately propagate typed address so manual typing works even without clicking autocomplete
    onChange({
      address: query,
      city: selectedLocation?.city || null,
      province: selectedLocation?.province || null,
      postalCode: selectedLocation?.postalCode || null,
      latitude: selectedLocation?.latitude || 0,
      longitude: selectedLocation?.longitude || 0,
      country: selectedLocation?.country || "",
    });

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(query);
    }, 300);
  };

  const handleLocationSelect = (item: SearchResultItem) => {
    setSelectedLocation(item.locationData);
    onChange(item.locationData);
    setSearchQuery(item.locationData.address);
    setShowResults(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          handleLocationSelect(searchResults[highlightedIndex]);
        } else if (searchResults.length > 0) {
          handleLocationSelect(searchResults[0]);
        }
        break;
      case "Tab":
        if (searchResults.length > 0 && highlightedIndex >= 0) {
          handleLocationSelect(searchResults[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowResults(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowResults(false);
      setHighlightedIndex(-1);
      onBlur?.();
    }, 200);
  };

  const handleClearLocation = () => {
    setSelectedLocation(null);
    setSearchQuery("");
    setShowResults(false);
    setHighlightedIndex(-1);
    onChange({
      address: "",
      city: null,
      province: null,
      postalCode: null,
      latitude: 0,
      longitude: 0,
      country: "",
    });
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <Label htmlFor="location-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1 font-semibold">*</span>}
        </Label>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            id="location-input"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            onFocus={() => {
              if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
                setShowResults(true);
              }
            }}
            placeholder={placeholder}
            className={`pl-10 pr-10 dark:bg-[#161616] dark:text-white ${error ? "border-red-500 focus-visible:ring-red-400 bg-red-50/10 dark:bg-red-950/20" : "border-gray-200 dark:border-white/10"}`}
            disabled={disabled}
          />
          {searchQuery && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearLocation}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Free OpenStreetMap Autocomplete Results Dropdown */}
        {showResults && searchResults.length > 0 && !disabled && (
          <div
            ref={resultsRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-white/10"
          >
            {searchResults.map((result, index) => (
              <button
                key={result.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleLocationSelect(result);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full px-4 py-2.5 text-left transition-colors flex items-start space-x-3 ${
                  highlightedIndex === index ? "bg-orange-50/70 dark:bg-orange-950/40" : "hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <MapPin className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {result.mainText}
                  </div>
                  {result.secondaryText && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {result.secondaryText}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Searching Indicator */}
        {isSearching && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <Loader2 className="animate-spin h-3.5 w-3.5 text-orange-500" />
          </div>
        )}
      </div>

      {/* Helper Text or Error */}
      {error ? (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      ) : null}

      {/* Selected Location Pill */}
      {selectedLocation && showSelectedLocation && selectedLocation.address && (
        <div className="bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-500/30 rounded-lg p-3 text-xs text-orange-950 dark:text-orange-200 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{selectedLocation.address}</div>
              {(selectedLocation.city || selectedLocation.province || selectedLocation.postalCode) && (
                <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                  {[selectedLocation.city, selectedLocation.province, selectedLocation.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Free Interactive OpenStreetMap Preview if requested */}
      {showMap && selectedLocation && selectedLocation.latitude !== 0 && (
        <LocationMap
          latitude={selectedLocation.latitude}
          longitude={selectedLocation.longitude}
          address={selectedLocation.address}
        />
      )}
    </div>
  );
}