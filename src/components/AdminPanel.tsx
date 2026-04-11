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

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-slate-700 overflow-x-auto overflow-y-hidden scrollbar-hide">
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
