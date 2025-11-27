
import React, { useState, useEffect } from 'react';
import { DestinationDetails, DayPlan, Itinerary, Tab } from '../types';
import { searchDestination, generateTripPlan } from '../services/geminiService';

interface SearchTabProps {
  onAddItinerary: (itinerary: Itinerary) => void;
  setActiveTab: (tab: Tab) => void;
  initialQuery?: string;
  onClearQuery?: () => void;
}

type PlanMode = 'simple' | 'precise';
type TripStyle = 'vacation' | 'leisure' | 'intense';

const SearchTab: React.FC<SearchTabProps> = ({ onAddItinerary, setActiveTab, initialQuery, onClearQuery }) => {
  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [result, setResult] = useState<DestinationDetails | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<DayPlan[] | null>(null);
  
  // Planning Configuration
  const [planMode, setPlanMode] = useState<PlanMode>('simple');
  const [tripStyle, setTripStyle] = useState<TripStyle>('leisure');
  const [days, setDays] = useState(3);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Precise Mode State
  const [arrivalDateTime, setArrivalDateTime] = useState('');
  const [departureDateTime, setDepartureDateTime] = useState('');

  // Set default times when switching to precise mode
  useEffect(() => {
    if (planMode === 'precise' && !arrivalDateTime) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setArrivalDateTime(now.toISOString().slice(0, 16));
        
        const nextDay = new Date(now);
        nextDay.setDate(nextDay.getDate() + 3);
        setDepartureDateTime(nextDay.toISOString().slice(0, 16));
    }
  }, [planMode]);

  // Handle Initial Query from other tabs
  useEffect(() => {
    if (initialQuery) {
        setQuery(initialQuery);
        performSearch(initialQuery);
        if (onClearQuery) {
            onClearQuery();
        }
    }
  }, [initialQuery]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setSearchLoading(true);
    setResult(null);
    setGeneratedPlan(null);
    try {
      const data = await searchDestination(searchTerm);
      setResult(data);
    } catch (error) {
      alert("Search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const calculateDuration = () => {
    if (planMode === 'simple') return days;
    if (arrivalDateTime && departureDateTime) {
        const start = new Date(arrivalDateTime);
        const end = new Date(departureDateTime);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return Math.max(1, diffDays);
    }
    return 1;
  };

  const handleGeneratePlan = async () => {
    if (!result) return;
    setPlanLoading(true);
    
    try {
      let finalDays = days;
      let timeContext = undefined;

      if (planMode === 'precise') {
          if (!arrivalDateTime || !departureDateTime) {
              alert("请选择到达和离开时间");
              setPlanLoading(false);
              return;
          }
          if (new Date(arrivalDateTime) >= new Date(departureDateTime)) {
              alert("离开时间必须晚于到达时间");
              setPlanLoading(false);
              return;
          }
          finalDays = calculateDuration();
          timeContext = {
              arrival: arrivalDateTime.replace('T', ' '),
              departure: departureDateTime.replace('T', ' ')
          };
      }

      const plans = await generateTripPlan(result.name, finalDays, timeContext, tripStyle);
      setGeneratedPlan(plans);
    } catch (error) {
      console.error(error);
      alert("Could not generate plan.");
    } finally {
      setPlanLoading(false);
    }
  };

  const addDaysToDate = (dateStr: string, daysToAdd: number) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + daysToAdd);
    // Format: YYYY-MM-DD
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleSaveItinerary = () => {
    if (!result || !generatedPlan) return;
    
    let planStartDate = startDate;
    let duration = days;

    if (planMode === 'precise') {
        planStartDate = arrivalDateTime.split('T')[0];
        duration = calculateDuration();
    }

    // Calculate dates for each plan
    const plansWithDates = generatedPlan.map((plan) => ({
      ...plan,
      date: addDaysToDate(planStartDate, plan.day - 1)
    }));

    const finalEndDate = addDaysToDate(planStartDate, duration - 1);

    const newItinerary: Itinerary = {
      id: Date.now().toString(),
      destinationName: result.name,
      durationDays: duration,
      startDate: planStartDate,
      endDate: finalEndDate,
      coverImage: `https://image.pollinations.ai/prompt/${encodeURIComponent(result.imageKeyword)}%20city%20landmark%204k?nologo=true`,
      plans: plansWithDates
    };

    onAddItinerary(newItinerary);
    setActiveTab(Tab.ITINERARY);
  };

  const getImage = (keyword: string) => `https://image.pollinations.ai/prompt/${encodeURIComponent(keyword)}%20scenery%20travel%204k?nologo=true`;

  const getStyleIcon = (style: TripStyle) => {
    switch (style) {
      case 'vacation': return 'fa-umbrella-beach';
      case 'leisure': return 'fa-coffee';
      case 'intense': return 'fa-running';
    }
  };

  const getStyleLabel = (style: TripStyle) => {
    switch (style) {
      case 'vacation': return '度假游';
      case 'leisure': return '休闲游';
      case 'intense': return '特种兵';
    }
  };

  const getStyleButtonClass = (style: TripStyle) => {
    const isActive = tripStyle === style;
    
    const baseClass = "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200";
    
    if (style === 'vacation') {
        return isActive 
            ? `${baseClass} bg-green-100 text-green-800 border-green-400 shadow-md ring-2 ring-green-500/30 transform scale-105` 
            : `${baseClass} bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600`;
    }
    if (style === 'leisure') {
        return isActive 
            ? `${baseClass} bg-blue-100 text-blue-800 border-blue-400 shadow-md ring-2 ring-blue-500/30 transform scale-105` 
            : `${baseClass} bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600`;
    }
    if (style === 'intense') {
        return isActive 
            ? `${baseClass} bg-red-100 text-red-800 border-red-400 shadow-md ring-2 ring-red-500/30 transform scale-105` 
            : `${baseClass} bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600`;
    }
    return baseClass;
  };

  return (
    <div className="pb-24 pt-6 px-4 w-full min-h-full">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 px-1">规划旅程</h1>
      
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="您想去哪里？(例如：巴黎, 伦敦)"
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
        <button 
          type="submit"
          disabled={searchLoading || !query}
          className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {searchLoading ? <i className="fas fa-circle-notch fa-spin"></i> : '搜索'}
        </button>
      </form>

      {/* Initial Prompt */}
      {!result && !searchLoading && (
        <div className="text-center mt-20 opacity-50">
          <i className="fas fa-map-marked-alt text-6xl text-gray-300 mb-4"></i>
          <p>输入目的地开始定制您的专属行程</p>
        </div>
      )}

      {/* Search Result */}
      {result && (
        <div className="animate-fade-in-up">
          <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 mb-6">
            <div className="h-48 relative">
              <img 
                src={getImage(result.imageKeyword)} 
                alt={result.name}
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-5">
                <h2 className="text-3xl font-bold text-white">{result.name}</h2>
                <p className="text-white/80 text-sm font-medium flex items-center">
                  <i className="fas fa-globe-americas mr-2"></i> {result.country}
                </p>
              </div>
            </div>
            
            <div className="p-5">
              <p className="text-gray-600 mb-4 leading-relaxed text-sm">{result.description}</p>
              
              <div className="flex items-center space-x-2 text-xs font-semibold text-blue-800 bg-blue-50 p-3 rounded-xl">
                 <i className="fas fa-calendar-alt text-blue-500"></i>
                 <span>推荐游玩: {result.bestTimeToVisit}</span>
              </div>
            </div>
          </div>

          {!generatedPlan && (
            <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                <span className="flex items-center"><i className="fas fa-magic text-purple-500 mr-2"></i>定制行程</span>
              </h3>

              {/* Toggle Mode */}
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                 <button 
                   onClick={() => setPlanMode('simple')}
                   className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${planMode === 'simple' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   粗略日期
                 </button>
                 <button 
                   onClick={() => setPlanMode('precise')}
                   className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${planMode === 'precise' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   精确时间
                 </button>
              </div>
              
              <div className="space-y-6 mb-6">
                {planMode === 'simple' ? (
                  <>
                    {/* Simple Mode Inputs */}
                    <div>
                      <label className="text-gray-600 text-sm block mb-1">开始日期</label>
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 text-sm">计划天数</span>
                        <span className="font-bold text-blue-600">{days} 天</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={days} 
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>1天</span>
                        <span>10天</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                     {/* Precise Mode Inputs */}
                     <div>
                        <label className="text-gray-600 text-sm block mb-1">到达时间 (落地)</label>
                        <input 
                          type="datetime-local"
                          value={arrivalDateTime}
                          onChange={(e) => setArrivalDateTime(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-gray-600 text-sm block mb-1">离开时间 (起飞)</label>
                        <input 
                          type="datetime-local"
                          value={departureDateTime}
                          onChange={(e) => setDepartureDateTime(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      {arrivalDateTime && departureDateTime && (
                         <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center text-sm">
                            <span className="text-blue-800">计算行程时长:</span>
                            <span className="font-bold text-blue-600">{calculateDuration()} 天</span>
                         </div>
                      )}
                  </>
                )}

                {/* Trip Style Selection */}
                <div>
                   <label className="text-gray-600 text-sm block mb-3">旅行风格</label>
                   <div className="grid grid-cols-3 gap-3">
                     {(['vacation', 'leisure', 'intense'] as TripStyle[]).map((style) => (
                        <button
                          key={style}
                          onClick={() => setTripStyle(style)}
                          className={getStyleButtonClass(style)}
                        >
                           <i className={`fas ${getStyleIcon(style)} text-xl mb-1`}></i>
                           <span className="text-xs font-bold">{getStyleLabel(style)}</span>
                        </button>
                     ))}
                   </div>
                </div>
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={planLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center space-x-2"
              >
                {planLoading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i>
                    <span>AI 正在思考中...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles"></i>
                    <span>
                        {planMode === 'precise' ? '按时间生成计划' : '生成行程计划'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Generated Plan Preview */}
      {generatedPlan && result && (
        <div className="animate-fade-in-up mt-6 pb-4">
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl text-gray-900">预览行程</h3>
              <button 
                onClick={() => setGeneratedPlan(null)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                重新生成
              </button>
           </div>

           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-20">
             {generatedPlan.map((plan, index) => {
               // Calculate display date for preview
               const startDateStr = planMode === 'precise' ? arrivalDateTime.split('T')[0] : startDate;
               const displayDate = addDaysToDate(startDateStr, plan.day - 1);
               const formattedDate = new Date(displayDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
               
               return (
                <div key={index} className="border-b border-gray-100 last:border-0 p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-14 h-14 bg-blue-100 rounded-xl flex flex-col items-center justify-center text-blue-600 mr-4">
                      <span className="font-bold text-lg">D{plan.day}</span>
                      <span className="text-[10px] leading-none text-blue-400">{formattedDate}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 text-sm mb-1 truncate">{plan.title}</h4>
                      <div className="space-y-1 mt-1">
                          {plan.activities.slice(0, 3).map((act, i) => (
                              <div key={i} className="flex items-center text-xs text-gray-500">
                                  <span className="w-10 text-gray-400 mr-2 flex-shrink-0 text-right">{act.time.split('-')[0]}</span>
                                  <span className="truncate">{act.description}</span>
                              </div>
                          ))}
                          {plan.activities.length > 3 && (
                             <div className="text-xs text-blue-400 pl-12">
                                + 更多活动
                             </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
               );
             })}
           </div>

           {/* Floating Save Button */}
           <div className="fixed bottom-20 left-0 w-full px-4 z-40 pointer-events-none">
              <div className="max-w-md mx-auto pointer-events-auto">
                <button
                  onClick={handleSaveItinerary}
                  className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-xl shadow-green-600/30 hover:bg-green-700 transition-all flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-plus-circle"></i>
                  <span>添加到我的行程</span>
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SearchTab;
