import { useState, useEffect } from 'react';
import AuthModal from '../components/AuthModal';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Users, Trash2, Plus } from 'lucide-react';
import API_BASE_URL from "../config/api";

// Liste deiner exakten Dino-Dateien
const MASCOT_LIST = [
  'Brachiosaurus.svg',
  'Brontosaurus.svg',
  'Compsognathus.svg',
  'Pteranodon.svg',
  'Stegosaurus.svg',
  'T-Rex dick.svg',
  'T-Rex dünn.svg',
  'Triceratops Baby.svg',
  'Triceratops.svg',
  'Velociraptor.svg'
];

const getStoredToken = () => {
  const rawToken = localStorage.getItem('token');
  if (!rawToken) return null;

  try {
    const parts = rawToken.split('.');
    if (parts.length < 2) throw new Error('Ungültiges Token-Format');

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    const payload = JSON.parse(decoded);

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      localStorage.removeItem('token');
      return null;
    }

    return rawToken;
  } catch {
    localStorage.removeItem('token');
    return null;
  }
};

const getLoggedInUserId = () => {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    const payload = JSON.parse(decoded);

    return payload.userId || payload.id || payload._id || null;
  } catch {
    return null;
  }
};

export default function SelectBoard() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [feedback, setFeedback] = useState(null);
  
  // Teams-Eingabe Zustand
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamInput, setTeamInput] = useState('');
  const [teams, setTeams] = useState([
    { name: 'Team 1', mascot: 'T-Rex dick.svg' },
    { name: 'Team 2', mascot: 'Brachiosaurus.svg' }
  ]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authReason, setAuthReason] = useState('');
  const [loggedInUserId, setLoggedInUserId] = useState(() => getLoggedInUserId());

  // Zustand für den Dino-Auswähler (speichert den Index des Teams, das gerade wählt)
  const [activeMascotPickerIdx, setActiveMascotPickerIdx] = useState(null);

  useEffect(() => {
    const loadBoards = async () => {
      setLoading(true);

      const token = getStoredToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const response = await fetch(`${API_BASE_URL}/boards`, { headers });
        const data = await response.json();
        setBoards(data);
      } catch (err) {
        console.error('Fehler beim Laden:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBoards();
  }, []);

  // Ein Board aus der Datenbank löschen
  const deleteBoard = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Möchtest du dieses Board wirklich dauerhaft aus der Cloud löschen?')) return;

    const token = getStoredToken();
    if (!token) {
      setFeedback({ type: 'error', message: 'Du bist nicht eingeloggt oder deine Sitzung ist abgelaufen. Bitte melde dich erneut an.' });
      return;
    }

  try {
    const response = await fetch(`${API_BASE_URL}/boards/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      setBoards(prev => prev.filter(b => b._id !== id));
      if (selectedBoard?._id === id) setSelectedBoard(null);
      setFeedback({ type: 'success', message: 'Board wurde erfolgreich gelöscht.' });
    } else {
      try {
        const result = await response.json();
        const message = result.message || 'Fehler beim Löschen des Boards.';
        setFeedback({ type: 'error', message });
      } catch {
        setFeedback({ type: 'error', message: `Ein unbekannter Fehler beim Löschen ist aufgetreten (Status: ${response.status}).` });
      }
    }
  } catch {
    setFeedback({ type: 'error', message: 'Serverfehler beim Löschen des Boards.' });
  }
};

  const addTeam = () => {
    if (teamInput.trim()) {
      const randomMascot = MASCOT_LIST[teams.length % MASCOT_LIST.length];
      setTeams([...teams, { name: teamInput.trim(), mascot: randomMascot }]);
      setTeamInput('');
    }
  };

  const removeTeam = (idx) => {
    setTeams(teams.filter((_, i) => i !== idx));
    // Schließt den Picker, falls das aktuell bearbeitete Team gelöscht wird
    if (activeMascotPickerIdx === idx) {
      setActiveMascotPickerIdx(null);
    } else if (activeMascotPickerIdx > idx) {
      setActiveMascotPickerIdx(activeMascotPickerIdx - 1);
    }
  };

  // Zuweisung des ausgewählten Dinos aus dem Grid
  const selectMascotForTeam = (mascotName) => {
    if (activeMascotPickerIdx !== null) {
      setTeams(teams.map((t, i) => i === activeMascotPickerIdx ? { ...t, mascot: mascotName } : t));
      setActiveMascotPickerIdx(null); // Auswahl schließen
    }
  };

  const startMatch = () => {
    if (!selectedBoard) return;
    navigate('/game-session', { state: { board: selectedBoard, teams } });
  };

  const handleCreateBoardClick = () => {
    const token = getStoredToken();

    if (token) {
      navigate('/edit');
      return;
    }

    setAuthReason('Melde dich an, um eigene Boards zu erstellen!');
    setIsLogin(true);
    setShowAuthModal(true);
  };

  // Auth-Modal wird durch die wiederverwendbare Komponente `AuthModal` gehandhabt

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 p-6 md:p-12 font-sans flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-slate-200 pb-6">
          <button onClick={() => navigate('/')} className="bg-white hover:bg-slate-100 text-slate-700 p-3 rounded-full shadow-sm border border-slate-200 transition active:scale-95 cursor-pointer mt-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Spielvorbereitung</span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Wähle ein Board oder erstelle ein eigenes</h1>
            </div>
            
            {/* NEUER BUTTON UNTER DER ÜBERSCHRIFT */}
            <button
              onClick={handleCreateBoardClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Eigenes Board erstellen
            </button>
          </div>
        </div>

        {feedback && (
          <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${feedback.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {feedback.message}
          </div>
        )}

        {/* Listen-Bereich */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 font-bold">⏳ Boards werden aus der Cloud geladen...</div>
        ) : boards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <p className="text-slate-500 font-bold text-lg">Keine Boards gefunden.</p>
            <button onClick={handleCreateBoardClick} className="mt-4 text-sm font-black text-indigo-600 hover:underline">
              Erstelle jetzt dein erstes Board →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boards.map((b) => (
              <div
                key={b._id}
                onClick={() => setSelectedBoard(b)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm relative group
                  ${selectedBoard?._id === b._id ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'}`}
              >
                <div className="truncate pr-4">
                  <h3 className="font-black text-lg tracking-tight truncate">{b.title || b.name || "Unbenanntes Board"}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    {b.createdBy?.avatar && (
                      <img 
                        src={b.createdBy.avatar} 
                        alt={b.createdBy.username} 
                        className="w-5 h-5 rounded-full object-cover border border-slate-200"
                      />
                    )}
                    <span>
                      erstellt von <span className="text-slate-700">{b.createdBy?.username || 'Anonym'}</span>
                    </span>
                  </div>
                </div>
                {loggedInUserId && (b.createdBy?._id === loggedInUserId || b.createdBy === loggedInUserId) && (
                  <button
                    onClick={(e) => deleteBoard(b._id, e)}
                    className={`p-2.5 rounded-xl transition opacity-100 md:opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer
                      ${selectedBoard?._id === b._id ? 'hover:bg-indigo-700 text-indigo-200 hover:text-white' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Weiter-Button unten */}
        {selectedBoard && (
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setShowTeamModal(true)}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-5 h-5" /> Teams festlegen
            </button>
          </div>
        )}
      </div>

      {/* TEAMS MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          
          <div className={`bg-white rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-100 transition-all duration-300 flex flex-col gap-6 w-full
            ${activeMascotPickerIdx !== null ? 'max-w-6xl md:w-[75vw]' : 'max-w-xl'}`}
          >
            
            <div className={`grid grid-cols-1 gap-8 ${activeMascotPickerIdx !== null ? 'md:grid-cols-12' : ''}`}>
              
              {/* LINKE SEITE */}
              <div className={`space-y-4 flex flex-col justify-between ${activeMascotPickerIdx !== null ? 'md:col-span-5' : ''}`}>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Wer spielt mit?</h3>
                  <p className="text-slate-400 text-sm mt-0.5">Klicke auf das Wappen, um einen Dino zu wählen.</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Team Name..."
                    value={teamInput}
                    onChange={(e) => setTeamInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <button onClick={addTeam} className="px-5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition cursor-pointer">
                    Hinzufügen
                  </button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1 flex-1 min-h-[180px]">
                  {teams.map((t, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all
                        ${activeMascotPickerIdx === idx ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20' : 'bg-slate-50 border-slate-100'}`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveMascotPickerIdx(idx)}
                          className="w-12 h-12 shrink-0 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl p-1 flex items-center justify-center transition active:scale-95 cursor-pointer relative shadow-sm"
                        >
                          <img 
                            src={`/mascots/${t.mascot}`} 
                            alt="" 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <span className="hidden text-xs text-slate-400 font-bold">Dino 🦖</span>
                        </button>
                        <span className="font-black text-sm text-slate-800 truncate max-w-[160px]">{t.name}</span>
                      </div>
                      <button onClick={() => removeTeam(idx)} className="text-xs font-bold text-rose-500 hover:text-rose-700 px-3 py-1 transition cursor-pointer">
                        Löschen
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* RECHTE SEITE */}
              {activeMascotPickerIdx !== null && (
                <div className="border-t pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-8 border-slate-100 flex flex-col justify-between md:col-span-7 animate-fade-in">
                  <div>
                    <h4 className="text-sm font-black text-indigo-600 uppercase tracking-wider">
                      Dino für "{teams[activeMascotPickerIdx]?.name}" wählen:
                    </h4>
                    
                    <div className="grid grid-cols-5 gap-3 mt-4 overflow-y-auto max-h-[340px] p-1">
                      {MASCOT_LIST.map((mascotName) => (
                        <button
                          key={mascotName}
                          type="button"
                          onClick={() => selectMascotForTeam(mascotName)}
                          className={`aspect-square p-2 bg-slate-50 hover:bg-white border-2 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer group hover:shadow-md
                            ${teams[activeMascotPickerIdx]?.mascot === mascotName ? 'border-indigo-600 bg-indigo-50/30 shadow-sm' : 'border-slate-200 hover:border-indigo-300'}`}
                        >
                          <img 
                            src={`/mascots/${mascotName}`} 
                            alt="" 
                            className="w-full h-full object-contain group-hover:scale-110 transition duration-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <span className="hidden text-[10px] text-slate-400 break-all text-center leading-tight">ERR</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setActiveMascotPickerIdx(null)}
                    className="w-full mt-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition"
                  >
                    Auswahl schließen
                  </button>
                </div>
              )}
            </div>

            {/* Steuerungstasten unten */}
            <div className="flex gap-3 border-t border-slate-100 pt-5">
              <button onClick={() => { setShowTeamModal(false); setActiveMascotPickerIdx(null); }} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition">
                Zurück
              </button>
              <button onClick={startMatch} className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2">
                <Play className="w-4 h-4 fill-current" /> Match starten
              </button>
            </div>

          </div>
        </div>
      )}

      <AuthModal
        key={isLogin ? 'login' : 'register'}
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setAuthReason(''); }}
        authReason={authReason}
        initialMode={isLogin}
        onSuccess={(user) => { setLoggedInUserId(user.id || user._id || null); setShowAuthModal(false); setAuthReason(''); }}
      />
    </div>
  );
}