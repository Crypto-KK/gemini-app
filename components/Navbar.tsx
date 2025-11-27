import React from 'react';
import { Tab } from '../types';

interface NavbarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const getButtonClass = (tab: Tab) => {
    const isActive = activeTab === tab;
    return `flex flex-col items-center justify-center w-full h-full space-y-1 ${
      isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-500'
    } transition-colors duration-200`;
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 h-16 pb-safe z-50 shadow-lg">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        <button
          onClick={() => setActiveTab(Tab.ITINERARY)}
          className={getButtonClass(Tab.ITINERARY)}
        >
          <i className={`fas fa-suitcase ${activeTab === Tab.ITINERARY ? 'text-lg' : 'text-base'}`}></i>
          <span className="text-xs font-medium">行程</span>
        </button>

        <button
          onClick={() => setActiveTab(Tab.INSPIRATION)}
          className={getButtonClass(Tab.INSPIRATION)}
        >
          <i className={`fas fa-compass ${activeTab === Tab.INSPIRATION ? 'text-lg' : 'text-base'}`}></i>
          <span className="text-xs font-medium">灵感</span>
        </button>

        <button
          onClick={() => setActiveTab(Tab.SEARCH)}
          className={getButtonClass(Tab.SEARCH)}
        >
          <i className={`fas fa-search ${activeTab === Tab.SEARCH ? 'text-lg' : 'text-base'}`}></i>
          <span className="text-xs font-medium">搜索</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;