
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ItineraryTab from './components/ItineraryTab';
import InspirationTab from './components/InspirationTab';
import SearchTab from './components/SearchTab';
import { Tab, Itinerary } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.INSPIRATION);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [initialSearchQuery, setInitialSearchQuery] = useState('');

  const addItinerary = (itinerary: Itinerary) => {
    setItineraries((prev) => [itinerary, ...prev]);
  };

  const updateItineraryNote = (itineraryId: string, planIndex: number, note: string, images: string[]) => {
    setItineraries((prev) => prev.map(it => {
      if (it.id === itineraryId) {
        const newPlans = [...it.plans];
        newPlans[planIndex] = { ...newPlans[planIndex], note, images };
        return { ...it, plans: newPlans };
      }
      return it;
    }));
  };

  const editItinerary = (updatedItinerary: Itinerary) => {
    setItineraries((prev) => prev.map(it => it.id === updatedItinerary.id ? updatedItinerary : it));
  };

  const handlePlanTrip = (destination: string) => {
    setInitialSearchQuery(destination);
    setActiveTab(Tab.SEARCH);
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.ITINERARY:
        return (
          <ItineraryTab 
            itineraries={itineraries} 
            onUpdateNote={updateItineraryNote}
            onEditItinerary={editItinerary}
            onBrowse={() => setActiveTab(Tab.SEARCH)}
          />
        );
      case Tab.INSPIRATION:
        return <InspirationTab onPlanTrip={handlePlanTrip} />;
      case Tab.SEARCH:
        return (
          <SearchTab 
            onAddItinerary={addItinerary} 
            setActiveTab={setActiveTab} 
            initialQuery={initialSearchQuery}
            onClearQuery={() => setInitialSearchQuery('')}
          />
        );
      default:
        return <InspirationTab onPlanTrip={handlePlanTrip} />;
    }
  };

  return (
    <div className="bg-gray-50 h-screen w-full flex justify-center font-sans text-gray-900 overflow-hidden">
      <main className="w-full max-w-md bg-white h-full shadow-2xl relative flex flex-col">
        {/* Top Gradient decoration - fixed position relative to main container */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50 to-transparent pointer-events-none z-0"></div>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto relative z-10 w-full scroll-smooth">
           {renderContent()}
        </div>

        {/* Fixed Navbar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>
    </div>
  );
};

export default App;
