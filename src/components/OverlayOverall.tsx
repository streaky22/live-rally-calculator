import React from 'react';
import { Rally } from '../types';
import { calculateOverallResults } from '../utils/calculations';
import { formatTimeMs, formatDiffMs } from '../utils/formatters';
import { useLanguage } from '../contexts/LanguageContext';

interface OverlayOverallProps {
  rally: Rally;
}

export const OverlayOverall: React.FC<OverlayOverallProps> = ({ rally }) => {
  const { t } = useLanguage();
  const urlStageId = new URLSearchParams(window.location.search).get('stageId');
  
  const stageIndex = rally.stages.findIndex(s => 
    s.id === urlStageId || 
    s.identifier.toLowerCase() === urlStageId?.toLowerCase()
  );
  
  const stage = stageIndex >= 0 ? rally.stages[stageIndex] : null;

  if (!stage) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-transparent">
        <div className="bg-slate-900/90 p-6 rounded-xl border-l-4 border-red-500 shadow-2xl">
          <h2 className="text-white font-bold text-xl mb-2">{t('configError')}</h2>
          <p className="text-slate-300">{t('stageNotFoundOverall')}</p>
          <p className="text-slate-400 text-sm mt-2">{t('makeSureToAdd')} <code className="bg-black px-1 rounded text-blue-400">&stageId=SS1</code> a la URL en OBS.</p>
        </div>
      </div>
    );
  }

  const results = calculateOverallResults(rally, stageIndex);
  const validResults = results.filter(r => !r.isDnf).slice(0, 10); // Top 10

  return (
    <div className="w-screen h-screen flex flex-col justify-start items-start p-8 bg-transparent">
      <div className="bg-slate-900/80 backdrop-blur-sm border-l-4 border-blue-500 p-4 rounded-r-lg shadow-xl mb-4 w-[500px]">
        <h2 className="text-white text-2xl font-bold uppercase tracking-wider">{t('overallAfterStage')} {stage.identifier}</h2>
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest">{t('overallClassificationTop10')}</p>
      </div>

      <div className="flex flex-col gap-1 w-[500px]">
        {validResults.map((row, index) => (
          <div 
            key={row.participantId} 
            className={`flex items-center justify-between px-4 py-2 rounded-r-lg shadow-lg backdrop-blur-sm border-l-4 ${
              index === 0 ? 'bg-blue-600/90 border-blue-400' : 'bg-slate-800/80 border-slate-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-white font-bold w-6 text-center">{row.pos}</span>
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg leading-tight">{row.driverName}</span>
                <span className="text-slate-300 text-xs">{row.car}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white font-mono font-bold text-lg leading-tight">
                {formatTimeMs(row.timeMs)}
              </span>
              <span className={`text-xs font-mono font-bold ${index === 0 ? 'text-blue-200' : 'text-blue-400'}`}>
                {index === 0 ? '-' : `+${formatDiffMs(row.diffFirstMs)}`}
              </span>
            </div>
          </div>
        ))}
        {validResults.length === 0 && (
          <div className="bg-slate-800/80 backdrop-blur-sm border-l-4 border-slate-500 p-4 rounded-r-lg shadow-lg">
            <p className="text-slate-300 italic">{t('noTimesRecorded')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
