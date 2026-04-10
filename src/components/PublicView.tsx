import React, { useState, useMemo } from 'react';
import { formatTimeMs, formatDiffMs } from '../utils/formatters';
import { Rally } from '../types';
import { calculateStageResults, calculateOverallResults } from '../utils/calculations';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PublicView: React.FC<{ rally: Rally }> = ({ rally }) => {
  const [activeTab, setActiveTab] = useState('Start Lists');
  const [activeStageId, setActiveStageId] = useState<string>(rally.stages[0]?.id || '');

  const tabs = ["Start Lists", "Overall", "Stage Times", "Stage Winners", "Penalties", "Retirements"];
  
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

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const rallyName = rally.name || 'Rally Results';
      
      // Helper to add title
      const addTitle = (title: string, yPos: number) => {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, yPos);
        return yPos + 8;
      };

      let currentY = 20;

      // 1. Overall Classification
      doc.setFontSize(20);
      doc.text(rallyName, 14, currentY);
      currentY += 15;
      
      const latestStageIndex = rally.stages.length - 1;
      if (latestStageIndex >= 0) {
        currentY = addTitle('Overall Classification', currentY);
        const latestOverall = calculateOverallResults(rally, latestStageIndex);
        
        const overallBody = latestOverall.map(row => [
          row.isDnf ? 'DNF' : row.pos.toString(),
          `${row.driverName}${row.coDriverName ? ` / ${row.coDriverName}` : ''}`,
          row.car,
          row.isDnf ? 'DNF' : `${formatTimeMs(row.timeMs)}${row.penaltyTimeMs ? ` (+${formatTimeMs(row.penaltyTimeMs)})` : ''}`,
          !row.isDnf && row.diffPrevMs > 0 ? `+${formatDiffMs(row.diffPrevMs)}` : '-',
          !row.isDnf && row.diffFirstMs > 0 ? `+${formatDiffMs(row.diffFirstMs)}` : '-'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Pos', 'Driver / Co-Driver', 'Car', 'Total Time', 'Diff Prev', 'Diff 1st']],
          body: overallBody,
          theme: 'striped',
          headStyles: { fillColor: [234, 88, 12] }, // orange-600
          styles: { fontSize: 9 },
        });
        
        if ((doc as any).lastAutoTable) {
          currentY = (doc as any).lastAutoTable.finalY + 15;
        } else {
          currentY += 20;
        }
      }

      // 2. Stage Winners
      if (rally.stages.length > 0) {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        currentY = addTitle('Stage Winners', currentY);
        
        const winnersBody = rally.stages.map(stage => {
          const results = calculateStageResults(rally, stage.id).filter(r => !r.isDnf);
          const winner = results[0];
          return [
            `${stage.identifier} - ${stage.name}`,
            winner ? winner.driverName : '-',
            winner ? winner.car : '-',
            winner ? formatTimeMs(winner.timeMs) : '-'
          ];
        });

        autoTable(doc, {
          startY: currentY,
          head: [['Stage', 'Driver', 'Car', 'Time']],
          body: winnersBody,
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59] }, // slate-800
          styles: { fontSize: 9 },
        });
        
        if ((doc as any).lastAutoTable) {
          currentY = (doc as any).lastAutoTable.finalY + 15;
        } else {
          currentY += 20;
        }
      }

      // 3. All Stage Times
      rally.stages.forEach(stage => {
        if (currentY > 200) { doc.addPage(); currentY = 20; }
        currentY = addTitle(`Stage Times: ${stage.identifier} - ${stage.name}`, currentY);
        
        const sResults = calculateStageResults(rally, stage.id);
        const stageBody = sResults.map(row => [
          row.isDnf ? 'DNF' : row.pos.toString(),
          `${row.driverName}${row.coDriverName ? ` / ${row.coDriverName}` : ''}`,
          row.car,
          row.isDnf ? 'DNF' : `${formatTimeMs(row.timeMs)}${row.penaltyTimeMs ? ` (+${formatTimeMs(row.penaltyTimeMs)})` : ''}`,
          !row.isDnf && row.diffFirstMs > 0 ? `+${formatDiffMs(row.diffFirstMs)}` : '-'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Pos', 'Driver / Co-Driver', 'Car', 'Time', 'Diff 1st']],
          body: stageBody,
          theme: 'striped',
          headStyles: { fillColor: [71, 85, 105] }, // slate-600
          styles: { fontSize: 9 },
        });
        
        if ((doc as any).lastAutoTable) {
          currentY = (doc as any).lastAutoTable.finalY + 15;
        } else {
          currentY += 20;
        }
      });

      // 4. Penalties
      const penaltiesList = rally.stageTimes
        .filter(st => st.penaltyConfigIds && st.penaltyConfigIds.length > 0)
        .flatMap(st => {
          const participant = rally.participants.find(p => p.id === st.participantId);
          const stage = rally.stages.find(s => s.id === st.stageId);
          return st.penaltyConfigIds!.map(pId => {
            const penalty = rally.penaltyConfigs.find(p => p.id === pId);
            return { st, participant, stage, penalty };
          });
        });

      if (penaltiesList.length > 0) {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        currentY = addTitle('Penalties', currentY);
        
        const penBody = penaltiesList.map(({ participant, stage, penalty }) => [
          participant?.driverName || '-',
          stage?.identifier || '-',
          penalty?.name || '-',
          penalty?.type === 'SUPER_RALLY' ? 'SR+' : `+${formatTimeMs(penalty?.timeValueMs || 0)}`
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Driver', 'Stage', 'Penalty', 'Time Added']],
          body: penBody,
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59] },
          styles: { fontSize: 9 },
        });
        
        if ((doc as any).lastAutoTable) {
          currentY = (doc as any).lastAutoTable.finalY + 15;
        } else {
          currentY += 20;
        }
      }

      // 5. Retirements
      const dnfList = rally.stageTimes.filter(st => st.isDnf);
      if (dnfList.length > 0) {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        currentY = addTitle('Retirements (DNF)', currentY);
        
        const dnfBody = dnfList.map(st => {
          const participant = rally.participants.find(p => p.id === st.participantId);
          const stage = rally.stages.find(s => s.id === st.stageId);
          return [
            participant?.driverName || '-',
            participant?.car || '-',
            stage?.identifier || '-'
          ];
        });

        autoTable(doc, {
          startY: currentY,
          head: [['Driver', 'Car', 'Stage of Retirement']],
          body: dnfBody,
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38] }, // red-600
          styles: { fontSize: 9 },
        });
      }

      doc.save(`${rallyName.replace(/\s+/g, '_').toLowerCase()}_results.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-gray-200 pb-2">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors mb-2"
        >
          <Download size={16} />
          Export PDF
        </button>
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
                      : 'bg-white text-slate-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {stage.identifier}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 py-4">No stages available yet.</div>
          )}

          {activeStage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
                  <h3 className="text-white font-bold tracking-wide uppercase text-sm">Stage Times - {activeStage.identifier}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 font-medium w-12 text-center">Pos</th>
                        <th className="px-4 py-2 font-medium">Driver / Co-Driver</th>
                        <th className="px-4 py-2 font-medium text-right">Time</th>
                        <th className="px-4 py-2 font-medium text-right">Diff Prev</th>
                        <th className="px-4 py-2 font-medium text-right">Diff 1st</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stageResults.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No times recorded for this stage.</td></tr>
                      )}
                      {stageResults.map((row) => (
                        <tr key={row.participantId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-center font-bold text-gray-900">{row.isDnf ? '-' : row.pos}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900">{row.driverName}</div>
                            {row.coDriverName && <div className="text-xs text-gray-500">{row.coDriverName}</div>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                            {row.isDnf ? (
                              <span className="text-red-600 font-bold">DNF</span>
                            ) : (
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
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-gray-500">
                            {!row.isDnf && row.diffPrevMs > 0 ? `+${formatDiffMs(row.diffPrevMs)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-orange-600 font-medium">
                            {!row.isDnf && row.diffFirstMs > 0 ? `+${formatDiffMs(row.diffFirstMs)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-orange-600 px-4 py-3 border-b border-orange-700">
                  <h3 className="text-white font-bold tracking-wide uppercase text-sm">Overall After {activeStage.identifier}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 font-medium w-16 text-center">Pos</th>
                        <th className="px-4 py-2 font-medium">Driver / Co-Driver</th>
                        <th className="px-4 py-2 font-medium text-right">Total Time</th>
                        <th className="px-4 py-2 font-medium text-right">Diff Prev</th>
                        <th className="px-4 py-2 font-medium text-right">Diff 1st</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {overallResults.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No overall results available.</td></tr>
                      )}
                      {overallResults.map((row) => (
                        <tr key={row.participantId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-center">
                            {row.isDnf ? (
                              <span className="text-gray-400 font-bold">-</span>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-bold text-gray-900">{row.pos}</span>
                                {row.change > 0 && <span className="text-green-500 text-xs">▲</span>}
                                {row.change < 0 && <span className="text-red-500 text-xs">▼</span>}
                                {row.change === 0 && <span className="text-gray-300 text-xs">-</span>}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900">{row.driverName}</div>
                            {row.coDriverName && <div className="text-xs text-gray-500">{row.coDriverName}</div>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                            {row.isDnf ? (
                              <span className="text-red-600 font-bold">DNF</span>
                            ) : (
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
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-gray-500">
                            {!row.isDnf && row.diffPrevMs > 0 ? `+${formatDiffMs(row.diffPrevMs)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-orange-600 font-medium">
                            {!row.isDnf && row.diffFirstMs > 0 ? `+${formatDiffMs(row.diffFirstMs)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {activeTab === 'Overall' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-orange-600 px-4 py-3 border-b border-orange-700">
            <h3 className="text-white font-bold tracking-wide uppercase text-sm">Overall Classification</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium w-16 text-center">Pos</th>
                  <th className="px-4 py-2 font-medium">Driver / Co-Driver</th>
                  <th className="px-4 py-2 font-medium">Car</th>
                  <th className="px-4 py-2 font-medium text-right">Total Time</th>
                  <th className="px-4 py-2 font-medium text-right">Diff Prev</th>
                  <th className="px-4 py-2 font-medium text-right">Diff 1st</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const latestStageIndex = rally.stages.length - 1;
                  const latestOverall = calculateOverallResults(rally, latestStageIndex);
                  
                  if (latestOverall.length === 0) {
                    return <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No overall results available.</td></tr>;
                  }

                  return latestOverall.map((row) => (
                    <tr key={row.participantId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">
                        {row.isDnf ? (
                          <span className="text-gray-400 font-bold">-</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-bold text-gray-900">{row.pos}</span>
                            {row.change > 0 && <span className="text-green-500 text-xs">▲</span>}
                            {row.change < 0 && <span className="text-red-500 text-xs">▼</span>}
                            {row.change === 0 && <span className="text-gray-300 text-xs">-</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{row.driverName}</div>
                        {row.coDriverName && <div className="text-xs text-gray-500">{row.coDriverName}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.car}</td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                        {row.isDnf ? (
                          <span className="text-red-600 font-bold">DNF</span>
                        ) : (
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
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-gray-500">
                        {!row.isDnf && row.diffPrevMs > 0 ? `+${formatDiffMs(row.diffPrevMs)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-orange-600 font-medium">
                        {!row.isDnf && row.diffFirstMs > 0 ? `+${formatDiffMs(row.diffFirstMs)}` : '-'}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Stage Winners' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
            <h3 className="text-white font-bold tracking-wide uppercase text-sm">Stage Winners</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">Stage</th>
                  <th className="px-4 py-2 font-medium">Driver</th>
                  <th className="px-4 py-2 font-medium">Car</th>
                  <th className="px-4 py-2 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rally.stages.map(stage => {
                  const results = calculateStageResults(rally, stage.id).filter(r => !r.isDnf);
                  const winner = results[0];
                  return (
                    <tr key={stage.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900">{stage.identifier} - {stage.name}</td>
                      {winner ? (
                        <>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900">{winner.driverName}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{winner.car}</td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                            {formatTimeMs(winner.timeMs)}
                          </td>
                        </>
                      ) : (
                        <td colSpan={3} className="px-4 py-3 text-gray-500 italic">No times recorded yet</td>
                      )}
                    </tr>
                  );
                })}
                {rally.stages.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No stages available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Start Lists' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
            <h3 className="text-white font-bold tracking-wide uppercase text-sm">Start List</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium w-16 text-center">#</th>
                  <th className="px-4 py-2 font-medium">Driver / Co-Driver</th>
                  <th className="px-4 py-2 font-medium">Car</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rally.participants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center font-bold text-gray-900">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{p.driverName}</div>
                      {p.hasCoDriver && <div className="text-xs text-gray-500">{p.coDriverName}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.car}</td>
                  </tr>
                ))}
                {rally.participants.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No participants registered.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === 'Penalties' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
            <h3 className="text-white font-bold tracking-wide uppercase text-sm">Penalties</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">Driver</th>
                  <th className="px-4 py-2 font-medium">Location</th>
                  <th className="px-4 py-2 font-medium">Penalty</th>
                  <th className="px-4 py-2 font-medium text-right">Time Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
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
                    .filter(tcp => tcp.type !== 'OK')
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
                    return <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No penalties recorded.</td></tr>;
                  }

                  return allPenalties.map((item, idx) => (
                    <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900">{item.participant?.driverName}</td>
                      <td className="px-4 py-3 text-gray-600">{item.location}</td>
                      <td className="px-4 py-3 text-gray-600">{item.penalty?.name}</td>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
            <h3 className="text-white font-bold tracking-wide uppercase text-sm">Retirements (DNF)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">Driver</th>
                  <th className="px-4 py-2 font-medium">Car</th>
                  <th className="px-4 py-2 font-medium">Stage of Retirement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const dnfList = rally.stageTimes.filter(st => st.isDnf);
                  
                  if (dnfList.length === 0) {
                    return <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No retirements recorded.</td></tr>;
                  }

                  return dnfList.map(st => {
                    const participant = rally.participants.find(p => p.id === st.participantId);
                    const stage = rally.stages.find(s => s.id === st.stageId);
                    return (
                      <tr key={st.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-900">{participant?.driverName}</td>
                        <td className="px-4 py-3 text-gray-600">{participant?.car}</td>
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
