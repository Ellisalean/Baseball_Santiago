
export enum GameStatus {
  Setup,
  Playing,
  QuestionSelect,
  QuestionAsk,
  Result,
  GameOver,
  SwitchingTeams
}

export enum HitType {
  Single = 'Sencillo',
  Double = 'Doble',
  Triple = 'Triple',
  Homerun = 'Homerun'
}

export interface Team {
  name: string;
  score: number;
}

export interface GameState {
  teams: [Team, Team];
  currentInning: number;
  currentHalf: 'top' | 'bottom';
  battingTeamIndex: 0 | 1;
  outs: number;
  bases: [boolean, boolean, boolean]; // 1st, 2nd, 3rd
}

export interface Question {
  question: string;
  options: string[];
  answer: string;
}

export interface AnswerResult {
  isCorrect: boolean;
  hitType: HitType | null;
}
