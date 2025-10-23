import React, { useState, useEffect, useCallback } from 'react';
import { GameStatus, GameState, HitType, Question, AnswerResult, Team } from './types';
import { advanceRunners } from './utils/gameLogic';
import Scoreboard from './components/Scoreboard';
import BaseballDiamond from './components/BaseballDiamond';
import { generateQuestion, initializeAiClient } from './services/geminiService';
import { BatIcon, BookIcon, UsersIcon, TimerIcon, KeyIcon } from './components/IconComponents';

const TOTAL_INNINGS = 3;

// Helper component for API Key input
const ApiKeyScreen: React.FC<{ onApiKeySubmit: (key: string) => void }> = ({ onApiKeySubmit }) => {
    const [apiKey, setApiKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim()) {
            onApiKeySubmit(apiKey.trim());
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
            <KeyIcon className="w-24 h-24 text-amber-800 mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">Configuración Requerida</h1>
            <h2 className="text-xl md:text-2xl text-amber-700 mb-8">Por favor, introduce tu API Key de Google AI</h2>
            <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-lg w-full max-w-md flex flex-col gap-6">
                <p className="text-gray-700">Para generar las preguntas, el juego necesita una API key de Gemini. Puedes obtener una gratis en <a href="https://aistudio.google.com/keys" target="_blank" rel="noopener noreferrer" className="text-blue-700 font-bold underline">Google AI Studio</a>.</p>
                <div className="relative">
                    <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 text-lg border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        placeholder="Pega tu API Key aquí"
                    />
                </div>
                <button type="submit" className="w-full bg-amber-600 text-white font-bold text-xl py-4 rounded-lg hover:bg-amber-700 transition-transform transform hover:scale-105 shadow-md">
                    Guardar y Jugar
                </button>
            </form>
        </div>
    );
};


