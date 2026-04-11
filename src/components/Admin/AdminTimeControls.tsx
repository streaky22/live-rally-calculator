import React, { useState } from 'react';
import { Rally, TimeControl } from '../../types';
import { Edit2, Save, X, GripVertical } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const AdminTimeControls: React.FC<{ rally: Rally; setRally: React.Dispatch<React.SetStateAction<Rally>> }> = ({ rally, setRally }) => {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIdentifier, setEditIdentifier] = useState('');
  const [editName, setEditName] = useState('');

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !name) return;
    
    const newTC: TimeControl = {
      id: Date.now().toString(),
      identifier,
      name
    };

    setRally(prev => ({ ...prev, timeControls: [...(prev.timeControls || []), newTC] }));
    setIdentifier('');
    setName('');
  };

  const handleRemove = (id: string) => {
    setRally(prev => ({ ...prev, timeControls: (prev.timeControls || []).filter(s => s.id !== id) }));
  };

  const startEdit = (tc: TimeControl) => {
    setEditingId(tc.id);
    setEditIdentifier(tc.identifier);
    setEditName(tc.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    if (!editIdentifier || !editName) return;
    setRally(prev => ({
      ...prev,
      timeControls: (prev.timeControls || []).map(tc => tc.id === id ? { ...tc, identifier: editIdentifier, name: editName } : tc)
    }));
    setEditingId(null);
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
    
    const newTCs = [...(rally.timeControls || [])];
    const draggedItem = newTCs[draggedIndex];
    
    newTCs.splice(draggedIndex, 1);
    newTCs.splice(index, 0, draggedItem);
    
    setRally(prev => ({ ...prev, timeControls: newTCs }));
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
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('tabTimeControls')}</h3>
      </div>
      
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID (e.g. TC1)</label>
          <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="e.g. TC1" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md" required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('tcName')}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Service Park Out" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md" required />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors">{t('addTC')}</button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-slate-700">
              <th className="px-4 py-3 font-medium w-10"></th>
              <th className="px-4 py-3 font-medium w-32">ID</th>
              <th className="px-4 py-3 font-medium">{t('name')}</th>
              <th className="px-4 py-3 font-medium text-right w-32">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {(!rally.timeControls || rally.timeControls.length === 0) && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{t('noTCs')}</td></tr>
            )}
            {(rally.timeControls || []).map((tc, index) => (
              <tr 
                key={tc.id}
                draggable={editingId !== tc.id}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`transition-colors ${editingId !== tc.id ? 'cursor-move' : ''} ${
                  draggedIndex === index ? 'opacity-50 bg-gray-100 dark:bg-slate-950' : 'hover:bg-gray-50 dark:bg-slate-800/50'
                } ${
                  dragOverIndex === index && draggedIndex !== index 
                    ? dragOverIndex > draggedIndex! 
                      ? 'border-b-2 border-orange-500' 
                      : 'border-t-2 border-orange-500'
                    : ''
                }`}
              >
                <td className="px-4 py-3 text-gray-300">
                  <GripVertical size={16} />
                </td>
                {editingId === tc.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={editIdentifier} 
                        onChange={e => setEditIdentifier(e.target.value)} 
                        className="w-full px-2 py-1 border border-orange-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" 
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={e => setEditName(e.target.value)} 
                        className="w-full px-2 py-1 border border-orange-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" 
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => saveEdit(tc.id)} className="text-green-600 hover:text-green-800 p-1" title={t('save')}>
                          <Save size={18} />
                        </button>
                        <button onClick={cancelEdit} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 p-1" title={t('cancel')}>
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{tc.identifier}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{tc.name}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => startEdit(tc)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                          <Edit2 size={14} /> {t('edit')}
                        </button>
                        <button onClick={() => handleRemove(tc.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
