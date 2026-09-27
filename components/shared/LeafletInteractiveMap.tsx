"use client";

import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export interface MapItem {
  id: string;
  title: string;
  subtitle?: string;
  latitude: number;
  longitude: number;
  badge?: string;
  priceOrRating?: string;
  linkUrl?: string;
  linkText?: string;
}

interface LeafletInteractiveMapProps {
  items: MapItem[];
  center: [number, number];
  zoom?: number;
  selectedId?: string | null;
  onItemClick?: (item: MapItem) => void;
  className?: string;
}

const isDarkMode = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

export default function LeafletInteractiveMap({
  items,
  center,
  zoom = 5,
  selectedId,
  onItemClick,
  className = "",
}: LeafletInteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const tileLayerRef = useRef<any>(null);

  const getTileLayer = (L: any, dark: boolean) => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (mapboxToken) {
      const style = dark ? "dark-v11" : "light-v11";
      return L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
        {
          attribution:
            '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          tileSize: 512,
          zoomOffset: -1,
          maxZoom: 19,
        }
      );
    }
    // OSM fallback — CSS handles invert for dark mode via .dark class
    return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      className: "osm-tiles",
    });
  };

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current) return;
      if ((containerRef.current as any)._leaflet_id) return;

      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      mapRef.current = map;

      // Initial tile layer based on current theme
      tileLayerRef.current = getTileLayer(L, isDarkMode());
      tileLayerRef.current.addTo(map);

      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 200);

      renderMarkers(L, map);

      // Watch for theme changes and swap tile layer reactively
      const observer = new MutationObserver(() => {
        if (!mapRef.current) return;
        import("leaflet").then((L2) => {
          if (tileLayerRef.current) tileLayerRef.current.remove();
          tileLayerRef.current = getTileLayer(L2, isDarkMode());
          tileLayerRef.current.addTo(mapRef.current);
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      (mapRef.current as any)._themeObserver = observer;
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        if ((mapRef.current as any)._themeObserver) {
          (mapRef.current as any)._themeObserver.disconnect();
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const renderMarkers = (L: any, map: any) => {
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const createPin = (isSelected: boolean) =>
      L.divIcon({
        className: "structra-map-marker",
        html: `
          <div style="
            width: ${isSelected ? "28px" : "20px"};
            height: ${isSelected ? "28px" : "20px"};
            background: ${isSelected ? "#ea580c" : "#f97316"};
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 16px ${isSelected ? "rgba(234,88,12,1)" : "rgba(249,115,22,0.6)"};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          ">
            <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: isSelected ? [28, 28] : [20, 20],
        iconAnchor: isSelected ? [14, 14] : [10, 10],
        popupAnchor: [0, -14],
      });

    items.forEach((item) => {
      if (!item.latitude || !item.longitude) return;

      const isSelected = selectedId === item.id;
      const marker = L.marker([item.latitude, item.longitude], {
        icon: createPin(isSelected),
        title: item.title,
      }).addTo(map);

      const popupHtml = `
        <div style="padding: 10px; font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; line-height: 1.3;">
            ${item.title}
          </h4>
          ${item.subtitle ? `<div style="font-size: 11px; color: #6b7280; margin-bottom: 6px;">${item.subtitle}</div>` : ""}
          ${item.badge ? `<span style="display: inline-block; background: #f97316; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-bottom: 8px;">${item.badge}</span>` : ""}
          ${item.priceOrRating ? `<div style="font-size: 13px; font-weight: 800; color: #ea580c; margin-bottom: 8px;">${item.priceOrRating}</div>` : ""}
          ${
            item.linkUrl
              ? `<a href="${item.linkUrl}" target="_blank" rel="noopener noreferrer" style="
                  display: block;
                  text-align: center;
                  background: #ea580c;
                  color: #ffffff;
                  padding: 6px 12px;
                  border-radius: 6px;
                  font-size: 11px;
                  font-weight: 600;
                  text-decoration: none;
                ">${item.linkText || "View Details"}</a>`
              : ""
          }
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on("click", () => {
        onItemClick?.(item);
      });

      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      renderMarkers(L, mapRef.current);
    });
  }, [items, selectedId]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (selectedId) {
      const selected = items.find((i) => i.id === selectedId);
      if (selected && selected.latitude && selected.longitude) {
        mapRef.current.flyTo([selected.latitude, selected.longitude], 12, {
          duration: 1.2,
        });
        return;
      }
    }

    if (center && center[0] && center[1]) {
      mapRef.current.flyTo(center, zoom, { duration: 1 });
    }
  }, [selectedId, center, zoom, items]);

  return (
    <div className={`relative w-full h-full min-h-[600px] overflow-hidden ${className}`}>
      {/* Theme-aware tile + popup styles */}
      <style>{`
        .osm-tiles { filter: none; transition: filter 0.3s ease; }
        .dark .osm-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(90%);
        }
        .leaflet-container { background-color: #f1f5f9; }
        .dark .leaflet-container { background-color: #0A0A0A; }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }
        .dark .leaflet-popup-content-wrapper {
          background: #1c1c1c;
          color: #f1f5f9;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        .dark .leaflet-popup-tip { background: #1c1c1c; }
        .dark .leaflet-popup-content h4 { color: #f1f5f9 !important; }
        .leaflet-control-zoom a {
          background: white;
          color: #374151;
          border-color: #d1d5db;
        }
        .dark .leaflet-control-zoom a {
          background: #1c1c1c;
          color: #e5e7eb;
          border-color: rgba(255,255,255,0.1);
        }
        .dark .leaflet-control-zoom a:hover { background: #2a2a2a; }
        .dark .leaflet-control-attribution {
          background: rgba(0,0,0,0.7);
          color: #9ca3af;
        }
        .dark .leaflet-control-attribution a { color: #6b7280; }
      `}</style>

      <div
        ref={containerRef}
        className="w-full h-full min-h-[600px] bg-slate-100 dark:bg-[#0A0A0A]"
      />

      {/* Status badge */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/85 backdrop-blur-md border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2 z-[1000] pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="font-medium text-[11px] tracking-wide">
          {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? "Mapbox Active" : "OpenStreetMap Network Active"}
        </span>
      </div>
    </div>
  );
}
