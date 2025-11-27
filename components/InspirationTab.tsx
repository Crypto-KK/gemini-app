
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { DestinationDetails } from '../types';
import { getInspirationPlaces } from '../services/geminiService';

interface InspirationTabProps {
  onPlanTrip: (destination: string) => void;
}

const InspirationTab: React.FC<InspirationTabProps> = ({ onPlanTrip }) => {
  const [places, setPlaces] = useState<DestinationDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<DestinationDetails | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchPlaces = useCallback(async (isInitial = false) => {
    if (loading) return;
    setLoading(true);

    try {
      // Get current place names to exclude them from the next batch
      const currentNames = isInitial ? [] : places.map(p => p.name);
      const newPlaces = await getInspirationPlaces(currentNames);
      
      setPlaces(prev => {
        if (isInitial) return newPlaces;
        // Filter out any duplicates by name just in case
        const existingNames = new Set(prev.map(p => p.name));
        const uniqueNewPlaces = newPlaces.filter(p => !existingNames.has(p.name));
        return [...prev, ...uniqueNewPlaces];
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [places, loading]);

  // Initial load
  useEffect(() => {
    if (places.length === 0) {
      fetchPlaces(true);
    }
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          fetchPlaces(false);
        }
      },
      { threshold: 0.5, rootMargin: '100px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [fetchPlaces, loading]);

  const getImage = (keyword: string) => `https://image.pollinations.ai/prompt/${encodeURIComponent(keyword)}%20travel%20scenery%20photorealistic%204k?nologo=true`;

  return (
    <div className="pb-24 pt-6 px-4 w-full">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 px-1">探索世界</h1>
      <p className="text-gray-500 mb-6 px-1">发现全球各地令人惊叹的热门目的地</p>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 gap-4">
        {places.map((place, idx) => (
          <div 
            key={`${place.name}-${idx}`} 
            onClick={() => setSelectedPlace(place)}
            className="relative rounded-xl overflow-hidden shadow-sm aspect-[3/4] cursor-pointer group hover:shadow-md transition-shadow bg-gray-100"
          >
            <img 
              src={getImage(place.imageKeyword)} 
              alt={place.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
              <span className="text-xs text-blue-200 uppercase font-semibold tracking-wider mb-1 line-clamp-1">{place.country}</span>
              <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">{place.name}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Loading Sentinel / Loading State */}
      <div ref={observerTarget} className="w-full h-20 flex items-center justify-center mt-6">
         {loading && (
           <div className="flex items-center space-x-2 text-gray-400">
             <i className="fas fa-circle-notch fa-spin text-blue-500"></i>
             <span className="text-sm">加载更多灵感...</span>
           </div>
         )}
         {!loading && places.length > 0 && (
           <div className="text-gray-300 text-xs">
             下滑加载更多
           </div>
         )}
      </div>

      {/* Detail Modal */}
      {selectedPlace && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-scale-in flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setSelectedPlace(null)}
              className="absolute top-4 right-4 bg-white/30 backdrop-blur-md text-white rounded-full p-2 w-8 h-8 flex items-center justify-center hover:bg-white/50 z-10 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
            
            <div className="h-64 relative flex-shrink-0">
              <img 
                src={getImage(selectedPlace.imageKeyword)} 
                alt={selectedPlace.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 to-transparent">
                 <h2 className="text-3xl font-bold text-white">{selectedPlace.name}</h2>
                 <p className="text-gray-300 flex items-center mt-1">
                   <i className="fas fa-map-marker-alt mr-2"></i> {selectedPlace.country}
                 </p>
              </div>
            </div>

            <div className="p-6 flex flex-col overflow-y-auto">
              <div className="flex items-center space-x-2 mb-4 flex-wrap gap-y-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                  最佳季节: {selectedPlace.bestTimeToVisit}
                </span>
                {selectedPlace.rating && (
                   <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full flex items-center">
                    <i className="fas fa-star mr-1"></i> {selectedPlace.rating}
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 leading-relaxed text-sm mb-8">
                {selectedPlace.description}
              </p>
              
              <div className="mt-auto flex gap-3">
                <button 
                  onClick={() => setSelectedPlace(null)}
                  className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  关闭
                </button>
                <button 
                  onClick={() => {
                      onPlanTrip(selectedPlace.name);
                      setSelectedPlace(null);
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center"
                >
                  <i className="fas fa-plane mr-2"></i>
                  去这里旅行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspirationTab;
