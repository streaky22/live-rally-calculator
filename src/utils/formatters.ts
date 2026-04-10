export const formatTimeMs = (timeMs: number): string => {
  const mm = Math.floor(timeMs / 60000).toString().padStart(2, '0');
  const ss = Math.floor((timeMs % 60000) / 1000).toString().padStart(2, '0');
  const mmm = (timeMs % 1000).toString().padStart(3, '0');
  return `${mm}:${ss}.${mmm}`;
};

export const formatDiffMs = (diffMs: number): string => {
  if (diffMs === 0) return '';
  const absMs = Math.abs(diffMs);
  const mm = Math.floor(absMs / 60000);
  const ss = Math.floor((absMs % 60000) / 1000);
  const tenths = Math.floor((absMs % 1000) / 100);
  
  if (mm > 0) {
    return `${mm}:${ss.toString().padStart(2, '0')}.${tenths}`;
  }
  return `${ss}.${tenths}`;
};
