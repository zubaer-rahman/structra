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

  // Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current) return;

      // Avoid re-initializing existing Leaflet instance on same DOM element
      if ((containerRef.current as any)._leaflet_id) {
        return;
      }

      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      mapRef.current = map;

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

      if (mapboxToken) {
        // High-definition official Mapbox Dark v11 tiles
        L.tileLayer(
          `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
          {
            attribution:
              '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            tileSize: 512,
            zoomOffset: -1,
            maxZoom: 19,
          }
        ).addTo(map);
      } else {
        // Fallback to official OpenStreetMap tile layer
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          className: "osm-dark-tiles",
        }).addTo(map);
      }

      // Force recalculation of container size after mounting to avoid tile grey gaps
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);

      renderMarkers(L, map);
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when items or selectedId changes
  const renderMarkers = (L: any, map: any) => {
    if (!map) return;

    // Clear previous markers
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
        <div style="padding: 10px; font-family: system-ui, -apple-system, sans-serif; min-width: 200px; color: #111827;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #111827; line-height: 1.3;">
            ${item.title}
          </h4>
          ${item.subtitle ? `<div style="font-size: 11px; color: #6b7280; margin-bottom: 6px;">${item.subtitle}</div>` : ""}
          ${item.badge ? `<span style="display: inline-block; background: #f3f4f6; color: #374151; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-bottom: 8px;">${item.badge}</span>` : ""}
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

  // Re-render markers on items/selectedId changes
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      renderMarkers(L, mapRef.current);
    });
  }, [items, selectedId]);

  // Fly to selected location or center
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
      {/* Global CSS to invert standard OpenStreetMap tiles into premium dark mode */}
      <style>{`
        .osm-dark-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(90%) !important;
        }
        .leaflet-container {
          background-color: #0A0A0A !important;
        }
      `}</style>
      <div ref={containerRef} className="w-full h-full min-h-[600px] bg-[#0A0A0A]" />
      
      {/* Active Free Tier Indicator badge */}
      <div className="absolute bottom-4 left-4 bg-black/85 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs text-gray-300 flex items-center gap-2 z-[1000] pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="font-medium text-[11px] tracking-wide">
          {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? "Mapbox Dark v11 Active" : "OpenStreetMap Network Active"}
        </span>
      </div>
    </div>
  );
}
