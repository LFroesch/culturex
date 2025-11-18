import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import 'leaflet/dist/leaflet.css';
import api from '../lib/api';

// Map style configurations
const MAP_STYLES = {
  street: {
    name: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  clean: {
    name: 'Clean',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  terrain: {
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://viewfinderpanoramas.org">SRTM</a>'
  },
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
};

interface City {
  _id: string;
  name: string;
  country: string;
  coordinates: {
    coordinates: [number, number]; // [lng, lat]
  };
  contentCount: number;
  hasContent: boolean;
}

interface MapProps {
  onCitySelect: (city: City) => void;
  hasCitySelected?: boolean;
}

function FlyToCity({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 12);
    }
  }, [map, position]);

  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

const Map = ({ onCitySelect, hasCitySelected = false }: MapProps) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('street');
  const debounceTimer = useRef<number | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const currentStyle = MAP_STYLES[mapStyle];

  // Memoize handleCityClick to prevent marker re-creation
  const handleCityClick = useCallback((city: City) => {
    setSelectedCity(city);
    onCitySelect(city);
    setSearchQuery(`${city.name}, ${city.country}`);
    setShowSuggestions(false);
  }, [onCitySelect]);

  // Memoize markers to prevent re-renders during zoom
  const cityMarkers = useMemo(() => {
    return cities.map((city) => (
      <CircleMarker
        key={city._id}
        center={[city.coordinates.coordinates[1], city.coordinates.coordinates[0]]}
        radius={6}
        pathOptions={{
          fillColor: '#3b82f6',
          fillOpacity: 0.8,
          color: '#1e40af',
          weight: 2
        }}
        eventHandlers={{
          click: () => handleCityClick(city)
        }}
      >
        <Popup>
          <div className="text-center">
            <h3 className="font-bold">{city.name}</h3>
            <p className="text-sm text-gray-600">{city.country}</p>
            <p className="text-xs text-gray-500">{city.contentCount} posts</p>
          </div>
        </Popup>
      </CircleMarker>
    ));
  }, [cities, handleCityClick]);

  useEffect(() => {
    fetchCities();

    // Click outside handler to close suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCities = async (search?: string) => {
    try {
      const params = search ? `?search=${search}` : '';
      const response = await api.get(`/cities${params}`);
      setCities(response.data);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await api.get(`/cities?search=${query}&limit=10`);
      const results = response.data;
      setSuggestions(results);
      setShowSuggestions(true);

      // Check for exact match and auto-select
      const exactMatch = results.find(
        (city: City) =>
          city.name.toLowerCase() === query.toLowerCase() ||
          `${city.name}, ${city.country}`.toLowerCase() === query.toLowerCase()
      );

      if (exactMatch) {
        handleCityClick(exactMatch);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer (300ms debounce)
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCities(searchQuery);
    setShowSuggestions(false);
  };

  const handleRandomCity = async () => {
    try {
      const response = await api.get('/cities/random/pick');
      const city = response.data;
      setSelectedCity(city);
      onCitySelect(city);
    } catch (error) {
      console.error('Failed to get random city:', error);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      // Call API to create or get city from coordinates
      const response = await api.post('/cities/from-coordinates', { lat, lng });
      const city = response.data;

      // Add city to the list if it's new
      setCities(prevCities => {
        const exists = prevCities.some(c => c._id === city._id);
        if (exists) return prevCities;
        return [...prevCities, city];
      });

      // Select the city
      setSelectedCity(city);
      onCitySelect(city);
    } catch (error) {
      console.error('Failed to create/get city:', error);
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Search and Controls */}
      <div className={`absolute top-4 left-16 z-[1000] flex space-x-2 ${hasCitySelected ? 'right-[50%] mr-4' : 'right-4'}`}>
        <div ref={searchRef} className="flex-1 relative">
          <form onSubmit={handleSearch} className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                placeholder="Search cities..."
                className="w-full px-4 py-2 bg-white rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((city) => (
                    <button
                      key={city._id}
                      type="button"
                      onClick={() => handleCityClick(city)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex justify-between items-center border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{city.name}</div>
                        <div className="text-sm text-gray-500">{city.country}</div>
                      </div>
                      <div className="text-xs text-gray-400">{city.contentCount} posts</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md shadow-lg hover:bg-primary-700"
            >
              Search
            </button>
          </form>
        </div>
        <button
          onClick={handleRandomCity}
          className="px-4 py-2 bg-green-600 text-white rounded-md shadow-lg hover:bg-green-700 whitespace-nowrap"
        >
          Surprise Me
        </button>
      </div>

      {/* Map Style Selector */}
      <div className={`absolute top-20 z-[1000] bg-white rounded-md shadow-lg overflow-hidden ${hasCitySelected ? 'left-4' : 'right-4'}`}>
        {(Object.keys(MAP_STYLES) as Array<keyof typeof MAP_STYLES>).map((styleKey) => (
          <button
            key={styleKey}
            onClick={() => setMapStyle(styleKey)}
            className={`block w-full px-4 py-2 text-left hover:bg-gray-100 ${
              mapStyle === styleKey ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-700'
            }`}
          >
            {MAP_STYLES[styleKey].name}
          </button>
        ))}
      </div>

      {/* Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        minZoom={2}
      >
        <TileLayer
          attribution={currentStyle.attribution}
          url={currentStyle.url}
          maxZoom={19}
          noWrap={true}
        />

        <MapClickHandler onMapClick={handleMapClick} />

        {cityMarkers}

        {selectedCity && (
          <FlyToCity
            position={[
              selectedCity.coordinates.coordinates[1],
              selectedCity.coordinates.coordinates[0]
            ]}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default memo(Map);
