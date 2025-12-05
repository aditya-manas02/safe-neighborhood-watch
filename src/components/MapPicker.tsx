import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  onSelectLocation: (pos: { lat: number; lng: number }) => void;
}

const markerIcon = L.icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationSelector({
  setPosition,
}: {
  setPosition: (pos: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

const MapPicker = ({ onSelectLocation }: MapPickerProps) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const handlePosition = (pos: { lat: number; lng: number }) => {
    setPosition(pos);
    onSelectLocation(pos);
  };

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border">
      <MapContainer
        center={{ lat: 28.6139, lng: 77.209 }}
        zoom={12}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
        
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        <LocationSelector setPosition={handlePosition} />

        {position && <Marker position={position} icon={markerIcon} />}
      </MapContainer>
    </div>
  );
};

export default MapPicker;
