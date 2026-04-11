import React, { useState } from 'react';
import { Rally, PenaltyConfig, PenaltyType, CalculationMethod } from '../../types';
import { Edit2, Save, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const AdminPenalties: React.FC<{ rally: Rally; setRally: React.Dispatch<React.SetStateAction<Rally>> }> = ({ rally, setRally }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [type, setType] = useState<PenaltyType>('TIME');
  const [timeValueStr, setTimeValueStr] = useState('');
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>('FIXED');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<PenaltyType>('TIME');
  const [editTimeValueStr, setEditTimeValueStr] = useState('');
  const [editCalculationMethod, setEditCalculationMethod] = useState<CalculationMethod>('FIXED');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !timeValueStr) return;
    
    const timeValueMs = parseFloat(timeValueStr) * 1000;

    const newPenalty: PenaltyConfig = {
      id: Date.now().toString(),
      name,
      type,
      timeValueMs,
      calculationMethod: (type === 'TC_LATE' || type === 'TC_EARLY') ? calculationMethod : undefined
    };

    setRally(prev => ({ ...prev, penaltyConfigs: [...prev.penaltyConfigs, newPenalty] }));
    setName('');
    setTimeValueStr('');
    setType('TIME');
    setCalculationMethod('FIXED');
  };

  const handleRemove = (id: string) => {
    setRally(prev => ({ ...prev, penaltyConfigs: prev.penaltyConfigs.filter(p => p.id !== id) }));
  };

  const startEdit = (p: PenaltyConfig) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditType(p.type);
    setEditTimeValueStr((p.timeValueMs / 1000).toString());
    setEditCalculationMethod(p.calculationMethod || 'FIXED');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    if (!editName || !editTimeValueStr) return;
    const timeValueMs = parseFloat(editTimeValueStr) * 1000;
    setRally(prev => ({
      ...prev,
      penaltyConfigs: prev.penaltyConfigs.map(p => p.id === id ? {
        ...p,
        name: editName,
        type: editType,
        timeValueMs,
        calculationMethod: (editType === 'TC_LATE' || editType === 'TC_EARLY') ? editCalculationMethod : undefined
      } : p)
    }));
    setEditingId(null);
  };

  const isTC = type === 'TC_LATE' || type === 'TC_EARLY';

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('tabPenalties')}</h3>
      
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('penaltyName')}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jump Start" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('penaltyType')}</label>
          <select value={type} onChange={e => setType(e.target.value as PenaltyType)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900">
            <option value="TIME">Fixed Time</option>
            <option value="SUPER_RALLY">Super Rally (SR+)</option>
            <option value="TC_LATE">TC Late (Tarde)</option>
            <option value="TC_EARLY">TC Early (Pronto)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('penaltyValue')}</label>
          <input type="number" step="0.1" value={timeValueStr} onChange={e => setTimeValueStr(e.target.value)} placeholder="e.g. 10" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md" required />
        </div>
        
        {isTC && (
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('calculationMethod')}</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" checked={calculationMethod === 'FIXED'} onChange={() => setCalculationMethod('FIXED')} className="text-orange-600 focus:ring-orange-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('fixedTime')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={calculationMethod === 'PER_MINUTE'} onChange={() => setCalculationMethod('PER_MINUTE')} className="text-orange-600 focus:ring-orange-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('perMinute')}</span>
              </label>
            </div>
          </div>
        )}

        <div className="md:col-span-4 flex justify-end">
          <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors">{t('addPenaltyConfig')}</button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-slate-700">
              <th className="px-4 py-3 font-medium">{t('name')}</th>
              <th className="px-4 py-3 font-medium">{t('penaltyType')}</th>
              <th className="px-4 py-3 font-medium">{t('penaltyValue')}</th>
              <th className="px-4 py-3 font-medium text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {rally.penaltyConfigs.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{t('noPenalties')}</td></tr>
            )}
            {rally.penaltyConfigs.map(p => (
              <tr key={p.id}>
                {editingId === p.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={e => setEditName(e.target.value)} 
                        className="w-full px-2 py-1 border border-orange-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" 
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select 
                        value={editType} 
                        onChange={e => setEditType(e.target.value as PenaltyType)} 
                        className="w-full px-2 py-1 border border-orange-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white dark:bg-slate-900"
                      >
                        <option value="TIME">Fixed Time</option>
                        <option value="SUPER_RALLY">Super Rally</option>
                        <option value="TC_LATE">TC Late</option>
                        <option value="TC_EARLY">TC Early</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          step="0.1" 
                          value={editTimeValueStr} 
                          onChange={e => setEditTimeValueStr(e.target.value)} 
                          className="w-20 px-2 py-1 border border-orange-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" 
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">s</span>
                        {(editType === 'TC_LATE' || editType === 'TC_EARLY') && (
                          <select 
                            value={editCalculationMethod} 
                            onChange={e => setEditCalculationMethod(e.target.value as CalculationMethod)} 
                            className="ml-1 px-1 py-1 border border-orange-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white dark:bg-slate-900 text-xs"
                          >
                            <option value="FIXED">Fixed</option>
                            <option value="PER_MINUTE">/ min</option>
                          </select>
                        )}
                      </div>
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
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        p.type === 'TIME' ? 'bg-blue-100 text-blue-800' : 
                        p.type === 'SUPER_RALLY' ? 'bg-purple-100 text-purple-800' :
                        p.type === 'TC_LATE' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {p.type === 'TIME' ? 'Fixed Time' : 
                         p.type === 'SUPER_RALLY' ? 'Super Rally' :
                         p.type === 'TC_LATE' ? 'TC Late' : 'TC Early'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-sm">
                      {p.type === 'SUPER_RALLY' ? `Base +${p.timeValueMs / 1000}s` : 
                       p.calculationMethod === 'PER_MINUTE' ? `+${p.timeValueMs / 1000}s / min` :
                       `+${p.timeValueMs / 1000}s`}
                    </td>
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
