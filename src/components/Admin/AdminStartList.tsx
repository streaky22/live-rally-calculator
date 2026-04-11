import React, { useState } from 'react';
import { Rally } from '../../types';
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const AdminStartList: React.FC<{ rally: Rally; setRally: React.Dispatch<React.SetStateAction<Rally>> }> = ({ rally, setRally }) => {
  const { t } = useLanguage();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const moveParticipant = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === rally.participants.length - 1) return;

    const newParticipants = [...rally.participants];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newParticipants[index];
    newParticipants[index] = newParticipants[targetIndex];
    newParticipants[targetIndex] = temp;

    setRally(prev => ({ ...prev, participants: newParticipants }));
  };

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    
    const newParticipants = [...rally.participants];
    const draggedItem = newParticipants[draggedIndex];
    
    newParticipants.splice(draggedIndex, 1);
    newParticipants.splice(index, 0, draggedItem);
    
    setRally(prev => ({ ...prev, participants: newParticipants }));
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('tabStartList')}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('startListDesc')}
        </p>
      </div>
      
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-slate-700">
              <th className="px-4 py-3 font-medium w-20 text-center">{t('order')}</th>
              <th className="px-4 py-3 font-medium">{t('driverCoDriver')}</th>
              <th className="px-4 py-3 font-medium">{t('car')}</th>
              <th className="px-4 py-3 font-medium w-32 text-center">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {rally.participants.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{t('noParticipants')}</td></tr>
            )}
            {rally.participants.map((p, index) => (
              <tr 
                key={p.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`transition-colors cursor-move ${
                  draggedIndex === index ? 'opacity-50 bg-gray-100 dark:bg-slate-950' : 'hover:bg-gray-50 dark:bg-slate-800/50'
                } ${
                  dragOverIndex === index && draggedIndex !== index 
                    ? dragOverIndex > draggedIndex! 
                      ? 'border-b-2 border-orange-500' 
                      : 'border-t-2 border-orange-500'
                    : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1 font-bold text-gray-400">
                    <GripVertical size={16} className="text-gray-300" />
                    {index + 1}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{p.driverName}</div>
                  {p.hasCoDriver && <div className="text-xs text-gray-500 dark:text-gray-400">{p.coDriverName}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.car}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => moveParticipant(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 dark:text-gray-400 transition-colors"
                      title={t('moveUp')}
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button 
                      onClick={() => moveParticipant(index, 'down')}
                      disabled={index === rally.participants.length - 1}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 dark:text-gray-400 transition-colors"
                      title={t('moveDown')}
                    >
                      <ArrowDown size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