// Helper component defined outside App to prevent re-creation on re-renders
const SetupScreen: React.FC<{ onStart: (team1: string, team2: string) => void }> = ({ onStart }) => {
    const [team1Name, setTeam1Name] = useState('Equipo A');
    const [team2Name, setTeam2Name] = useState('Equipo B');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (team1Name.trim() && team2Name.trim()) {
            onStart(team1Name, team2Name);
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
            <BookIcon className="w-24 h-24 text-amber-800 mb-4"/>
            <h1 className="text-5xl md:text-7xl font-bold text-blue-900 mb-2">Béisbol Bíblico</h1>
            <h2 className="text-3xl md:text-4xl text-amber-700 mb-8">El Libro de Santiago</h2>
            <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-lg w-full max-w-md flex flex-col gap-6">
                 <h3 className="text-2xl text-blue-900 font-bold">Nombres de los Equipos</h3>
                <div className="relative">
                    <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    <input
                        type="text"
                        value={team1Name}
                        onChange={(e) => setTeam1Name(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 text-lg border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        placeholder="Nombre del Equipo 1"
                    />
                </div>
                <div className="relative">
                    <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    <input
                        type="text"
                        value={team2Name}
                        onChange={(e) => setTeam2Name(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 text-lg border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        placeholder="Nombre del Equipo 2"
                    />
                </div>
                <button type="submit" className="w-full bg-amber-600 text-white font-bold text-xl py-4 rounded-lg hover:bg-amber-700 transition-transform transform hover:scale-105 shadow-md">
                    ¡Jugar!
                </button>
            </form>
        </div>
    );
};

const QuestionModal: React.FC<{
    status: GameStatus;
    onSelect: (chapter: number, difficulty: HitType) => void;
    onAnswer: (answer: string) => void;
    onClose: () => void;
    question: Question | null;
    isLoading: boolean;
    remainingTime: number;
}> = ({ status, onSelect, onAnswer, onClose, question, isLoading, remainingTime }) => {
    
    const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<HitType | null>(null);

    const handleSelect = () => {
        if(selectedChapter && selectedDifficulty) {
            onSelect(selectedChapter, selectedDifficulty);
        }
    }
    
    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center p-8">
                <BookIcon className="w-16 h-16 text-amber-600 animate-pulse mx-auto mb-4"/>
                <h3 className="text-2xl font-bold text-blue-800">Generando pregunta...</h3>
                <p className="text-gray-600 mt-2">Un momento por favor.</p>
            </div>;
        }

        if (status === GameStatus.QuestionSelect) {
            return (
                <div>
                    <h3 className="text-3xl font-bold text-center text-blue-900 mb-6">Elige tu Bateo</h3>
                    <div className="mb-6">
                        <h4 className="font-bold text-xl mb-3 text-gray-700">Capítulo de Santiago:</h4>
                        <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map(chap => (
                                <button key={chap} onClick={() => setSelectedChapter(chap)} className={`p-4 rounded-lg text-lg font-bold transition-all ${selectedChapter === chap ? 'bg-blue-800 text-white scale-110' : 'bg-blue-100 hover:bg-blue-200'}`}>
                                    {chap}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-xl mb-3 text-gray-700">Tipo de Hit (Dificultad):</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.values(HitType).map(type => (
                                <button key={type} onClick={() => setSelectedDifficulty(type)} className={`p-4 rounded-lg text-lg font-bold transition-all text-left ${selectedDifficulty === type ? 'bg-amber-600 text-white scale-105' : 'bg-amber-100 hover:bg-amber-200'}`}>
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="mt-8 flex justify-end">
                        <button onClick={onClose} className="text-gray-600 font-bold py-2 px-4 mr-2">Cancelar</button>
                        <button onClick={handleSelect} disabled={!selectedChapter || !selectedDifficulty} className="bg-blue-800 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-400 hover:bg-blue-900 transition-all">
                            ¡Batear!
                        </button>
                    </div>
                </div>
            );
        }

        if (status === GameStatus.QuestionAsk && question) {
            return (
                <div>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-gray-200">
                      <h3 className="text-2xl font-bold text-blue-900">Pregunta</h3>
                      <div className={`flex items-center text-2xl font-bold px-4 py-1 rounded-full ${remainingTime <= 10 ? 'text-red-600 bg-red-100' : 'text-gray-700 bg-gray-200'}`}>
                        <TimerIcon className="w-6 h-6 mr-2" />
                        {remainingTime}
                      </div>
                    </div>
                    <p className="text-2xl text-gray-800 mb-6 min-h-[100px]">{question.question}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {question.options.map((opt, i) => (
                            <button key={i} onClick={() => onAnswer(opt)} className="bg-white p-4 text-lg text-left border-2 border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                            </button>
                        ))}
                    </div>
                </div>
            )
        }
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-stone-100 rounded-2xl shadow-2xl w-full max-w-3xl p-6 md:p-8 animate-fade-in-up">
                {renderContent()}
            </div>
        </div>
    );
}

const ResultModal: React.FC<{ result: AnswerResult, onClose: () => void, isOut: boolean }> = ({ result, onClose, isOut }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-fade-in-up transform transition-all ${result.isCorrect ? 'border-t-8 border-green-500' : 'border-t-8 border-red-500'}`}>
                {result.isCorrect ? (
                    <>
                        <h2 className="text-5xl font-bold text-green-600 mb-4">¡CORRECTO!</h2>
                        <p className="text-3xl text-gray-800 font-semibold">{result.hitType}</p>
                    </>
                ) : (
                     <>
                        <h2 className="text-5xl font-bold text-red-600 mb-4">¡INCORRECTO!</h2>
                        {isOut ? <p className="text-3xl text-gray-800 font-semibold">OUT</p> : <p className="text-3xl text-gray-800 font-semibold">Inténtalo de nuevo</p>}
                    </>
                )}
                <button onClick={onClose} className="mt-8 bg-blue-800 text-white font-bold py-3 px-12 rounded-lg text-xl hover:bg-blue-900 transition-all">
                    Continuar
                </button>
            </div>
        </div>
    )
}

const GameOverScreen: React.FC<{ winner: Team | null, onReset: () => void, teams: [Team, Team] }> = ({ winner, onReset, teams }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-6xl font-bold text-blue-900 mb-4">¡Juego Terminado!</h1>
            {winner ? (
                <h2 className="text-4xl text-amber-700 mb-8">El ganador es {winner.name}!</h2>
            ) : (
                <h2 className="text-4xl text-amber-700 mb-8">¡Es un empate!</h2>
            )}
            <div className="text-2xl mb-8 font-semibold text-gray-700">
                <p>{teams[0].name}: {teams[0].score} carreras</p>
                <p>{teams[1].name}: {teams[1].score} carreras</p>
            </div>
            <button onClick={onReset} className="bg-amber-600 text-white font-bold text-xl py-4 px-12 rounded-lg hover:bg-amber-700 transition-transform transform hover:scale-105 shadow-md">
                Jugar de Nuevo
            </button>
        </div>
    )
}


const App: React.FC = () => {
    const [status, setStatus] = useState<GameStatus>(GameStatus.Setup);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<HitType | null>(null);
    const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
    const [timer, setTimer] = useState(60);
    const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
    const [isApiKeySet, setIsApiKeySet] = useState(false);

    useEffect(() => {
        const key = process.env.API_KEY || localStorage.getItem('GEMINI_API_KEY');
        if (key) {
            try {
                initializeAiClient(key);
                setIsApiKeySet(true);
            } catch (error) {
                console.error(error);
                setIsApiKeySet(false);
            }
        }
    }, []);

    useEffect(() => {
        if (status === GameStatus.QuestionAsk && timer > 0) {
            const id = setTimeout(() => setTimer(t => t - 1), 1000);
            setTimerId(id);
        } else if (timer === 0 && status === GameStatus.QuestionAsk) {
            if(timerId) clearTimeout(timerId);
            handleAnswer("");
        }
        
        return () => {
            if (timerId) clearTimeout(timerId);
        };
    }, [status, timer]);


    const handleApiKeySubmit = (key: string) => {
        try {
            initializeAiClient(key);
            localStorage.setItem('GEMINI_API_KEY', key);
            setIsApiKeySet(true);
        } catch (error) {
            console.error(error);
            alert("Hubo un error al inicializar el cliente AI. Verifica tu clave.");
        }
    };

    const handleStartGame = (team1Name: string, team2Name: string) => {
        setGameState({
            teams: [{ name: team1Name, score: 0 }, { name: team2Name, score: 0 }],
            currentInning: 1,
            currentHalf: 'top',
            battingTeamIndex: 0,
            outs: 0,
            bases: [false, false, false],
        });
        setStatus(GameStatus.Playing);
    };
    
    const startBatting = () => {
        setStatus(GameStatus.QuestionSelect);
    };

    const handleQuestionSelect = async (chapter: number, difficulty: HitType) => {
        setIsLoading(true);
        setSelectedDifficulty(difficulty);
        const question = await generateQuestion(chapter, difficulty);
        setIsLoading(false);
        if (question) {
            setCurrentQuestion(question);
            setTimer(60);
            setStatus(GameStatus.QuestionAsk);
        } else {
            // Error alert is handled in the service
            setStatus(GameStatus.Playing);
            setSelectedDifficulty(null);
        }
    };
    
    const handleAnswer = useCallback((answer: string) => {
        if (timerId) clearTimeout(timerId);
        setTimerId(null);

        const isCorrect = answer.trim().toLowerCase() === currentQuestion?.answer.trim().toLowerCase();
        
        setLastResult({
            isCorrect,
            hitType: isCorrect ? selectedDifficulty : null,
        });
        setStatus(GameStatus.Result);
    }, [currentQuestion, timerId, selectedDifficulty]);

    const handleCloseResult = () => {
        if (!gameState || !lastResult) return;
        
        let newGameState = { ...gameState };

        if (lastResult.isCorrect) {
            const { newBases, runsScored } = advanceRunners(newGameState.bases, lastResult.hitType!);
            newGameState.bases = newBases;
            const newTeams = [...newGameState.teams] as [Team, Team];
            newTeams[newGameState.battingTeamIndex].score += runsScored;
            newGameState.teams = newTeams;
        } else {
            newGameState.outs++;
        }
        
        if (newGameState.outs >= 3) {
            setStatus(GameStatus.SwitchingTeams);
            setTimeout(() => {
                if (newGameState.currentHalf === 'top') {
                    setGameState({
                        ...newGameState,
                        currentHalf: 'bottom',
                        battingTeamIndex: 1,
                        outs: 0,
                        bases: [false, false, false]
                    });
                } else {
                     if (newGameState.currentInning >= TOTAL_INNINGS) {
                        setStatus(GameStatus.GameOver);
                        return;
                    }
                    setGameState({
                        ...newGameState,
                        currentInning: newGameState.currentInning + 1,
                        currentHalf: 'top',
                        battingTeamIndex: 0,
                        outs: 0,
                        bases: [false, false, false]
                    });
                }
                setStatus(GameStatus.Playing);
            }, 2000);
        } else {
             setGameState(newGameState);
        }
        
        setLastResult(null);
        setCurrentQuestion(null);
        setSelectedDifficulty(null);
        if (status !== GameStatus.SwitchingTeams && status !== GameStatus.GameOver) {
            setStatus(GameStatus.Playing);
        }
    };
    
    const handleResetGame = () => {
        setGameState(null);
        setStatus(GameStatus.Setup);
        setCurrentQuestion(null);
        setLastResult(null);
        setSelectedDifficulty(null);
    };

    const getWinner = () => {
        if(!gameState) return null;
        if (gameState.teams[0].score > gameState.teams[1].score) return gameState.teams[0];
        if (gameState.teams[1].score > gameState.teams[0].score) return gameState.teams[1];
        return null;
    }


    const renderGameContent = () => {
        if (!isApiKeySet) {
            return <ApiKeyScreen onApiKeySubmit={handleApiKeySubmit} />;
        }
    
        switch (status) {
            case GameStatus.Setup:
                return <SetupScreen onStart={handleStartGame} />;
            case GameStatus.GameOver:
                 return <GameOverScreen winner={getWinner()} onReset={handleResetGame} teams={gameState!.teams}/>;
            case GameStatus.SwitchingTeams:
                return <div className="text-center">
                    <h2 className="text-4xl font-bold text-blue-800 animate-pulse">Cambio de Equipos...</h2>
                </div>
            default:
                if (!gameState) return null;
                return (
                    <div className="w-full h-full flex flex-col items-center p-4 md:p-8">
                        <Scoreboard gameState={gameState} />
                        <BaseballDiamond bases={gameState.bases} />
                        <div className="mt-auto flex flex-col items-center">
                             <p className="text-2xl text-blue-800 font-semibold mb-4">Turno de bateo para <span className="font-bold">{gameState.teams[gameState.battingTeamIndex].name}</span></p>
                            <button onClick={startBatting} className="flex items-center gap-4 bg-amber-600 text-white font-bold text-2xl py-4 px-12 rounded-full hover:bg-amber-700 transition-transform transform hover:scale-105 shadow-lg">
                                <BatIcon className="w-8 h-8"/>
                                ¡Batear!
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <main className="w-screen h-screen bg-gradient-to-b from-sky-500 to-green-800 overflow-auto">
            <div className="w-full h-full flex flex-col items-center justify-center">
                {renderGameContent()}
                {(status === GameStatus.QuestionSelect || status === GameStatus.QuestionAsk) && 
                    <QuestionModal 
                        status={status}
                        onSelect={handleQuestionSelect}
                        onAnswer={handleAnswer}
                        onClose={() => setStatus(GameStatus.Playing)}
                        question={currentQuestion}
                        isLoading={isLoading}
                        remainingTime={timer}
                    />
                }
                {status === GameStatus.Result && lastResult && (
                    <ResultModal result={lastResult} onClose={handleCloseResult} isOut={!lastResult.isCorrect && gameState!.outs + 1 >= 3} />
                )}
            </div>
             <style>{`
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
                 @keyframes spin-slow {
                    to {
                        transform: rotate(360deg);
                    }
                }
                .animate-spin-slow {
                    animation: spin-slow 2s linear infinite;
                }
            `}</style>
        </main>
    );
};

export default App;
