import React, { useState, useEffect } from 'react';
import { Rally, TCPenalty, PenaltyConfig } from '../../types';
import { Check, Clock, AlertTriangle } from 'lucide-react';
import { formatTimeMs } from '../../utils/formatters';
import { useLanguage } from '../../contexts/LanguageContext';

export const AdminTCEntry: React.FC<{ rally: Rally; setRally: React.Dispatch<React.SetStateAction<Rally>> }> = ({ rally, setRally }) => {
  const { t } = useLanguage();
  const [activeTcId, setActiveTcId] = useState<string>(rally.timeControls?.[0]?.id || '');
  const [showModal, setShowModal] = useState<{ participantId: string, type: 'EARLY' | 'LATE' } | null>(null);
  const [minutes, setMinutes] = useState<string>('1');
  const [selectedPenaltyId, setSelectedPenaltyId] = useState<string>('');

  useEffect(() => {
    if (rally.timeControls && rally.timeControls.length > 0 && !activeTcId) {
      setActiveTcId(rally.timeControls[0].id);
    }
  }, [rally.timeControls, activeTcId]);

  const handleApplyPenalty = () => {
    if (!showModal || !selectedPenaltyId) return;

    const penaltyConfig = rally.penaltyConfigs.find(p => p.id === selectedPenaltyId);
    if (!penaltyConfig) return;

    let calculatedTimeMs = penaltyConfig.timeValueMs;
    let mins = undefined;

    if (penaltyConfig.calculationMethod === 'PER_MINUTE') {
      mins = parseInt(minutes, 10);
      if (isNaN(mins) || mins <= 0) {
        alert("Please enter a valid number of minutes.");
        return;
      }
      calculatedTimeMs = penaltyConfig.timeValueMs * mins;
    }

    const newPenalty: TCPenalty = {
      id: `${activeTcId}-${showModal.participantId}`,
      participantId: showModal.participantId,
      tcId: activeTcId,
      penaltyConfigId: selectedPenaltyId,
      calculatedTimeMs,
      type: showModal.type
    };

    if (mins !== undefined) {
      newPenalty.minutes = mins;
    }

    setRally(prev => {
      const otherPenalties = (prev.tcPenalties || []).filter(p => !(p.tcId === activeTcId && p.participantId === showModal.participantId));
      return {
        ...prev,
        tcPenalties: [...otherPenalties, newPenalty]
      };
    });

    setShowModal(null);
    setMinutes('1');
  };

  const handleSetOk = (participantId: string) => {
    setRally(prev => {
      const otherPenalties = (prev.tcPenalties || []).filter(p => !(p.tcId === activeTcId && p.participantId === participantId));
      return {
        ...prev,
        tcPenalties: [...otherPenalties, {
          id: `${activeTcId}-${participantId}`,
          participantId,
          tcId: activeTcId,
          calculatedTimeMs: 0,
          type: 'OK'
        }]
      };
    });
  };

  const openModal = (participantId: string, type: 'EARLY' | 'LATE') => {
    const relevantConfigs = rally.penaltyConfigs.filter(p => p.type === (type === 'EARLY' ? 'TC_EARLY' : 'TC_LATE'));
    if (relevantConfigs.length === 0) {
      alert(type === 'EARLY' ? t('defineTCEarly') : t('defineTCLate'));
      return;
    }
    setSelectedPenaltyId(relevantConfigs[0].id);
    setMinutes('1');
    setShowModal({ participantId, type });
  };

  if (!rally.timeControls || rally.timeControls.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('addTCsFirst')}</div>;
  }

  if (rally.participants.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('addParticipantsFirst')}</div>;
  }

  const activeTc = rally.timeControls.find(tc => tc.id === activeTcId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('tcEntry')}</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {rally.timeControls.map(tc => (
            <button
              key={tc.id}
              onClick={() => setActiveTcId(tc.id)}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-colors whitespace-nowrap ${
                activeTcId === tc.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-700 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {tc.identifier} - {tc.name}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-32">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-slate-700">
              <th className="px-4 py-3 font-medium w-16 text-center">{t('order')}</th>
              <th className="px-4 py-3 font-medium">{t('driverCoDriver')}</th>
              <th className="px-4 py-3 font-medium">{t('car')}</th>
              <th className="px-4 py-3 font-medium w-64 text-center">{t('status')}</th>
              <th className="px-4 py-3 font-medium w-48 text-right">{t('penalty')}</th>
              <th className="px-4 py-3 font-medium w-24 text-center">{t('action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {rally.participants.map((p, index) => {
              const existingRecord = (rally.tcPenalties || []).find(pen => pen.tcId === activeTcId && pen.participantId === p.id);
              const isOk = existingRecord?.type === 'OK';
              const isEarly = existingRecord?.type === 'EARLY';
              const isLate = existingRecord?.type === 'LATE';
              const isMarked = !!existingRecord;

              return (
                <tr key={p.id} className={`transition-colors ${isMarked ? (isOk ? 'bg-green-50/30' : 'bg-orange-50/30') : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}>
                  <td className="px-4 py-4 text-center font-bold text-gray-400">{index + 1}</td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{p.driverName}</div>
                    {p.hasCoDriver && <div className="text-xs text-gray-500 dark:text-gray-400">{p.coDriverName}</div>}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {p.car}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openModal(p.id, 'EARLY')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          isEarly ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600 dark:text-gray-400 hover:bg-gray-300'
                        }`}
                      >
                        {t('early')}
                      </button>
                      <button
                        onClick={() => handleSetOk(p.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          isOk ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600 dark:text-gray-400 hover:bg-gray-300'
                        }`}
                      >
                        OK
                      </button>
                      <button
                        onClick={() => openModal(p.id, 'LATE')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          isLate ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 dark:text-gray-400 hover:bg-gray-300'
                        }`}
                      >
                        {t('late')}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {existingRecord && existingRecord.type !== 'OK' ? (
                      <div className="flex flex-col items-end">
                        <span className={`font-mono font-bold ${existingRecord.type === 'EARLY' ? 'text-orange-600' : 'text-red-600'}`}>
                          +{formatTimeMs(existingRecord.calculatedTimeMs)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {existingRecord.minutes ? `${existingRecord.minutes} min` : t('fixedTime')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className={`inline-flex p-2 rounded-full transition-colors ${
                      isMarked 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 dark:bg-slate-950 text-gray-400'
                    }`}>
                      {isMarked ? <Check size={20} /> : <div className="w-5 h-5" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${showModal.type === 'EARLY' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                <Clock size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {showModal.type === 'EARLY' ? t('arrivedEarly') : t('arrivedLate')}
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('selectPenaltyRule')}</label>
                <select 
                  value={selectedPenaltyId} 
                  onChange={e => setSelectedPenaltyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900"
                >
                  {rally.penaltyConfigs
                    .filter(p => p.type === (showModal.type === 'EARLY' ? 'TC_EARLY' : 'TC_LATE'))
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.calculationMethod === 'PER_MINUTE' ? `+${p.timeValueMs / 1000}s/min` : `+${p.timeValueMs / 1000}s fixed`})
                      </option>
                    ))}
                </select>
              </div>

              {rally.penaltyConfigs.find(p => p.id === selectedPenaltyId)?.calculationMethod === 'PER_MINUTE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('minutes')} {showModal.type === 'EARLY' ? t('early') : t('late')}</label>
                  <input 
                    type="number" 
                    min="1"
                    value={minutes} 
                    onChange={e => setMinutes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowModal(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-md transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={handleApplyPenalty}
                  className={`px-4 py-2 text-white rounded-md transition-colors ${showModal.type === 'EARLY' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {t('applyPenalty')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
