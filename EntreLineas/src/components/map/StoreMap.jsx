import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Icono personalizado para las tiendas
const storeIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMyYmJkZWUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjFjMS4wNSAwIDIuMDA5LS4zMDkgMi44MzUtLjg3Nk02IDE4YTEyIDEyIDAgMCAwIDEyLTEyVjJIOFYxMiIvPjxyZWN0IHg9IjMiIHk9IjExIiB3aWR0aD0iMTgiIGhlaWdodD0iMTEiIHJ4PSIyIi8+PHBhdGggZD0iTTcgMTRoMi41TTcgMThoMi41TTUgMjNtNiAwaCIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Icono para marcador temporal de creación
const tempIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmI4MjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjEgMTBjMCA3LTkgMTMtOSAxM3MtOSAtNi05IC0xM2E5IDkgMCAwIDEgMTggMHoiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEwIiByPSIzIi8+PC9zdmc+',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Componente para detectar clics en el mapa
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
};

export default function StoreMap({ stores, tempMarker, onMapClick, onRemoveMarker }) {
  const mapRef = useRef(null);

  // Coordenadas de Pereira, Colombia
  const pereiraCenter = [4.8133, -75.6961];
  const zoom = 13;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-neutral-border/30">
      <MapContainer
        center={pereiraCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        className="z-0"
      >
        {/* Capa de mapa base (OpenStreetMap) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marcadores de tiendas existentes */}
        {stores.map((store) => (
          <Marker
            key={store.id}
            position={[parseFloat(store.latitud), parseFloat(store.longitud)]}
            icon={storeIcon}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold text-primary">{store.nombre}</h3>
                <p className="text-xs text-neutral-muted mt-1">{store.ciudad}</p>
                <p className="text-xs text-neutral-muted">{store.direccion}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Marcador temporal (mientras se crea nueva tienda) */}
        {tempMarker && (
          <Marker
            position={[tempMarker.lat, tempMarker.lng]}
            icon={tempIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const latlng = e.target.getLatLng();
                onMapClick({ lat: latlng.lat, lng: latlng.lng });
              },
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-amber-400">Nueva tienda</p>
                <p className="text-xs text-neutral-muted mt-1">
                  Lat: {tempMarker.lat.toFixed(4)}
                </p>
                <p className="text-xs text-neutral-muted">
                  Lng: {tempMarker.lng.toFixed(4)}
                </p>
                <button
                  onClick={onRemoveMarker}
                  className="mt-2 w-full bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded hover:bg-red-500/30 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Detector de clics en el mapa */}
        <MapClickHandler onMapClick={onMapClick} />
      </MapContainer>

      {/* Información de uso */}
      <div className="absolute top-4 left-4 bg-neutral-dark/90 backdrop-blur-sm border border-neutral-border/50 rounded-lg p-3 z-50 max-w-xs">
        <p className="text-xs text-neutral-muted">
          <span className="font-semibold text-primary">💡 Tip:</span> Haz clic en el mapa para
          crear una nueva tienda o arrastra el marcador amarillo para ajustar su posición.
        </p>
      </div>
    </div>
  );
}
