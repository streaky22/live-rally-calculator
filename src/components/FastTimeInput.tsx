import React, { useState, useEffect } from 'react';

interface FastTimeInputProps {
  value?: number | null;
  onChange: (ms: number | null) => void;
  className?: string;
  disabled?: boolean;
}

export const FastTimeInput: React.FC<FastTimeInputProps> = ({ value, onChange, className = '', disabled = false }) => {
  const [rawDigits, setRawDigits] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (value != null) {
      const mm = Math.floor(value / 60000).toString().padStart(2, '0');
      const ss = Math.floor((value % 60000) / 1000).toString().padStart(2, '0');
      const mmm = (value % 1000).toString().padStart(3, '0');
      const newDigits = `${mm}${ss}${mmm}`;
      if (rawDigits !== newDigits) {
        setRawDigits(newDigits);
      }
    } else if (value === null && rawDigits.length === 7) {
      setRawDigits('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const val = e.target.value;
    const digits = val.replace(/\D/g, '').slice(0, 7);

    if (digits.length >= 3 && parseInt(digits[2], 10) > 5) {
      setError(true);
      return; // Block invalid second tens
    }

    setError(false);
    setRawDigits(digits);

    if (digits.length === 7) {
      const mm = parseInt(digits.slice(0, 2), 10);
      const ss = parseInt(digits.slice(2, 4), 10);
      const mmm = parseInt(digits.slice(4, 7), 10);
      onChange(mm * 60000 + ss * 1000 + mmm);
    } else {
      onChange(null);
    }
  };

  const formatDigits = (digits: string) => {
    let res = '';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2) res += ':';
      if (i === 4) res += '.';
      res += digits[i];
    }
    return res;
  };

  return (
    <div className="relative inline-block">
      <input
        type="text"
        value={formatDigits(rawDigits)}
        onChange={handleChange}
        disabled={disabled}
        className={`font-mono text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 w-32 text-center tracking-widest ${
          disabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' :
          error ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 bg-white text-gray-900'
        } ${className}`}
        placeholder="MM:SS.mmm"
      />
      {error && !disabled && (
        <div className="absolute -bottom-5 left-0 text-xs text-red-600 whitespace-nowrap font-sans">
          Segundos &gt; 59
        </div>
      )}
    </div>
  );
};
