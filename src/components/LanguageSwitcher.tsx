import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 text-sm ml-4 border-l border-slate-700 pl-4">
      <Globe size={16} className="text-slate-400" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
      >
        <option value="es">Español</option>
        <option value="en">English</option>
        <option value="ca">Català</option>
      </select>
    </div>
  );
};
