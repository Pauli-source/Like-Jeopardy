import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trophy, Home } from 'lucide-react';
import MediaPreview from '../components/MediaPreview';

export default function GameSession() {
  const location = useLocation();
  const navigate = useNavigate();

  // Daten von der vorherigen Seite abholen
  const { board, teams: initialTeams } = location.state || { 
    board: { title: 'Jeopardy Match', categories: [] }, 
    teams: [] 
  };

  // Spielstände der Teams verwalten
  const [teams, setTeams] = useState(
    (initialTeams || []).map((t, idx) => {
      const defaultMascots = ['T-Rex dick.svg', 'Brachiosaurus.svg', 'Stegosaurus.svg', 'Triceratops.svg'];
      if (t && typeof t === 'object' && t.name) {
        return { 
          name: t.name, 
          score: 0, 
          mascot: t.mascot || defaultMascots[idx % defaultMascots.length] 
        };
      }
      return { 
        name: t || `Team ${idx + 1}`, 
        score: 0, 
        mascot: defaultMascots[idx % defaultMascots.length] 
      };
    })
  );

  // Zustand für das Frage-Popup (Modal)
  const [activeClue, setActiveClue] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Gespielte Fragen merken
  const [playedClues, setPlayedClues] = useState({});
  const [showWinnerScreen, setShowWinnerScreen] = useState(false);

  // Punkte für ein Team anpassen (+ / -)
  const updateScore = (index, amount) => {
    setTeams(teams.map((t, i) => i === index ? { ...t, score: t.score + amount } : t));
  };

  // Kachel anklicken
  const handleClueClick = (catName, clue) => {
    const clueId = `${catName}-${clue.value}`;
    if (playedClues[clueId]) return;
    setShowAnswer(false);
    setActiveClue({ catName, ...clue });
  };

  // Frage schließen
  const closeClue = () => {
    if (activeClue) {
      const clueId = `${activeClue.catName}-${activeClue.value}`;
      setPlayedClues({ ...playedClues, [clueId]: true });
      setActiveClue(null);
      setShowAnswer(false);
    }
  };

  const rankedTeams = [...teams].sort((a, b) => b.score - a.score);
  const rankedTeamsWithRank = [];
  let currentRank = 1;

  for (let idx = 0; idx < rankedTeams.length; idx += 1) {
    const team = rankedTeams[idx];
    if (idx > 0 && team.score !== rankedTeams[idx - 1].score) {
      currentRank = idx + 1;
    }
    rankedTeamsWithRank.push({ ...team, rank: currentRank });
  }

  // === GEWINNER-ANSICHT ===
  if (showWinnerScreen) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 md:p-12 font-sans">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="bg-amber-100 p-5 rounded-full border border-amber-200 shadow-sm animate-bounce">
              <Trophy className="w-16 h-16 text-amber-500" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Match Beendet!</h1>
            <p className="text-slate-400 mt-1 text-sm font-medium">Hier ist das offizielle Endergebnis:</p>
          </div>
          
          <div className="space-y-3 text-left">
            {rankedTeamsWithRank.map((team, idx) => {
              const styleIdx = team.rank - 1;
              const medalColors = [
                'bg-white border-amber-200 ring-2 ring-amber-500/10',
                'bg-white border-slate-200',
                'bg-white border-orange-200',
                'bg-white border-slate-100'
              ];
              const badgeColors = ['bg-amber-400 text-slate-950', 'bg-slate-300 text-slate-700', 'bg-orange-400 text-white', 'bg-slate-200 text-slate-500'];
              const currentStyle = styleIdx < 3 ? medalColors[styleIdx] : medalColors[3];
              const currentBadge = styleIdx < 3 ? badgeColors[styleIdx] : badgeColors[3];

              return (
                <div key={`rank-${idx}`} className={`flex items-center justify-between p-4 rounded-2xl border shadow-sm ${currentStyle}`}>
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${currentBadge}`}>{team.rank}</span>
                    <img src={`/mascots/${team.mascot}`} alt="" className="w-10 h-10 object-contain" onError={(e) => e.target.style.display='none'} />
                    <span className="font-black text-lg text-slate-900 truncate max-w-[200px]">{team.name}</span>
                  </div>
                  <span className="font-black text-xl text-slate-800">{team.score} <span className="text-[10px] font-bold uppercase opacity-60">Pkt</span></span>
                </div>
              );
            })}
          </div>

          {/* Revanche-Button entfernt, Hauptmenü zentriert */}
          <div className="max-w-xs mx-auto pt-4">
            <button onClick={() => navigate('/')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm tracking-wide shadow-md shadow-indigo-100 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
              <Home className="w-4 h-4" /> Hauptmenü
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-800 p-6 flex flex-col font-sans overflow-hidden">
      
      {/* HEADER (HELL) */}
      <div className="w-full flex items-center justify-between gap-4 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/select-board')} className="bg-white hover:bg-slate-100 text-slate-700 p-2.5 rounded-full shadow-sm border border-slate-200 transition active:scale-95 cursor-pointer flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-0.5">Live Match</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{board?.title || "Jeopardy Board"}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWinnerScreen(true)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black rounded-xl transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Trophy className="w-3.5 h-3.5 fill-current" />
            Match beenden
          </button>
          <button onClick={() => navigate('/')} className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl font-bold text-xs transition shadow-sm">
            Abbrechen
          </button>
        </div>
      </div>

      {/* RASTER-SPIELFELD  */}
      <div className="flex-1 grid grid-cols-5 gap-4 my-2 min-h-0">
        {board?.categories?.map((cat) => (
          <div key={`col-${cat._id || cat.name}`} className="flex flex-col gap-3 h-full">
            
            {/* Kategorie Box */}
            <div className="bg-white border border-slate-200 text-slate-800 p-3 rounded-xl text-center font-black shadow-sm text-xs uppercase tracking-wider min-h-[64px] flex items-center justify-center content-center">
              <span className="line-clamp-2">{cat.name}</span>
            </div>

            {/* Die 5 Punkte-Kacheln */}
            {cat.clues?.map((clue, idx) => {
              const clueId = `${cat.name}-${clue.value}`;
              const isPlayed = !!playedClues[clueId];

              return (
                <button
                  key={`clue-${clue._id || idx}`}
                  onClick={() => handleClueClick(cat.name, clue)}
                  disabled={isPlayed}
                  className={`w-full flex-1 rounded-xl flex items-center justify-center font-black text-2xl border transition-all cursor-pointer tracking-wide
                    ${isPlayed 
                      ? 'bg-slate-200/50 text-slate-300 border-slate-200/60 shadow-inner opacity-50 line-through cursor-not-allowed' 
                      : 'bg-white text-amber-500 hover:text-amber-600 border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 shadow-sm active:scale-95'
                    }`}
                >
                  {clue.value}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* SCOREBOARD UNTEN */}
      <div className="shrink-0 bg-white border border-slate-200 p-4 rounded-2xl flex justify-center items-center gap-4 mt-4 shadow-sm">
        {teams.map((team, idx) => (
          <div 
            key={`team-${idx}`} 
            className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center gap-4 min-w-[220px] max-w-[260px]"
          >
            {/* Mascot Container */}
            <div className="w-12 h-12 shrink-0 bg-white rounded-lg p-1 border border-slate-200 flex items-center justify-center shadow-sm">
              <img 
                src={`/mascots/${team.mascot}`} 
                alt="" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden text-lg">🦖</div>
            </div>

            {/* Team Info */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[10px] text-slate-400 truncate tracking-wide uppercase">{team.name}</div>
              <div className="text-xl font-black text-slate-800 tracking-wider">
                {team.score} <span className="text-[10px] uppercase font-bold text-indigo-500">Pkt</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <button 
                onClick={() => updateScore(idx, 100)}
                className="p-1 bg-white hover:bg-emerald-500 text-emerald-600 hover:text-white border border-slate-200 hover:border-emerald-500 rounded-md transition active:scale-95 cursor-pointer flex justify-center shadow-xs"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button 
                onClick={() => updateScore(idx, -100)}
                className="p-1 bg-white hover:bg-rose-500 text-rose-600 hover:text-white border border-slate-200 hover:border-rose-500 rounded-md transition active:scale-95 cursor-pointer flex justify-center shadow-xs"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ERWEITERTES & GRÖSSERES FRAGE MODAL */}
      {activeClue && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 md:p-8 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 max-w-7xl w-11/12 shadow-2xl flex flex-col relative overflow-y-auto" style={{ height: '85vh' }}>
            
            {/* Badge oben */}
            <div className="text-center shrink-0 mb-6">
              <span className="bg-amber-50 text-amber-600 border border-amber-100 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                {activeClue.catName} • {activeClue.value} PKT
              </span>
            </div>

            {/* Fragen-Text-Bereich + Media (flexibles Layout) */}
            <div className="flex-1 flex flex-col justify-center items-center gap-6 min-h-0">
              {/* Frage */}
              <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight max-w-5xl text-center">
                {activeClue.question || "Keine Frage hinterlegt."}
              </h3>

              {/* Medien-Vorschau NUR wenn vorhanden */}
              {(
                (!showAnswer && activeClue.questionMedia) || 
                (showAnswer && (activeClue.answerMedia || activeClue.questionMedia))
              ) && (
                <div className="w-full max-w-4xl max-h-64 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex items-center justify-center">
                  <div className="w-full max-h-full object-contain">
                    {!showAnswer ? (
                      <MediaPreview url={activeClue.questionMedia || ''} label="Fragen-Medium" />
                    ) : (
                      <MediaPreview url={activeClue.answerMedia || activeClue.questionMedia || ''} label="Antwort-Medium" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Untere Button-Sektion */}
            <div className="space-y-4 w-full max-w-xl mx-auto pt-6 border-t border-slate-100 shrink-0">
              {!showAnswer ? (
                <button onClick={() => setShowAnswer(true)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-base tracking-wide shadow-md shadow-indigo-100 transition active:scale-95 cursor-pointer text-center">
                  Lösung aufdecken
                </button>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl text-center shadow-xs animate-fade-in">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5">Richtige Antwort</span>
                  <p className="font-black text-slate-800 text-xl md:text-2xl">{activeClue.answer || "Keine Antwort hinterlegt."}</p>
                </div>
              )}
              <button onClick={closeClue} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-xs tracking-wide transition active:scale-95 cursor-pointer text-center border border-slate-200">
                Frage schließen & Kachel ausgrauen
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}