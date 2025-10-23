
import React from 'react';
import { GameState } from '../types';
import { BaseballIcon } from './IconComponents';

interface ScoreboardProps {
  gameState: GameState;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ gameState }) => {
  const { teams, currentInning, currentHalf, outs } = gameState;

  const InningDisplay = () => (
    <div className="text-center">
      <div className="text-xl md:text-3xl font-bold text-amber-100">
        {currentInning}
      </div>
      <div className="text-sm md:text-lg text-amber-200">
        {currentHalf === 'top' ? '🔼 Alta' : '🔽 Baja'}
      </div>
    </div>
  );
  
  const OutsDisplay = () => (
    <div className="text-center">
        <div className="text-lg md:text-xl font-semibold text-amber-100 mb-1">Outs</div>
        <div className="flex justify-center space-x-2">
            <div className={`w-5 h-5 md:w-7 md:h-7 rounded-full ${outs >= 1 ? 'bg-red-600' : 'bg-amber-100/30'}`}></div>
            <div className={`w-5 h-5 md:w-7 md:h-7 rounded-full ${outs >= 2 ? 'bg-red-600' : 'bg-amber-100/30'}`}></div>
            <div className={`w-5 h-5 md:w-7 md:h-7 rounded-full ${outs >= 3 ? 'bg-red-600' : 'bg-amber-100/30'}`}></div>
        </div>
    </div>
  );
  
  const TeamScore: React.FC<{ teamName: string; score: number; isBatting: boolean }> = ({ teamName, score, isBatting }) => (
    <div className="flex items-center justify-between w-2/5 text-amber-100">
      <div className="flex items-center">
        {isBatting && <BaseballIcon className="w-4 h-4 mr-2 text-yellow-300 animate-spin-slow" />}
        <span className={`text-xl md:text-3xl font-semibold truncate ${isBatting ? 'text-yellow-300' : ''}`}>{teamName}</span>
      </div>
      <span className="text-3xl md:text-5xl font-bold">{score}</span>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto bg-blue-900/80 backdrop-blur-sm shadow-2xl rounded-2xl p-4 md:p-6 border-4 border-amber-600/50">
      <div className="flex justify-between items-center">
        <TeamScore teamName={teams[0].name} score={teams[0].score} isBatting={gameState.battingTeamIndex === 0} />
        <div className="flex flex-col items-center justify-center space-y-2">
            <InningDisplay />
        </div>
         <TeamScore teamName={teams[1].name} score={teams[1].score} isBatting={gameState.battingTeamIndex === 1} />
      </div>
       <div className="flex justify-center mt-4">
          <OutsDisplay />
        </div>
    </div>
  );
};

export default Scoreboard;
