import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite не резолвить дефолтні шляхи до іконок Leaflet — стандартний фікс:
// підключаємо картинки напряму й перевизначаємо дефолтну іконку.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LocationMapProps {
  lat: number;
  lng: number;
  label: string;
}

const LocationMap = ({ lat, lng, label }: LocationMapProps) => (
  <div className="h-56 rounded-md overflow-hidden border border-line">
    <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]}>
        <Popup>{label}</Popup>
      </Marker>
    </MapContainer>
  </div>
);

export default LocationMap;
