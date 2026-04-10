import { Rally, StageTime, PenaltyConfig } from '../types';

export interface CalculatedResult {
  participantId: string;
  driverName: string;
  coDriverName?: string;
  car: string;
  timeMs: number;
  diffPrevMs: number;
  diffFirstMs: number;
  pos: number;
  change: number; // For overall
  isDnf?: boolean;
  hasSuperRally?: boolean;
  penaltyTimeMs?: number;
}

export const calculateStageResults = (rally: Rally, stageId: string): CalculatedResult[] => {
  const stageTimes = rally.stageTimes.filter(st => st.stageId === stageId);
  
  // Find the fastest raw time in this stage for Super Rally calculation
  // Only consider times from drivers who finished WITHOUT Super Rally and are NOT DNF
  let fastestRawTimeMs = Infinity;
  stageTimes.forEach(st => {
    const hasSuperRally = st.penaltyConfigIds?.some(pId => rally.penaltyConfigs.find(p => p.id === pId)?.type === 'SUPER_RALLY');
    if (!st.isDnf && !hasSuperRally && st.timeMs > 0 && st.timeMs < fastestRawTimeMs) {
      fastestRawTimeMs = st.timeMs;
    }
  });

  if (fastestRawTimeMs === Infinity) fastestRawTimeMs = 0;

  const results = stageTimes.map(st => {
    const participant = rally.participants.find(p => p.id === st.participantId);
    let finalTimeMs = st.timeMs;
    let hasSuperRally = false;
    let extraTime = 0;

    if (st.penaltyConfigIds && st.penaltyConfigIds.length > 0) {
      st.penaltyConfigIds.forEach(pId => {
        const penalty = rally.penaltyConfigs.find(p => p.id === pId);
        if (penalty) {
          if (penalty.type === 'SUPER_RALLY') {
            hasSuperRally = true;
            extraTime += penalty.timeValueMs;
          } else if (penalty.type === 'TIME') {
            extraTime += penalty.timeValueMs;
          }
        }
      });
    }

    if (st.isDnf) {
      finalTimeMs = Infinity;
    } else if (hasSuperRally) {
      finalTimeMs = fastestRawTimeMs + extraTime;
    } else {
      finalTimeMs += extraTime;
    }

    return {
      participantId: st.participantId,
      driverName: participant?.driverName || 'Unknown',
      coDriverName: participant?.hasCoDriver ? participant.coDriverName : undefined,
      car: participant?.car || 'Unknown',
      timeMs: finalTimeMs,
      diffPrevMs: 0,
      diffFirstMs: 0,
      pos: 0,
      change: 0,
      isDnf: st.isDnf,
      hasSuperRally,
      penaltyTimeMs: extraTime
    };
  });

  // Sort by time
  results.sort((a, b) => {
    if (a.isDnf && !b.isDnf) return 1;
    if (!a.isDnf && b.isDnf) return -1;
    return a.timeMs - b.timeMs;
  });

  // Calculate diffs and pos
  let currentPos = 1;
  let firstValidTime = -1;

  results.forEach((r, index) => {
    if (r.isDnf) {
      r.pos = 0;
    } else {
      r.pos = currentPos++;
      if (firstValidTime === -1) {
        firstValidTime = r.timeMs;
      }
      r.diffFirstMs = r.timeMs - firstValidTime;
      if (index > 0 && !results[index - 1].isDnf) {
        r.diffPrevMs = r.timeMs - results[index - 1].timeMs;
      }
    }
  });

  return results;
};

export const calculateOverallResults = (rally: Rally, upToStageIndex: number): CalculatedResult[] => {
  if (upToStageIndex < 0 || rally.stages.length === 0) return [];

  const stagesToInclude = rally.stages.slice(0, upToStageIndex + 1).map(s => s.id);
  
  const participantTotals: Record<string, number> = {};
  const participantDnf: Record<string, boolean> = {};
  const participantSuperRally: Record<string, boolean> = {};
  const participantPenaltyTime: Record<string, number> = {};
  
  rally.participants.forEach(p => {
    participantTotals[p.id] = 0;
    participantDnf[p.id] = false;
    participantSuperRally[p.id] = false;
    participantPenaltyTime[p.id] = 0;
  });

  stagesToInclude.forEach(stageId => {
    const stageResults = calculateStageResults(rally, stageId);
    stageResults.forEach(sr => {
      if (sr.isDnf) {
        participantDnf[sr.participantId] = true;
      } else {
        participantTotals[sr.participantId] += sr.timeMs;
      }
      if (sr.hasSuperRally) {
        participantSuperRally[sr.participantId] = true;
      }
      participantPenaltyTime[sr.participantId] += (sr.penaltyTimeMs || 0);
    });
  });

  // Add TC Penalties to overall time
  if (rally.tcPenalties) {
    rally.tcPenalties.forEach(tcp => {
      if (participantTotals[tcp.participantId] !== undefined) {
        participantTotals[tcp.participantId] += tcp.calculatedTimeMs;
        participantPenaltyTime[tcp.participantId] += tcp.calculatedTimeMs;
      }
    });
  }

  // Filter out participants who don't have times for ALL included stages
  const validParticipantIds = rally.participants.filter(p => {
    return stagesToInclude.every(stageId => 
      rally.stageTimes.some(st => st.stageId === stageId && st.participantId === p.id)
    );
  }).map(p => p.id);

  const results = validParticipantIds.map(pId => {
    const participant = rally.participants.find(p => p.id === pId);
    return {
      participantId: pId,
      driverName: participant?.driverName || 'Unknown',
      coDriverName: participant?.hasCoDriver ? participant.coDriverName : undefined,
      car: participant?.car || 'Unknown',
      timeMs: participantTotals[pId],
      diffPrevMs: 0,
      diffFirstMs: 0,
      pos: 0,
      change: 0,
      isDnf: participantDnf[pId],
      hasSuperRally: participantSuperRally[pId],
      penaltyTimeMs: participantPenaltyTime[pId]
    };
  });

  results.sort((a, b) => {
    if (a.isDnf && !b.isDnf) return 1;
    if (!a.isDnf && b.isDnf) return -1;
    return a.timeMs - b.timeMs;
  });

  let currentPos = 1;
  let firstValidTime = -1;

  results.forEach((r, index) => {
    if (r.isDnf) {
      r.pos = 0;
    } else {
      r.pos = currentPos++;
      if (firstValidTime === -1) {
        firstValidTime = r.timeMs;
      }
      r.diffFirstMs = r.timeMs - firstValidTime;
      if (index > 0 && !results[index - 1].isDnf) {
        r.diffPrevMs = r.timeMs - results[index - 1].timeMs;
      }
    }
  });

  // Calculate change from previous stage
  if (upToStageIndex > 0) {
    const prevOverall = calculateOverallResults(rally, upToStageIndex - 1);
    results.forEach(r => {
      const prevPos = prevOverall.find(pr => pr.participantId === r.participantId)?.pos;
      if (prevPos && r.pos > 0 && prevPos > 0) {
        r.change = prevPos - r.pos; // Positive means moved up
      }
    });
  }

  return results;
};
