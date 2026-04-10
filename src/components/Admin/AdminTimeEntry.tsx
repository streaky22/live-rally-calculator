import React, { useState, useEffect, useRef } from 'react';
import { Rally, StageTime } from '../../types';
import { FastTimeInput } from '../FastTimeInput';
import { Check, Save, ChevronDown, X } from 'lucide-react';

const PenaltySelect: React.FC<{
  rally: Rally;
  selectedIds: string[];
  onChange: (id: string) => void;
}> = ({ rally, selectedIds, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timePenalties = rally.penaltyConfigs.filter(p => p.type === 'TIME');

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)} 
        className="w-full text-left px-3 py-2 border border-gray-300 rounded-md bg-white text-sm flex justify-between items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        <span className="truncate text-gray-700">
          {selectedIds.filter(id => timePenalties.some(p => p.id === id)).length === 0 ? 'No Penalty' : `${selectedIds.filter(id => timePenalties.some(p => p.id === id)).length} selected`}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg p-2 max-h-48 overflow-y-auto">
          {timePenalties.length === 0 ? (
            <div className="text-xs text-gray-500 p-2 italic">No time penalties defined</div>
          ) : (
            timePenalties.map(pen => (
              <label key={pen.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer text-sm rounded-md">
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(pen.id)} 
                  onChange={() => onChange(pen.id)} 
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-gray-700">{pen.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const AdminTimeEntry: React.FC<{ rally: Rally; setRally: React.Dispatch<React.SetStateAction<Rally>> }> = ({ rally, setRally }) => {
  const [activeStageId, setActiveStageId] = useState<string>(rally.stages[0]?.id || '');
  const [localTimes, setLocalTimes] = useState<Record<string, number | null>>({});
  const [localPenalties, setLocalPenalties] = useState<Record<string, string[]>>({});
  const [localDnf, setLocalDnf] = useState<Record<string, boolean>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  const activeStageIndex = rally.stages.findIndex(s => s.id === activeStageId);
  const previousStages = rally.stages.slice(0, activeStageIndex);
  const previousStageIds = previousStages.map(s => s.id);

  const retiredParticipantIds = new Set<string>();
  rally.stageTimes.forEach(st => {
    if (st.isDnf && previousStageIds.includes(st.stageId)) {
      retiredParticipantIds.add(st.participantId);
    }
  });

  const superRallyConfig = rally.penaltyConfigs.find(p => p.type === 'SUPER_RALLY');

  useEffect(() => {
    if (!activeStageId) return;
    
    const timesForStage = rally.stageTimes.filter(st => st.stageId === activeStageId);
    
    const newLocalTimes: Record<string, number | null> = {};
    const newLocalPenalties: Record<string, string[]> = {};
    const newLocalDnf: Record<string, boolean> = {};
    const newConfirmed: Record<string, boolean> = {};
    
    timesForStage.forEach(st => {
      newLocalTimes[st.participantId] = st.timeMs;
      if (st.penaltyConfigIds) {
        newLocalPenalties[st.participantId] = st.penaltyConfigIds;
      }
      if (st.isDnf) {
        newLocalDnf[st.participantId] = true;
      }
      newConfirmed[st.participantId] = true;
    });
    
    setLocalTimes(newLocalTimes);
    setLocalPenalties(newLocalPenalties);
    setLocalDnf(newLocalDnf);
    setConfirmed(newConfirmed);
  }, [activeStageId, rally.stageTimes]);

  const handleTimeChange = (participantId: string, timeMs: number | null) => {
    setLocalTimes(prev => ({ ...prev, [participantId]: timeMs }));
    setConfirmed(prev => ({ ...prev, [participantId]: false }));
  };

  const handlePenaltyToggle = (participantId: string, penaltyId: string) => {
    setLocalPenalties(prev => {
      const current = prev[participantId] || [];
      if (current.includes(penaltyId)) {
        return { ...prev, [participantId]: current.filter(id => id !== penaltyId) };
      } else {
        return { ...prev, [participantId]: [...current, penaltyId] };
      }
    });
    setConfirmed(prev => ({ ...prev, [participantId]: false }));
  };

  const handleSuperRallyToggle = (participantId: string) => {
    if (!superRallyConfig) {
      alert("Please define a Super Rally penalty in the Penalties tab first.");
      return;
    }
    setLocalPenalties(prev => {
      const current = prev[participantId] || [];
      if (current.includes(superRallyConfig.id)) {
        return { ...prev, [participantId]: current.filter(id => id !== superRallyConfig.id) };
      } else {
        return { ...prev, [participantId]: [...current, superRallyConfig.id] };
      }
    });
    setLocalDnf(prev => {
      if (!prev[participantId]) return prev;
      return { ...prev, [participantId]: false };
    });
    setConfirmed(prev => ({ ...prev, [participantId]: false }));
  };

  const handleDnfToggle = (participantId: string) => {
    setLocalDnf(prev => ({ ...prev, [participantId]: !prev[participantId] }));
    if (superRallyConfig) {
      setLocalPenalties(prev => {
        const current = prev[participantId] || [];
        if (current.includes(superRallyConfig.id)) {
          return { ...prev, [participantId]: current.filter(id => id !== superRallyConfig.id) };
        }
        return prev;
      });
    }
    setConfirmed(prev => ({ ...prev, [participantId]: false }));
  };

  const handleSaveRow = (participantId: string) => {
    const isDnf = localDnf[participantId] || false;
    const penalties = localPenalties[participantId] || [];
    const hasSuperRally = penalties.some(pId => rally.penaltyConfigs.find(p => p.id === pId)?.type === 'SUPER_RALLY');
    
    let timeMs = localTimes[participantId];
    
    if (isDnf || hasSuperRally) {
      timeMs = 0; // Time is irrelevant or calculated later
    } else if (timeMs == null) {
      return; // Need time if not DNF and not SR+
    }

    setRally(prev => {
      const otherStageTimes = prev.stageTimes.filter(st => !(st.stageId === activeStageId && st.participantId === participantId));
      
      const newStageTime: StageTime = {
        id: `${activeStageId}-${participantId}`,
        participantId,
        stageId: activeStageId,
        timeMs: timeMs!,
        penaltyConfigIds: penalties,
        isDnf
      };

      return {
        ...prev,
        stageTimes: [...otherStageTimes, newStageTime]
      };
    });
    
    setConfirmed(prev => ({ ...prev, [participantId]: true }));
  };

  if (rally.stages.length === 0) {
    return <div className="text-center py-8 text-gray-500">Please add stages first in the "Rally & Stages" tab.</div>;
  }

  if (rally.participants.length === 0) {
    return <div className="text-center py-8 text-gray-500">Please add participants first in the "Participants" tab.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-800">Enter Stage Times</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {rally.stages.map(stage => (
            <button
              key={stage.id}
              onClick={() => setActiveStageId(stage.id)}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-colors whitespace-nowrap ${
                activeStageId === stage.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {stage.identifier} - {stage.name}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-visible pb-32">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <th className="px-4 py-3 font-medium">Driver / Co-Driver</th>
              <th className="px-4 py-3 font-medium">Car</th>
              <th className="px-4 py-3 font-medium w-48 text-center">Status</th>
              <th className="px-4 py-3 font-medium w-48">Time</th>
              <th className="px-4 py-3 font-medium w-64">Penalties</th>
              <th className="px-4 py-3 font-medium w-24 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rally.participants.map(p => {
              const isRetired = retiredParticipantIds.has(p.id);
              
              if (isRetired) {
                return (
                  <tr key={p.id} className="bg-gray-50 opacity-60">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900 line-through">{p.driverName}</div>
                      {p.hasCoDriver && <div className="text-xs text-gray-500 line-through">{p.coDriverName}</div>}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 line-through">
                      {p.car}
                    </td>
                    <td className="px-4 py-4 text-center" colSpan={4}>
                      <span className="text-red-600 font-bold text-sm uppercase tracking-wider">Retired (DNF in previous stage)</span>
                    </td>
                  </tr>
                );
              }

              const isConfirmed = confirmed[p.id];
              const isDnf = localDnf[p.id] || false;
              const penalties = localPenalties[p.id] || [];
              const hasSuperRally = penalties.some(pId => rally.penaltyConfigs.find(pen => pen.id === pId)?.type === 'SUPER_RALLY');
              const hasTime = localTimes[p.id] != null;
              
              const canSave = isDnf || hasSuperRally || hasTime;
              const inputDisabled = isDnf || hasSuperRally;
              
              return (
                <tr key={p.id} className={`transition-colors ${isConfirmed ? 'bg-green-50/30' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900">{p.driverName}</div>
                    {p.hasCoDriver && <div className="text-xs text-gray-500">{p.coDriverName}</div>}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {p.car}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDnfToggle(p.id)}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                          isDnf ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        DNF
                      </button>
                      <button
                        onClick={() => handleSuperRallyToggle(p.id)}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                          hasSuperRally ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        SR+
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <FastTimeInput 
                      key={`${activeStageId}-${p.id}`}
                      value={inputDisabled ? null : (localTimes[p.id] || null)} 
                      onChange={(ms) => handleTimeChange(p.id, ms)} 
                      disabled={inputDisabled}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <PenaltySelect 
                      rally={rally}
                      selectedIds={penalties}
                      onChange={(penId) => handlePenaltyToggle(p.id, penId)}
                    />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleSaveRow(p.id)}
                      disabled={!canSave || isConfirmed}
                      className={`p-2 rounded-full transition-colors ${
                        isConfirmed 
                          ? 'bg-green-100 text-green-600 cursor-default' 
                          : canSave 
                            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      title={isConfirmed ? "Saved" : "Save Time"}
                    >
                      {isConfirmed ? <Check size={20} /> : <Save size={20} />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
