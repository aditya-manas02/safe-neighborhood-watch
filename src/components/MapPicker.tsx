import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default icon issue in Leaflet
const defaultIcon = L.icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapPickerProps {
  onSelectLocation: (coords: { lat: number; lng: number }) => void;
}

// Component that listens for clicks on the map
const LocationMarker = ({
  marker,
  setMarker,
  onSelectLocation,
}: {
  marker: { lat: number; lng: number } | null;
  setMarker: (c: { lat: number; lng: number }) => void;
  onSelectLocation: (coords: { lat: number; lng: number }) => void;
}) => {
  useMapEvents({
    click(e) {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      setMarker(coords);
      onSelectLocation(coords);
    },
  });

  return marker ? (
    <Marker position={[marker.lat, marker.lng]} icon={defaultIcon} />
  ) : null;
};

export default function MapPicker({ onSelectLocation }: MapPickerProps) {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    null
  );

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={{ lat: 20.5937, lng: 78.9629 }} // India center
        zoom={5}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <LocationMarker
          marker={marker}
          setMarker={setMarker}
          onSelectLocation={onSelectLocation}
        />
      </MapContainer>
    </div>
  );
}
