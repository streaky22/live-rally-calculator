import React, { useState } from 'react';
import { Rally } from '../types';
import { AdminParticipants } from './Admin/AdminParticipants';
import { AdminStages } from './Admin/AdminStages';
import { AdminTimeControls } from './Admin/AdminTimeControls';
import { AdminPenalties } from './Admin/AdminPenalties';
import { AdminTimeEntry } from './Admin/AdminTimeEntry';
import { AdminTCEntry } from './Admin/AdminTCEntry';
import { AdminStartList } from './Admin/AdminStartList';
import { AdminUsers } from './Admin/AdminUsers';
import { useLanguage } from '../contexts/LanguageContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatTimeMs, formatDiffMs } from '../utils/formatters';
import { calculateStageResults, calculateOverallResults } from '../utils/calculations';
import { Download } from 'lucide-react';

interface AdminPanelProps {
  rally: Rally;
  setRally: React.Dispatch<React.SetStateAction<Rally>>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ rally, setRally }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('INFO');

  const tabs = [
    { id: 'INFO', label: t('tabRallyStages') },
    { id: 'TIME_CONTROLS', label: t('tabTimeControls') },
    { id: 'PARTICIPANTS', label: t('tabParticipants') },
    { id: 'START_LIST', label: t('tabStartList') },
    { id: 'PENALTIES', label: t('tabPenalties') },
    { id: 'TIMES', label: t('tabStageTimes') },
    { id: 'TC_TIMES', label: t('tabTCEntry') },
    { id: 'ADMINS', label: t('tabAdmins') },
  ];

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

      // 0. Rally & Stages
      doc.setFontSize(20);
      doc.text(rallyName, 14, currentY);
      currentY += 15;

      currentY = addTitle(t('appTitle'), currentY);
      
      const stagesBody = rally.stages.map(stage => [
        stage.identifier,
        stage.name
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [[t('stage'), t('name')]],
        body: stagesBody,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] }, // slate-800
        styles: { fontSize: 9 },
      });
      
      if ((doc as any).lastAutoTable) {
        currentY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        currentY += 20;
      }

      // 0.5 Start List
      if (rally.participants.length > 0) {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        currentY = addTitle(t('tabStartList'), currentY);
        
        const startListBody = [...rally.participants]
          .map((p, index) => [
            (index + 1).toString(),
            `${p.driverName}${p.coDriverName ? ` / ${p.coDriverName}` : ''}`,
            p.car
          ]);

        autoTable(doc, {
          startY: currentY,
          head: [['#', t('driverCoDriver'), t('car')]],
          body: startListBody,
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

      // 1. Overall Classification
      
      const latestStageIndex = rally.stages.length - 1;
      if (latestStageIndex >= 0) {
        currentY = addTitle(t('overallClassification'), currentY);
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
          head: [[t('pos'), t('driverCoDriver'), t('car'), t('totalTime'), t('diffPrev'), t('diff1st')]],
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
        currentY = addTitle(t('stageWinners'), currentY);
        
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
          head: [[t('stage'), t('driver'), t('car'), t('time')]],
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
      rally.stages.forEach((stage, index) => {
        if (currentY > 200) { doc.addPage(); currentY = 20; }
        currentY = addTitle(`${t('tabStageTimes')}: ${stage.identifier} - ${stage.name}`, currentY);
        
        const sResults = calculateStageResults(rally, stage.id);
        
        // Stage Times (excluding DNF)
        const validStageResults = sResults.filter(r => !r.isDnf);
        const stageBody = validStageResults.map(row => [
          row.pos.toString(),
          `${row.driverName}${row.coDriverName ? ` / ${row.coDriverName}` : ''}`,
          row.car,
          `${formatTimeMs(row.timeMs)}${row.penaltyTimeMs ? ` (+${formatTimeMs(row.penaltyTimeMs)})` : ''}`,
          row.diffFirstMs > 0 ? `+${formatDiffMs(row.diffFirstMs)}` : '-'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [[t('pos'), t('driverCoDriver'), t('car'), t('time'), t('diff1st')]],
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

        // Stage Super Rallys
        const srStageResults = sResults.filter(r => r.hasSuperRally);
        if (srStageResults.length > 0) {
          if (currentY > 250) { doc.addPage(); currentY = 20; }
          currentY = addTitle(`Super Rally - ${stage.identifier}`, currentY);
          
          const srBody = srStageResults.map(row => [
            `${row.driverName}${row.coDriverName ? ` / ${row.coDriverName}` : ''}`,
            row.car
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [[t('driverCoDriver'), t('car')]],
            body: srBody,
            theme: 'striped',
            headStyles: { fillColor: [220, 38, 38] }, // red-600
            styles: { fontSize: 9 },
          });
          
          if ((doc as any).lastAutoTable) {
            currentY = (doc as any).lastAutoTable.finalY + 15;
          } else {
            currentY += 20;
          }
        }

        // Stage DNFs
        const dnfStageResults = sResults.filter(r => r.isDnf);
        if (dnfStageResults.length > 0) {
          if (currentY > 250) { doc.addPage(); currentY = 20; }
          currentY = addTitle(`DNF - ${stage.identifier}`, currentY);
          
          const dnfBody = dnfStageResults.map(row => [
            `${row.driverName}${row.coDriverName ? ` / ${row.coDriverName}` : ''}`,
            row.car
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [[t('driverCoDriver'), t('car')]],
            body: dnfBody,
            theme: 'striped',
            headStyles: { fillColor: [220, 38, 38] }, // red-600
            styles: { fontSize: 9 },
          });
          
          if ((doc as any).lastAutoTable) {
            currentY = (doc as any).lastAutoTable.finalY + 15;
          } else {
            currentY += 20;
          }
        }

        // Overall After Stage
        if (currentY > 200) { doc.addPage(); currentY = 20; }
        currentY = addTitle(`${t('overallAfter')} ${stage.identifier}`, currentY);
        
        const overallResults = calculateOverallResults(rally, index);
        const validOverallResults = overallResults.filter(r => !r.isDnf);
        const overallBody = validOverallResults.map(row => [
          row.pos.toString(),
          `${row.driverName}${row.coDriverName ? ` / ${row.coDriverName}` : ''}`,
          row.car,
          `${formatTimeMs(row.timeMs)}${row.penaltyTimeMs ? ` (+${formatTimeMs(row.penaltyTimeMs)})` : ''}`,
          row.diffPrevMs > 0 ? `+${formatDiffMs(row.diffPrevMs)}` : '-',
          row.diffFirstMs > 0 ? `+${formatDiffMs(row.diffFirstMs)}` : '-'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [[t('pos'), t('driverCoDriver'), t('car'), t('totalTime'), t('diffPrev'), t('diff1st')]],
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

        // Overall DNFs After Stage
        const dnfOverallResults = overallResults.filter(r => r.isDnf);
        if (dnfOverallResults.length > 0) {
          if (currentY > 250) { doc.addPage(); currentY = 20; }
          currentY = addTitle(`DNF ${t('overallAfter')} ${stage.identifier}`, currentY);
          
          const dnfOverallBody = dnfOverallResults.map(row => [
            `${row.driverName}${row.coDriverName ? ` / ${row.coDriverName}` : ''}`,
            row.car,
            row.dnfStageIdentifier || '-'
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [[t('driverCoDriver'), t('car'), t('stage')]],
            body: dnfOverallBody,
            theme: 'striped',
            headStyles: { fillColor: [220, 38, 38] }, // red-600
            styles: { fontSize: 9 },
          });
          
          if ((doc as any).lastAutoTable) {
            currentY = (doc as any).lastAutoTable.finalY + 15;
          } else {
            currentY += 20;
          }
        }
      });

      // 4. Penalties
      const stagePenaltiesList = rally.stageTimes
        .filter(st => st.penaltyConfigIds && st.penaltyConfigIds.length > 0)
        .flatMap(st => {
          const participant = rally.participants.find(p => p.id === st.participantId);
          const stage = rally.stages.find(s => s.id === st.stageId);
          return st.penaltyConfigIds!.map(pId => {
            const penalty = rally.penaltyConfigs.find(p => p.id === pId);
            return { 
              participant, 
              location: stage?.identifier || '-', 
              penaltyName: penalty?.name || '-', 
              timeAdded: penalty?.type === 'SUPER_RALLY' ? 'SR+' : `+${formatTimeMs(penalty?.timeValueMs || 0)}`
            };
          });
        });

      const tcPenaltiesList = (rally.tcPenalties || [])
        .filter(tcp => tcp.calculatedTimeMs > 0)
        .map(tcp => {
          const participant = rally.participants.find(p => p.id === tcp.participantId);
          const tc = rally.timeControls.find(t => t.id === tcp.tcId);
          return {
            participant,
            location: tc?.identifier || '-',
            penaltyName: tcp.type === 'LATE' ? t('latePenalty') : t('earlyPenalty'),
            timeAdded: `+${formatTimeMs(tcp.calculatedTimeMs)}`
          };
        });

      const allPenaltiesList = [...stagePenaltiesList, ...tcPenaltiesList];

      if (allPenaltiesList.length > 0) {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        currentY = addTitle(t('tabPenalties'), currentY);
        
        const penBody = allPenaltiesList.map(({ participant, location, penaltyName, timeAdded }) => [
          participant?.driverName || '-',
          location,
          penaltyName,
          timeAdded
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [[t('driver'), t('location'), t('penalty'), t('timeAdded')]],
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
        currentY = addTitle(t('retirements'), currentY);
        
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
          head: [[t('driver'), t('car'), t('stageOfRetirement')]],
          body: dnfBody,
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38] }, // red-600
          styles: { fontSize: 9 },
        });
      }

      doc.save(`${rallyName.replace(/\s+/g, '_').toLowerCase()}_results.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('errorGeneratingPDF') + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-gray-200 dark:border-slate-700 pb-2">
        <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
          <nav className="-mb-px flex space-x-8 min-w-max px-2">
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
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors mb-2 ml-4 shrink-0"
        >
          <Download size={16} />
          {t('exportPDF')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        {activeTab === 'INFO' && <AdminStages rally={rally} setRally={setRally} />}
        {activeTab === 'TIME_CONTROLS' && <AdminTimeControls rally={rally} setRally={setRally} />}
        {activeTab === 'PARTICIPANTS' && <AdminParticipants rally={rally} setRally={setRally} />}
        {activeTab === 'START_LIST' && <AdminStartList rally={rally} setRally={setRally} />}
        {activeTab === 'PENALTIES' && <AdminPenalties rally={rally} setRally={setRally} />}
        {activeTab === 'TIMES' && <AdminTimeEntry rally={rally} setRally={setRally} />}
        {activeTab === 'TC_TIMES' && <AdminTCEntry rally={rally} setRally={setRally} />}
        {activeTab === 'ADMINS' && <AdminUsers />}
      </div>
    </div>
  );
};
