
import React, { useState, useRef } from 'react';
import { Itinerary } from '../types';

interface ItineraryTabProps {
  itineraries: Itinerary[];
  onUpdateNote: (itineraryId: string, planIndex: number, note: string, images: string[]) => void;
  onBrowse: () => void;
}

const ItineraryTab: React.FC<ItineraryTabProps> = ({ itineraries, onUpdateNote, onBrowse }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // State for editing notes: key is `${itineraryId}-${planIndex}`
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [tempImages, setTempImages] = useState<string[]>([]);
  
  // State for image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const startEditing = (itineraryId: string, planIndex: number, currentNote: string = '', currentImages: string[] = []) => {
    setEditingKey(`${itineraryId}-${planIndex}`);
    setTempNote(currentNote);
    setTempImages(currentImages || []);
  };

  const saveNote = (itineraryId: string, planIndex: number) => {
    onUpdateNote(itineraryId, planIndex, tempNote, tempImages);
    setEditingKey(null);
    setTempImages([]);
  };

  const cancelEditing = () => {
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
      // Reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setTempImages(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

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

  // Image Preview Modal
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6 px-1">我的行程</h1>
      
      {/* Hidden File Input for Image Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="space-y-6">
        {itineraries.map((trip) => (
          <div key={trip.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
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
                      <h3 className="text-white text-2xl font-bold">{trip.destinationName}</h3>
                      {trip.startDate && (
                        <p className="text-blue-200 text-sm font-medium mt-1">
                          <i className="fas fa-calendar-alt mr-1"></i>
                          {formatDateRange(trip.startDate, trip.endDate)}
                        </p>
                      )}
                   </div>
                   <div className="flex items-center space-x-2">
                      <span className="bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs font-semibold">
                         {trip.durationDays} 天
                      </span>
                      <i className={`fas fa-chevron-down text-white transition-transform duration-300 ${expandedId === trip.id ? 'rotate-180' : ''}`}></i>
                   </div>
                </div>
              </div>
            </div>

            {/* Details Section (Accordion) */}
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                expandedId === trip.id ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-4 bg-gray-50/50">
                {trip.plans.map((dayPlan, idx) => {
                  const isEditing = editingKey === `${trip.id}-${idx}`;
                  const hasNote = dayPlan.note || (dayPlan.images && dayPlan.images.length > 0);
                  
                  return (
                    <div key={dayPlan.day} className="mb-6 last:mb-0 relative pl-6 border-l-2 border-blue-200 ml-2">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>
                      
                      <div className="mb-4">
                         <div className="flex items-baseline space-x-2">
                            <h4 className="text-base font-bold text-gray-900">
                               第 {dayPlan.day} 天
                            </h4>
                            {dayPlan.date && (
                               <span className="text-xs text-gray-500 font-medium">
                                  {formatDayDate(dayPlan.date)}
                               </span>
                            )}
                         </div>
                         <p className="text-sm font-semibold text-blue-600">{dayPlan.title}</p>
                      </div>

                      <ul className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3">
                        {dayPlan.activities.map((act, actIdx) => (
                          <li key={actIdx} className="text-gray-700 text-sm flex items-start">
                             <div className="flex-shrink-0 w-16 text-xs font-bold text-gray-400 pt-1 font-mono text-right mr-3">
                                {act.time}
                             </div>
                             <div className="flex-1 relative pl-4 border-l-2 border-indigo-100 pb-1">
                                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-400"></div>
                                <span className="leading-relaxed block text-gray-800">{act.description}</span>
                             </div>
                          </li>
                        ))}
                      </ul>

                      {/* Note Section */}
                      <div className="mt-2">
                        {isEditing ? (
                          <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 animate-fade-in">
                            <label className="text-xs font-bold text-yellow-700 mb-1 block">备注:</label>
                            <textarea
                              value={tempNote}
                              onChange={(e) => setTempNote(e.target.value)}
                              className="w-full text-sm bg-white border border-yellow-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-2 text-gray-700"
                              rows={3}
                              placeholder="输入您的笔记..."
                              autoFocus
                            />
                            
                            {/* Image Editing Area */}
                            <div className="mb-3">
                                <div className="flex flex-wrap gap-2">
                                    {tempImages.map((img, i) => (
                                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-yellow-200 group">
                                            <img src={img} alt="note" className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => removeImage(i)}
                                                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={triggerFileInput}
                                        className="w-16 h-16 rounded-lg border-2 border-dashed border-yellow-300 flex flex-col items-center justify-center text-yellow-600 hover:bg-yellow-100 transition-colors"
                                    >
                                        <i className="fas fa-camera text-sm mb-1"></i>
                                        <span className="text-[9px]">添加</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={cancelEditing}
                                className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-200"
                              >
                                取消
                              </button>
                              <button 
                                onClick={() => saveNote(trip.id, idx)}
                                className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-yellow-600 shadow-sm"
                              >
                                保存
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={(e) => {
                                // Don't trigger edit if clicking on an image
                                const target = e.target as HTMLElement;
                                if(target.tagName !== 'IMG') {
                                    startEditing(trip.id, idx, dayPlan.note, dayPlan.images);
                                }
                            }}
                            className={`group cursor-pointer rounded-xl border border-dashed transition-all p-3 ${
                              hasNote 
                                ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-400' 
                                : 'bg-transparent border-gray-300 hover:border-blue-400 hover:bg-blue-50 flex items-center'
                            }`}
                          >
                             {!hasNote && <i className="fas fa-sticky-note mt-0.5 mr-2 text-sm text-gray-300 group-hover:text-blue-400"></i>}
                             
                             <div className="flex-1">
                               {hasNote ? (
                                 <div>
                                     <div className="flex items-center justify-between mb-1 pointer-events-none">
                                         <span className="text-xs font-bold text-yellow-600 flex items-center">
                                            <i className="fas fa-sticky-note mr-1"></i> 备注
                                         </span>
                                         <i className="fas fa-pencil-alt text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                     </div>
                                     {dayPlan.note && (
                                         <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-2 pointer-events-none">{dayPlan.note}</p>
                                     )}
                                     {dayPlan.images && dayPlan.images.length > 0 && (
                                         <div className="flex flex-wrap gap-2 mt-2">
                                             {dayPlan.images.map((img, i) => (
                                                 <img 
                                                   key={i} 
                                                   src={img} 
                                                   alt="note attachment" 
                                                   className="w-16 h-16 rounded-lg object-cover border border-yellow-200 cursor-zoom-in hover:opacity-90 transition-opacity" 
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
                                 <p className="text-sm text-gray-400 group-hover:text-blue-500">添加备注或图片...</p>
                               )}
                             </div>
                          </div>
                        )}
                      </div>

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
