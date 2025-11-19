import { useState, useCallback } from 'react';
import Map from '../components/Map';
import CityPanel from '../components/CityPanel';

interface City {
  _id: string;
  name: string;
  country: string;
  coordinates: {
    coordinates: [number, number];
  };
  contentCount: number;
  hasContent: boolean;
}

const MapExplore = () => {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const handleCitySelect = useCallback((city: City) => {
    setSelectedCity(city);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedCity(null);
  }, []);

  return (
    <div className="fixed inset-0 top-16">
      <div className={`absolute inset-0 transition-all duration-300 ${selectedCity ? 'md:right-[50%]' : 'right-0'}`}>
        <Map onCitySelect={handleCitySelect} hasCitySelected={!!selectedCity} />
      </div>
      <CityPanel city={selectedCity} onClose={handleClose} />
    </div>
  );
};

export default MapExplore;
