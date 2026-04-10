import React, { useState } from 'react';
import { Rally } from '../../types';
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

export const AdminStartList: React.FC<{ rally: Rally; setRally: React.Dispatch<React.SetStateAction<Rally>> }> = ({ rally, setRally }) => {
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
        <h3 className="text-lg font-semibold text-gray-800">Start List Order</h3>
        <p className="text-sm text-gray-500">
          Define the starting order of participants. This order will be respected in the Time Entry tab, 
          making it easier to enter times sequentially as cars arrive. You can drag and drop rows to reorder them.
        </p>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <th className="px-4 py-3 font-medium w-20 text-center">Order</th>
              <th className="px-4 py-3 font-medium">Driver / Co-Driver</th>
              <th className="px-4 py-3 font-medium">Car</th>
              <th className="px-4 py-3 font-medium w-32 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rally.participants.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No participants added yet.</td></tr>
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
                  draggedIndex === index ? 'opacity-50 bg-gray-100' : 'hover:bg-gray-50'
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
                  <div className="font-medium text-gray-900">{p.driverName}</div>
                  {p.hasCoDriver && <div className="text-xs text-gray-500">{p.coDriverName}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.car}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => moveParticipant(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button 
                      onClick={() => moveParticipant(index, 'down')}
                      disabled={index === rally.participants.length - 1}
                      className="p-1 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
                      title="Move Down"
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
