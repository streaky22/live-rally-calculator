export type PenaltyType = 'TIME' | 'SUPER_RALLY' | 'TC_LATE' | 'TC_EARLY';
export type CalculationMethod = 'FIXED' | 'PER_MINUTE';

export interface PenaltyConfig {
  id: string;
  name: string;
  type: PenaltyType;
  timeValueMs: number;
  calculationMethod?: CalculationMethod;
}

export interface Participant {
  id: string;
  driverName: string;
  hasCoDriver: boolean;
  coDriverName?: string;
  car: string;
  nationality?: string;
}

export interface Stage {
  id: string;
  identifier: string; // e.g., SS1
  name: string;
}

export interface TimeControl {
  id: string;
  identifier: string; // e.g., TC0
  name: string; // e.g., Service Out
}

export interface StageTime {
  id: string;
  participantId: string;
  stageId: string;
  timeMs: number;
  penaltyConfigIds?: string[];
  isDnf?: boolean;
}

export interface TCPenalty {
  id: string;
  participantId: string;
  tcId: string;
  penaltyConfigId?: string;
  minutes?: number;
  calculatedTimeMs: number;
  type: 'EARLY' | 'LATE' | 'OK';
}

export interface Rally {
  id: string;
  name: string;
  participants: Participant[];
  stages: Stage[];
  timeControls: TimeControl[];
  penaltyConfigs: PenaltyConfig[];
  stageTimes: StageTime[];
  tcPenalties: TCPenalty[];
}
