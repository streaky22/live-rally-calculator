import React, { useState } from 'react';
import { Rally, Participant } from '../../types';
import { Edit2, Save, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const AdminParticipants: React.FC<{ rally: Rally; setRally: React.Dispatch<React.SetStateAction<Rally>> }> = ({ rally, setRally }) => {
  const { t } = useLanguage();
  const [driverName, setDriverName] = useState('');
  const [hasCoDriver, setHasCoDriver] = useState(false);
  const [coDriverName, setCoDriverName] = useState('');
  const [car, setCar] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDriverName, setEditDriverName] = useState('');
  const [editHasCoDriver, setEditHasCoDriver] = useState(false);
  const [editCoDriverName, setEditCoDriverName] = useState('');
  const [editCar, setEditCar] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !car) return;
    
    const newParticipant: Participant = {
      id: Date.now().toString(),
      driverName,
      hasCoDriver,
      coDriverName: hasCoDriver ? coDriverName : undefined,
      car
    };

    setRally(prev => ({ ...prev, participants: [...prev.participants, newParticipant] }));
    setDriverName('');
    setHasCoDriver(false);
    setCoDriverName('');
    setCar('');
  };

  const handleRemove = (id: string) => {
    setRally(prev => ({ ...prev, participants: prev.participants.filter(p => p.id !== id) }));
  };

  const startEdit = (p: Participant) => {
    setEditingId(p.id);
    setEditDriverName(p.driverName);
    setEditHasCoDriver(p.hasCoDriver);
    setEditCoDriverName(p.coDriverName || '');
    setEditCar(p.car);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    if (!editDriverName || !editCar) return;
    if (editHasCoDriver && !editCoDriverName) return;

    setRally(prev => ({
      ...prev,
      participants: prev.participants.map(p => p.id === id ? {
        ...p,
        driverName: editDriverName,
        hasCoDriver: editHasCoDriver,
        coDriverName: editHasCoDriver ? editCoDriverName : undefined,
        car: editCar
      } : p)
    }));
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('tabParticipants')}</h3>
      
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('driver')}</label>
          <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('car')}</label>
          <input type="text" value={car} onChange={e => setCar(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md" required />
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <input type="checkbox" id="hasCoDriver" checked={hasCoDriver} onChange={e => setHasCoDriver(e.target.checked)} className="rounded border-gray-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500" />
          <label htmlFor="hasCoDriver" className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Co-Driver</label>
        </div>
        {hasCoDriver && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Co-Driver Name</label>
            <input type="text" value={coDriverName} onChange={e => setCoDriverName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md" required={hasCoDriver} />
          </div>
        )}
        <div className="md:col-span-2 flex justify-end">
          <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors">{t('addParticipant')}</button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-slate-700">
              <th className="px-4 py-3 font-medium">{t('driver')}</th>
              <th className="px-4 py-3 font-medium">Co-Driver</th>
              <th className="px-4 py-3 font-medium">{t('car')}</th>
              <th className="px-4 py-3 font-medium text-right w-32">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {rally.participants.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{t('noParticipants')}</td></tr>
            )}
            {rally.participants.map(p => (
              <tr key={p.id}>
                {editingId === p.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={editDriverName} 
                        onChange={e => setEditDriverName(e.target.value)} 
                        className="w-full px-2 py-1 border border-orange-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" 
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <input 
                            type="checkbox" 
                            checked={editHasCoDriver} 
                            onChange={e => setEditHasCoDriver(e.target.checked)} 
                            className="rounded border-gray-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500"
                          />
                          Has Co-Driver
                        </label>
                        {editHasCoDriver && (
                          <input 
                            type="text" 
                            value={editCoDriverName} 
                            onChange={e => setEditCoDriverName(e.target.value)} 
                            placeholder="Co-Driver Name"
                            className="w-full px-2 py-1 border border-orange-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm" 
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={editCar} 
                        onChange={e => setEditCar(e.target.value)} 
                        className="w-full px-2 py-1 border border-orange-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" 
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => saveEdit(p.id)} className="text-green-600 hover:text-green-800 p-1" title={t('save')}>
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
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{p.driverName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.hasCoDriver ? p.coDriverName : '-'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.car}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => startEdit(p)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                          <Edit2 size={14} /> {t('edit')}
                        </button>
                        <button onClick={() => handleRemove(p.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">
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
