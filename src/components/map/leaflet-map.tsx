'use client';

import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection, Feature, Point } from 'geojson';

interface MapProps {
  center: [number, number];
  zoom: number;
  className?: string;
  geoJsonData: FeatureCollection;
  onEachFeature: (feature: Feature<Point>, layer: any) => void;
}

export function LeafletMap({ center, zoom, className, geoJsonData, onEachFeature }: MapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ background: '#0a0a0f', height: '100%', width: '100%' }}
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <GeoJSON
        data={geoJsonData}
        onEachFeature={onEachFeature}
        style={{
          fillColor: '#27273a',
          fillOpacity: 0.5,
          color: '#3f3f5a',
          weight: 1,
        }}
      />
    </MapContainer>
  );
}
