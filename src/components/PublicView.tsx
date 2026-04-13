import React, { useState, useMemo } from 'react';
import { formatTimeMs, formatDiffMs } from '../utils/formatters';
import { Rally } from '../types';
import { calculateStageResults, calculateOverallResults } from '../utils/calculations';
import { useLanguage } from '../contexts/LanguageContext';

export const PublicView: React.FC<{ rally: Rally }> = ({ rally }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('Start Lists');
  const [activeStageId, setActiveStageId] = useState<string>(rally.stages[0]?.id || '');

  const tabs = [
    { id: 'Start Lists', label: t('tabStartList') },
    { id: 'Overall', label: t('overall') },
    { id: 'Stage Times', label: t('tabStageTimes') },
    { id: 'Stage Winners', label: t('stageWinners') },
    { id: 'Penalties', label: t('tabPenalties') },
    { id: 'Retirements', label: t('retirements') }
  ];
  
  React.useEffect(() => {
    if (rally.stages.length > 0 && !rally.stages.find(s => s.id === activeStageId)) {
      setActiveStageId(rally.stages[0].id);
    }
  }, [rally.stages, activeStageId]);

  const activeStageIndex = rally.stages.findIndex(s => s.id === activeStageId);
  const activeStage = rally.stages[activeStageIndex];

  const stageResults = useMemo(() => {
    if (!activeStageId) return [];
    return calculateStageResults(rally, activeStageId);
  }, [rally, activeStageId]);

  const overallResults = useMemo(() => {
    if (activeStageIndex === -1) return [];
    return calculateOverallResults(rally, activeStageIndex);
  }, [rally, activeStageIndex]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-gray-200 dark:border-slate-700 pb-2">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Stage Times' && (
        <div className="space-y-6">
          {rally.stages.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {rally.stages.map(stage => (
                <button
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-colors whitespace-nowrap ${
                    activeStageId === stage.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-700 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {stage.identifier}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 py-4">{t('noStagesYet')}</div>
          )}

          {activeStage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
                  <h3 className="text-white font-bold tracking-wide uppercase text-sm">{t('tabStageTimes')} - {activeStage.identifier}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 font-medium w-12 text-center">{t('pos')}</th>
                        <th className="px-4 py-2 font-medium">{t('driverCoDriver')}</th>
                        <th className="px-4 py-2 font-medium text-right">{t('time')}</th>
                        <th className="px-4 py-2 font-medium text-right">{t('diffPrev')}</th>
                        <th className="px-4 py-2 font-medium text-right">{t('diff1st')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {stageResults.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{t('noTimesRecorded')}</td></tr>
                      )}
                      {stageResults.filter(r => !r.isDnf).map((row) => (
                        <tr key={row.participantId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-gray-100">{row.pos}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900 dark:text-gray-100">{row.driverName}</div>
                            {row.coDriverName && <div className="text-xs text-gray-500 dark:text-gray-400">{row.coDriverName}</div>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-gray-900 dark:text-gray-100">
                            <div className="flex flex-col items-end">
                              <div className="flex items-center justify-end gap-2">
                                {row.hasSuperRally && <span className="text-red-600 text-[10px] font-bold px-1 bg-red-50 rounded border border-red-200">SR+</span>}
                                {formatTimeMs(row.timeMs)}
                              </div>
                              {row.penaltyTimeMs ? (
                                <div className="text-[10px] text-red-500 font-bold mt-0.5">
                                  (+{formatTimeMs(row.penaltyTimeMs)})
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-gray-500 dark:text-gray-400">
                            {row.diffPrevMs > 0 ? `+${formatDiffMs(row.diffPrevMs)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-orange-600 font-medium">
                            {row.diffFirstMs > 0 ? `+${formatDiffMs(row.diffFirstMs)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {stageResults.some(r => r.isDnf) && (
                    <details className="mt-4 border-t border-gray-200 dark:border-slate-700 group">
                      <summary className="bg-red-600 px-4 py-2 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden">
                        <h4 className="text-white font-bold tracking-wide uppercase text-xs">DNF ({stageResults.filter(r => r.isDnf).length})</h4>
                        <span className="text-white text-xs transform group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <table className="w-full text-left text-sm">
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                          {stageResults.filter(r => r.isDnf).map((row) => (
                            <tr key={row.participantId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-3">
                                <div className="font-bold text-gray-900 dark:text-gray-100">{row.driverName}</div>
                                {row.coDriverName && <div className="text-xs text-gray-500 dark:text-gray-400">{row.coDriverName}</div>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-orange-600 px-4 py-3 border-b border-orange-700">
                  <h3 className="text-white font-bold tracking-wide uppercase text-sm">{t('overallAfter')} {activeStage.identifier}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 font-medium w-16 text-center">{t('pos')}</th>
                        <th className="px-4 py-2 font-medium">{t('driverCoDriver')}</th>
                        <th className="px-4 py-2 font-medium text-right">{t('totalTime')}</th>
                        <th className="px-4 py-2 font-medium text-right">{t('diffPrev')}</th>
                        <th className="px-4 py-2 font-medium text-right">{t('diff1st')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {overallResults.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{t('noOverallResults')}</td></tr>
                      )}
                      {overallResults.filter(r => !r.isDnf).map((row) => (
                        <tr key={row.participantId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-bold text-gray-900 dark:text-gray-100">{row.pos}</span>
                              {row.change > 0 && <span className="text-green-500 text-xs">▲</span>}
                              {row.change < 0 && <span className="text-red-500 text-xs">▼</span>}
                              {row.change === 0 && <span className="text-gray-300 text-xs">-</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900 dark:text-gray-100">{row.driverName}</div>
                            {row.coDriverName && <div className="text-xs text-gray-500 dark:text-gray-400">{row.coDriverName}</div>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-gray-900 dark:text-gray-100">
                            <div className="flex flex-col items-end">
                              <div className="flex items-center justify-end gap-2">
                                {row.hasSuperRally && <span className="text-red-600 text-[10px] font-bold px-1 bg-red-50 rounded border border-red-200">SR+</span>}
                                {formatTimeMs(row.timeMs)}
                              </div>
                              {row.penaltyTimeMs ? (
                                <div className="text-[10px] text-red-500 font-bold mt-0.5">
                                  (+{formatTimeMs(row.penaltyTimeMs)})
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-gray-500 dark:text-gray-400">
                            {row.diffPrevMs > 0 ? `+${formatDiffMs(row.diffPrevMs)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-orange-600 font-medium">
                            {row.diffFirstMs > 0 ? `+${formatDiffMs(row.diffFirstMs)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {overallResults.some(r => r.isDnf) && (
                    <details className="mt-4 border-t border-gray-200 dark:border-slate-700 group">
                      <summary className="bg-red-600 px-4 py-2 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden">
                        <h4 className="text-white font-bold tracking-wide uppercase text-xs">DNF ({overallResults.filter(r => r.isDnf).length})</h4>
                        <span className="text-white text-xs transform group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                          <tr>
                            <th className="px-4 py-2 font-medium">{t('driver')}</th>
                            <th className="px-4 py-2 font-medium text-right">{t('stage')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                          {overallResults.filter(r => r.isDnf).map((row) => (
                            <tr key={row.participantId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-3">
                                <div className="font-bold text-gray-900 dark:text-gray-100">{row.driverName}</div>
                                {row.coDriverName && <div className="text-xs text-gray-500 dark:text-gray-400">{row.coDriverName}</div>}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-500 dark:text-gray-400">
                                {row.dnfStageIdentifier || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {activeTab === 'Overall' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-orange-600 px-4 py-3 border-b border-orange-700">
            <h3 className="text-white font-bold tracking-wide uppercase text-sm">{t('overallClassification')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium w-16 text-center">{t('pos')}</th>
                  <th className="px-4 py-2 font-medium">{t('driverCoDriver')}</th>
                  <th className="px-4 py-2 font-medium">{t('car')}</th>
                  <th className="px-4 py-2 font-medium text-right">{t('totalTime')}</th>
                  <th className="px-4 py-2 font-medium text-right">{t('diffPrev')}</th>
                  <th className="px-4 py-2 font-medium text-right">{t('diff1st')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {(() => {
                  const latestStageIndex = rally.stages.length - 1;
                  const latestOverall = calculateOverallResults(rally, latestStageIndex);
                  
                  if (latestOverall.length === 0) {
                    return <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{t('noOverallResults')}</td></tr>;
                  }

                  return (
                    <React.Fragment>
                      {latestOverall.filter(r => !r.isDnf).map((row) => (
                        <tr key={row.participantId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-bold text-gray-900 dark:text-gray-100">{row.pos}</span>
                              {row.change > 0 && <span className="text-green-500 text-xs">▲</span>}
                              {row.change < 0 && <span className="text-red-500 text-xs">▼</span>}
                              {row.change === 0 && <span className="text-gray-300 text-xs">-</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900 dark:text-gray-100">{row.driverName}</div>
                            {row.coDriverName && <div className="text-xs text-gray-500 dark:text-gray-400">{row.coDriverName}</div>}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.car}</td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-gray-900 dark:text-gray-100">
                            <div className="flex flex-col items-end">
                              <div className="flex items-center justify-end gap-2">
                                {row.hasSuperRally && <span className="text-red-600 text-[10px] font-bold px-1 bg-red-50 rounded border border-red-200">SR+</span>}
                                {formatTimeMs(row.timeMs)}
                              </div>
                              {row.penaltyTimeMs ? (
                                <div className="text-[10px] text-red-500 font-bold mt-0.5">
                                  (+{formatTimeMs(row.penaltyTimeMs)})
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-gray-500 dark:text-gray-400">
                            {row.diffPrevMs > 0 ? `+${formatDiffMs(row.diffPrevMs)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-orange-600 font-medium">
                            {row.diffFirstMs > 0 ? `+${formatDiffMs(row.diffFirstMs)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })()}
              </tbody>
            </table>
            
            {(() => {
              const latestStageIndex = rally.stages.length - 1;
              const latestOverall = calculateOverallResults(rally, latestStageIndex);
              
              if (latestOverall.some(r => r.isDnf)) {
                return (
                  <details className="mt-4 border-t border-gray-200 dark:border-slate-700 group">
                    <summary className="bg-red-600 px-4 py-2 cursor-pointer flex justify-between items-center list-none [&::-webkit-details-marker]:hidden">
                      <h4 className="text-white font-bold tracking-wide uppercase text-xs">DNF ({latestOverall.filter(r => r.isDnf).length})</h4>
                      <span className="text-white text-xs transform group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-2 font-medium">{t('driver')}</th>
                          <th className="px-4 py-2 font-medium">{t('car')}</th>
                          <th className="px-4 py-2 font-medium text-right">{t('stage')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {latestOverall.filter(r => r.isDnf).map((row) => (
                          <tr key={row.participantId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-900 dark:text-gray-100">{row.driverName}</div>
                              {row.coDriverName && <div className="text-xs text-gray-500 dark:text-gray-400">{row.coDriverName}</div>}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.car}</td>
                            <td className="px-4 py-3 text-right font-bold text-gray-500 dark:text-gray-400">
                              {row.dnfStageIdentifier || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}

      {activeTab === 'Stage Winners' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
            <h3 className="text-white font-bold tracking-wide uppercase text-sm">{t('stageWinners')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">{t('stage')}</th>
                  <th className="px-4 py-2 font-medium">{t('driver')}</th>
                  <th className="px-4 py-2 font-medium">{t('car')}</th>
                  <th className="px-4 py-2 font-medium text-right">{t('time')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {rally.stages.map(stage => {
                  const results = calculateStageResults(rally, stage.id).filter(r => !r.isDnf);
                  const winner = results[0];
                  return (
                    <tr key={stage.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">{stage.identifier} - {stage.name}</td>
                      {winner ? (
                        <>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900 dark:text-gray-100">{winner.driverName}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{winner.car}</td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-gray-900 dark:text-gray-100">
                            {formatTimeMs(winner.timeMs)}
                          </td>
                        </>
                      ) : (
                        <td colSpan={3} className="px-4 py-3 text-gray-500 dark:text-gray-400 italic">{t('noTimesRecorded')}</td>
                      )}
                    </tr>
                  );
                })}
                {rally.stages.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{t('noStagesYet')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Start Lists' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
            <h3 className="text-white font-bold tracking-wide uppercase text-sm">{t('tabStartList')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium w-16 text-center">#</th>
                  <th className="px-4 py-2 font-medium">{t('driverCoDriver')}</th>
                  <th className="px-4 py-2 font-medium">{t('car')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {rally.participants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-gray-100">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900 dark:text-gray-100">{p.driverName}</div>
                      {p.hasCoDriver && <div className="text-xs text-gray-500 dark:text-gray-400">{p.coDriverName}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.car}</td>
                  </tr>
                ))}
                {rally.participants.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{t('noParticipants')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === 'Penalties' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
            <h3 className="text-white font-bold tracking-wide uppercase text-sm">{t('tabPenalties')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">{t('driver')}</th>
                  <th className="px-4 py-2 font-medium">{t('location')}</th>
                  <th className="px-4 py-2 font-medium">{t('penalty')}</th>
                  <th className="px-4 py-2 font-medium text-right">{t('timeAdded')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {(() => {
                  const stagePenalties = rally.stageTimes
                    .filter(st => st.penaltyConfigIds && st.penaltyConfigIds.length > 0)
                    .flatMap(st => {
                      const participant = rally.participants.find(p => p.id === st.participantId);
                      const stage = rally.stages.find(s => s.id === st.stageId);
                      return st.penaltyConfigIds!.map(pId => {
                        const penalty = rally.penaltyConfigs.find(p => p.id === pId);
                        return { 
                          id: `${st.id}-${pId}`,
                          participant, 
                          location: stage?.identifier || '-', 
                          penalty,
                          timeAddedMs: penalty?.timeValueMs || 0,
                          isSuperRally: penalty?.type === 'SUPER_RALLY'
                        };
                      });
                    });

                  const tcPenaltiesList = (rally.tcPenalties || [])
                    .filter(tcp => tcp.type !== 'OK' && tcp.calculatedTimeMs > 0)
                    .map(tcp => {
                    const participant = rally.participants.find(p => p.id === tcp.participantId);
                    const tc = rally.timeControls?.find(t => t.id === tcp.tcId);
                    const penalty = rally.penaltyConfigs.find(p => p.id === tcp.penaltyConfigId);
                    return {
                      id: tcp.id,
                      participant,
                      location: tc?.identifier || '-',
                      penalty,
                      timeAddedMs: tcp.calculatedTimeMs,
                      isSuperRally: false
                    };
                  });

                  const allPenalties = [...stagePenalties, ...tcPenaltiesList];

                  if (allPenalties.length === 0) {
                    return <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{t('noPenaltiesRecorded')}</td></tr>;
                  }

                  return allPenalties.map((item, idx) => (
                    <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">{item.participant?.driverName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.location}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.penalty?.name}</td>
                      <td className="px-4 py-3 text-right font-mono text-orange-600">
                        {item.isSuperRally ? 'SR+' : `+${formatTimeMs(item.timeAddedMs)}`}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Retirements' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
            <h3 className="text-white font-bold tracking-wide uppercase text-sm">{t('retirements')} (DNF)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">{t('driver')}</th>
                  <th className="px-4 py-2 font-medium">{t('car')}</th>
                  <th className="px-4 py-2 font-medium">{t('stageOfRetirement')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {(() => {
                  const dnfList = rally.stageTimes.filter(st => st.isDnf);
                  
                  if (dnfList.length === 0) {
                    return <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{t('noRetirementsRecorded')}</td></tr>;
                  }

                  return dnfList.map(st => {
                    const participant = rally.participants.find(p => p.id === st.participantId);
                    const stage = rally.stages.find(s => s.id === st.stageId);
                    return (
                      <tr key={st.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">{participant?.driverName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{participant?.car}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{stage?.identifier}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
