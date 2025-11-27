
import React, { useState, useRef, useEffect } from 'react';
import { Itinerary, DayPlan, Activity } from '../types';

interface ItineraryTabProps {
  itineraries: Itinerary[];
  onUpdateNote: (itineraryId: string, planIndex: number, note: string, images: string[]) => void;
  onEditItinerary: (itinerary: Itinerary) => void;
  onBrowse: () => void;
}

const ItineraryTab: React.FC<ItineraryTabProps> = ({ itineraries, onUpdateNote, onEditItinerary, onBrowse }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // State for editing notes: key is `${itineraryId}-${planIndex}`
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [tempImages, setTempImages] = useState<string[]>([]);
  
  // State for full itinerary editing
  const [isEditingItinerary, setIsEditingItinerary] = useState<boolean>(false);
  const [editingItineraryData, setEditingItineraryData] = useState<Itinerary | null>(null);

  // State for image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleExpand = (id: string) => {
    if (isEditingItinerary) return;
    setExpandedId(expandedId === id ? null : id);
  };

  const startEditingNote = (itineraryId: string, planIndex: number, currentNote: string = '', currentImages: string[] = []) => {
    setEditingKey(`${itineraryId}-${planIndex}`);
    setTempNote(currentNote);
    setTempImages(currentImages || []);
  };

  const saveNote = (itineraryId: string, planIndex: number) => {
    onUpdateNote(itineraryId, planIndex, tempNote, tempImages);
    setEditingKey(null);
    setTempImages([]);
  };

  const cancelEditingNote = () => {
    setEditingKey(null);
    setTempNote('');
    setTempImages([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setTempImages(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setTempImages(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // --- Itinerary Editing Logic ---

  const handleEditClick = (e: React.MouseEvent, trip: Itinerary) => {
    e.stopPropagation();
    setEditingItineraryData(JSON.parse(JSON.stringify(trip))); // Deep copy
    setIsEditingItinerary(true);
    setExpandedId(null); // Collapse view while editing
  };

  const handleSaveItinerary = () => {
    if (editingItineraryData) {
      onEditItinerary(editingItineraryData);
      setIsEditingItinerary(false);
      setEditingItineraryData(null);
      setExpandedId(editingItineraryData.id); // Expand the edited trip
    }
  };

  const handleCancelEditItinerary = () => {
    setIsEditingItinerary(false);
    setEditingItineraryData(null);
  };

  const updateItineraryField = (field: keyof Itinerary, value: any) => {
    if (!editingItineraryData) return;
    
    // If start date changes, we need to shift all plan dates
    if (field === 'startDate') {
      const newStartDate = new Date(value);
      const newPlans = editingItineraryData.plans.map((plan, index) => {
        const planDate = new Date(newStartDate);
        planDate.setDate(planDate.getDate() + index);
        // Helper to format YYYY-MM-DD manually to avoid UTC issues if possible, or use ISO split
        const y = planDate.getFullYear();
        const m = String(planDate.getMonth() + 1).padStart(2, '0');
        const d = String(planDate.getDate()).padStart(2, '0');
        return {
          ...plan,
          date: `${y}-${m}-${d}`
        };
      });
      
      // Calculate end date
      const endDateObj = new Date(newStartDate);
      endDateObj.setDate(endDateObj.getDate() + editingItineraryData.plans.length - 1);
      const yEnd = endDateObj.getFullYear();
      const mEnd = String(endDateObj.getMonth() + 1).padStart(2, '0');
      const dEnd = String(endDateObj.getDate()).padStart(2, '0');
      const newEndDate = `${yEnd}-${mEnd}-${dEnd}`;

      setEditingItineraryData({
        ...editingItineraryData,
        startDate: value,
        endDate: newEndDate,
        plans: newPlans
      });
    } else {
      setEditingItineraryData({
        ...editingItineraryData,
        [field]: value
      });
    }
  };

  const updateDayPlanTitle = (dayIndex: number, title: string) => {
    if (!editingItineraryData) return;
    const newPlans = [...editingItineraryData.plans];
    newPlans[dayIndex] = { ...newPlans[dayIndex], title };
    setEditingItineraryData({ ...editingItineraryData, plans: newPlans });
  };

  const updateActivity = (dayIndex: number, activityIndex: number, field: keyof Activity, value: string) => {
    if (!editingItineraryData) return;
    const newPlans = [...editingItineraryData.plans];
    const newActivities = [...newPlans[dayIndex].activities];
    newActivities[activityIndex] = { ...newActivities[activityIndex], [field]: value };
    newPlans[dayIndex] = { ...newPlans[dayIndex], activities: newActivities };
    setEditingItineraryData({ ...editingItineraryData, plans: newPlans });
  };

  const addActivity = (dayIndex: number) => {
    if (!editingItineraryData) return;
    const newPlans = [...editingItineraryData.plans];
    newPlans[dayIndex].activities.push({ time: '09:00 - 10:00', description: '新活动' });
    setEditingItineraryData({ ...editingItineraryData, plans: newPlans });
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    if (!editingItineraryData) return;
    const newPlans = [...editingItineraryData.plans];
    newPlans[dayIndex].activities.splice(activityIndex, 1);
    setEditingItineraryData({ ...editingItineraryData, plans: newPlans });
  };

  const moveActivity = (dayIndex: number, activityIndex: number, direction: 'up' | 'down') => {
    if (!editingItineraryData) return;
    const newPlans = [...editingItineraryData.plans];
    const activities = newPlans[dayIndex].activities;
    
    if (direction === 'up' && activityIndex > 0) {
      [activities[activityIndex], activities[activityIndex - 1]] = [activities[activityIndex - 1], activities[activityIndex]];
    } else if (direction === 'down' && activityIndex < activities.length - 1) {
      [activities[activityIndex], activities[activityIndex + 1]] = [activities[activityIndex + 1], activities[activityIndex]];
    }
    
    setEditingItineraryData({ ...editingItineraryData, plans: newPlans });
  };

  // --- Date Formatting Helpers ---

  const formatDateRange = (start?: string, end?: string) => {
    if (!start) return '';
    const startDate = new Date(start).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    const endDate = end ? new Date(end).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '';
    return `${startDate} - ${endDate}`;
  };

  const formatDayDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  };

  // --- Renderers ---

  const renderImagePreview = () => {
    if (!previewImage) return null;
    return (
      <div 
        className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setPreviewImage(null)}
      >
        <button 
          onClick={() => setPreviewImage(null)}
          className="absolute top-4 right-4 text-white text-3xl opacity-70 hover:opacity-100"
        >
          <i className="fas fa-times"></i>
        </button>
        <img 
          src={previewImage} 
          alt="Preview" 
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
          onClick={(e) => e.stopPropagation()} 
        />
      </div>
    );
  };

  const renderEditView = () => {
    if (!editingItineraryData) return null;

    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-slide-in-right">
        {/* Edit Header */}
        <div className="bg-white px-4 py-4 shadow-sm border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
          <button 
            onClick={handleCancelEditItinerary}
            className="text-gray-500 font-medium text-sm hover:text-gray-700 px-2"
          >
            取消
          </button>
          <h2 className="text-lg font-bold text-gray-800">编辑行程</h2>
          <button 
            onClick={handleSaveItinerary}
            className="text-blue-600 font-bold text-sm hover:text-blue-700 px-2"
          >
            保存
          </button>
        </div>

        {/* Edit Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          
          {/* Main Info */}
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6 space-y-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">目的地</label>
               <input 
                 type="text" 
                 value={editingItineraryData.destinationName}
                 onChange={(e) => updateItineraryField('destinationName', e.target.value)}
                 className="w-full text-xl font-bold text-gray-800 border-b border-gray-200 focus:border-blue-500 focus:outline-none pb-1"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">开始日期</label>
               <input 
                 type="date" 
                 value={editingItineraryData.startDate || ''}
                 onChange={(e) => updateItineraryField('startDate', e.target.value)}
                 className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
               />
               <p className="text-xs text-gray-400 mt-1">修改开始日期将自动更新每日日期</p>
             </div>
          </div>

          {/* Days */}
          <div className="space-y-6">
            {editingItineraryData.plans.map((day, dayIndex) => (
              <div key={day.day} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="bg-blue-50/50 p-3 border-b border-blue-100 flex items-center justify-between">
                   <div className="flex items-center space-x-3 flex-1">
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">D{day.day}</span>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={day.title} 
                          onChange={(e) => updateDayPlanTitle(dayIndex, e.target.value)}
                          className="w-full bg-transparent font-bold text-gray-800 focus:outline-none text-sm border-b border-transparent focus:border-blue-300 placeholder-gray-400"
                          placeholder="输入今日主题"
                        />
                        <div className="text-[10px] text-gray-400 mt-0.5">{day.date}</div>
                      </div>
                   </div>
                </div>

                <div className="p-3 space-y-3">
                   {day.activities.map((act, actIndex) => (
                     <div key={actIndex} className="flex items-start group relative bg-gray-50 rounded-lg p-2 border border-gray-100">
                        {/* Drag/Move Controls */}
                        <div className="flex flex-col space-y-1 mr-2 pt-1">
                           <button 
                             onClick={() => moveActivity(dayIndex, actIndex, 'up')}
                             disabled={actIndex === 0}
                             className="text-gray-300 hover:text-blue-500 disabled:opacity-30 transition-colors"
                           >
                             <i className="fas fa-caret-up"></i>
                           </button>
                           <button 
                             onClick={() => moveActivity(dayIndex, actIndex, 'down')}
                             disabled={actIndex === day.activities.length - 1}
                             className="text-gray-300 hover:text-blue-500 disabled:opacity-30 transition-colors"
                           >
                             <i className="fas fa-caret-down"></i>
                           </button>
                        </div>

                        <div className="flex-1 space-y-2">
                           <div className="flex items-center space-x-2">
                              <i className="far fa-clock text-gray-400 text-xs"></i>
                              <input 
                                type="text"
                                value={act.time}
                                onChange={(e) => updateActivity(dayIndex, actIndex, 'time', e.target.value)}
                                className="bg-white border border-gray-200 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:border-blue-500 font-mono text-gray-600"
                                placeholder="09:00 - 10:00"
                              />
                           </div>
                           <textarea 
                             value={act.description}
                             onChange={(e) => updateActivity(dayIndex, actIndex, 'description', e.target.value)}
                             rows={2}
                             className="w-full bg-white border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500 text-gray-700 resize-none"
                             placeholder="活动描述"
                           />
                        </div>

                        <button 
                          onClick={() => removeActivity(dayIndex, actIndex)}
                          className="ml-2 text-gray-300 hover:text-red-500 p-1"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                     </div>
                   ))}

                   <button 
                     onClick={() => addActivity(dayIndex)}
                     className="w-full py-2 border-2 border-dashed border-blue-100 rounded-lg text-blue-400 text-xs font-bold hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center justify-center"
                   >
                     <i className="fas fa-plus mr-1"></i> 添加活动
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (itineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center pt-20">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
          <i className="fas fa-plane-departure text-blue-400 text-4xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">没有行程</h2>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">您还没有制定任何旅行计划。去“搜索”页面开始您的下一次冒险吧！</p>
        <button 
          onClick={onBrowse}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 flex items-center"
        >
          <i className="fas fa-search mr-2"></i>
          开始规划
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4 w-full">
      {renderImagePreview()}
      {isEditingItinerary && renderEditView()}
      
      <h1 className="text-3xl font-bold text-gray-900 mb-6 px-1">我的行程</h1>
      
      {/* Hidden File Input for Image Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="space-y-3">
        {itineraries.map((trip) => (
          <div key={trip.id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100/80">
            {/* Header / Card Cover */}
            <div 
              className="relative h-48 cursor-pointer group"
              onClick={() => toggleExpand(trip.id)}
            >
              <img 
                src={trip.coverImage} 
                alt={trip.destinationName} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                <div className="flex justify-between items-end">
                   <div>
                      <h3 className="text-white text-2xl font-bold tracking-tight">{trip.destinationName}</h3>
                      {trip.startDate && (
                        <p className="text-blue-200 text-sm font-medium mt-1">
                          <i className="fas fa-calendar-alt mr-1"></i>
                          {formatDateRange(trip.startDate, trip.endDate)}
                        </p>
                      )}
                   </div>
                   <div className="flex items-center space-x-2">
                       {/* Edit Button */}
                       <button 
                         onClick={(e) => handleEditClick(e, trip)}
                         className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 text-white transition-colors"
                       >
                         <i className="fas fa-pen text-xs"></i>
                       </button>
                       
                      <span className="bg-white/20 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-semibold border border-white/10">
                         {trip.durationDays} 天
                      </span>
                      <div className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-transform duration-300 ${expandedId === trip.id ? 'rotate-180 bg-white/30' : ''}`}>
                        <i className="fas fa-chevron-down text-white text-sm"></i>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Details Section (Accordion) */}
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden bg-gray-50/30 ${
                expandedId === trip.id ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-4 space-y-8">
                {trip.plans.map((dayPlan, idx) => {
                  const isEditing = editingKey === `${trip.id}-${idx}`;
                  const hasNote = dayPlan.note || (dayPlan.images && dayPlan.images.length > 0);
                  
                  return (
                    <div key={dayPlan.day} className="relative">
                      {/* Day Header */}
                      <div className="flex items-center mb-3 pl-1">
                         <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm mr-3">
                            D{dayPlan.day}
                         </div>
                         <div>
                            {dayPlan.date && (
                               <span className="text-xs text-gray-400 font-medium block uppercase tracking-wider mb-0.5">
                                  {formatDayDate(dayPlan.date)}
                               </span>
                            )}
                            <h4 className="text-base font-bold text-gray-900 leading-tight">{dayPlan.title}</h4>
                         </div>
                      </div>

                      {/* New Beautiful Vertical Timeline */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
                        <div className="space-y-0">
                          {dayPlan.activities.map((act, actIdx) => {
                             const [startTime, endTime] = act.time.split('-').map(t => t.trim());
                             const isLast = actIdx === dayPlan.activities.length - 1;

                             return (
                              <div key={actIdx} className="flex relative group">
                                 {/* Time Column */}
                                 <div className="w-[4.5rem] flex-shrink-0 flex flex-col items-end pr-3 pt-0.5">
                                    <span className="text-sm font-bold text-gray-800 tabular-nums whitespace-nowrap leading-none">{startTime}</span>
                                    <span className="text-[10px] text-gray-400 font-medium mt-1 tabular-nums whitespace-nowrap leading-none">{endTime}</span>
                                 </div>

                                 {/* Timeline Connector */}
                                 <div className="relative flex flex-col items-center mr-3">
                                    {/* Dot */}
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-50 z-10 relative mt-1.5 transition-transform group-hover:scale-110 group-hover:ring-blue-100"></div>
                                    {/* Line */}
                                    {!isLast && (
                                       <div className="w-[1.5px] bg-gray-100 absolute top-3 bottom-[-6px]"></div>
                                    )}
                                 </div>

                                 {/* Content */}
                                 <div className="flex-1 pb-6 group-last:pb-0 pt-0.5">
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                       {act.description}
                                    </p>
                                 </div>
                              </div>
                             );
                          })}
                        </div>
                      </div>

                      {/* Note Section */}
                      <div className="mt-2 pl-2">
                        {isEditing ? (
                          <div className="bg-yellow-50/80 backdrop-blur-sm p-4 rounded-xl border border-yellow-200 animate-fade-in shadow-sm">
                            <label className="text-xs font-bold text-yellow-700 mb-2 block flex items-center">
                                <i className="fas fa-pen-nib mr-1.5"></i> 编辑备注
                            </label>
                            <textarea
                              value={tempNote}
                              onChange={(e) => setTempNote(e.target.value)}
                              className="w-full text-sm bg-white border border-yellow-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-3 text-gray-700 shadow-inner"
                              rows={3}
                              placeholder="写下您的旅行心得、花费记录或注意事项..."
                              autoFocus
                            />
                            
                            {/* Image Editing Area */}
                            <div className="mb-3">
                                <div className="flex flex-wrap gap-2">
                                    {tempImages.map((img, i) => (
                                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-yellow-200 group/img shadow-sm">
                                            <img src={img} alt="note" className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => removeImage(i)}
                                                className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-colors backdrop-blur-sm"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={triggerFileInput}
                                        className="w-16 h-16 rounded-lg border-2 border-dashed border-yellow-300 flex flex-col items-center justify-center text-yellow-600 hover:bg-yellow-100 hover:border-yellow-400 transition-all bg-yellow-50/50"
                                    >
                                        <i className="fas fa-camera text-sm mb-1"></i>
                                        <span className="text-[9px] font-bold">添加</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                              <button 
                                onClick={cancelEditingNote}
                                className="text-xs text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                              >
                                取消
                              </button>
                              <button 
                                onClick={() => saveNote(trip.id, idx)}
                                className="text-xs bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-yellow-600 shadow-md shadow-yellow-500/30 transition-all active:scale-95"
                              >
                                保存备注
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={(e) => {
                                // Don't trigger edit if clicking on an image
                                const target = e.target as HTMLElement;
                                if(target.tagName !== 'IMG') {
                                    startEditingNote(trip.id, idx, dayPlan.note, dayPlan.images);
                                }
                            }}
                            className={`group cursor-pointer rounded-xl border border-dashed transition-all duration-200 p-3 ${
                              hasNote 
                                ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-400 hover:bg-yellow-100/50' 
                                : 'bg-transparent border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-center py-4'
                            }`}
                          >
                             
                             <div className="w-full">
                               {hasNote ? (
                                 <div>
                                     <div className="flex items-center justify-between mb-2 pointer-events-none">
                                         <span className="text-xs font-bold text-yellow-700 flex items-center bg-yellow-100 px-2 py-0.5 rounded-full">
                                            <i className="fas fa-sticky-note mr-1.5"></i> 备注
                                         </span>
                                         <i className="fas fa-pencil-alt text-yellow-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                     </div>
                                     {dayPlan.note && (
                                         <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-3 pl-1 pointer-events-none font-sans">{dayPlan.note}</p>
                                     )}
                                     {dayPlan.images && dayPlan.images.length > 0 && (
                                         <div className="flex flex-wrap gap-2">
                                             {dayPlan.images.map((img, i) => (
                                                 <img 
                                                   key={i} 
                                                   src={img} 
                                                   alt="note attachment" 
                                                   className="w-20 h-20 rounded-lg object-cover border border-yellow-200/50 shadow-sm cursor-zoom-in hover:opacity-95 hover:scale-105 transition-all" 
                                                   onClick={(e) => {
                                                       e.stopPropagation();
                                                       setPreviewImage(img);
                                                   }}
                                                 />
                                             ))}
                                         </div>
                                     )}
                                 </div>
                               ) : (
                                 <div className="text-center">
                                     <p className="text-xs text-gray-400 group-hover:text-blue-500 font-medium transition-colors flex items-center justify-center">
                                        <i className="fas fa-plus mr-1.5"></i>
                                        添加行程备注或照片
                                     </p>
                                 </div>
                               )}
                             </div>
                          </div>
                        )}
                      </div>

                      {/* Spacer between days */}
                      {idx !== trip.plans.length - 1 && <div className="h-4 border-l-2 border-dashed border-gray-200 ml-3.5 my-2 opacity-50"></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItineraryTab;
