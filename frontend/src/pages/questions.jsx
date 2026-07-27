import API_BASE_URL from "../config/api";
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MediaPreview from '../components/MediaPreview';
import { 
  ArrowLeft, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Sparkles, 
  Database, 
  Shuffle, 
  Trash2, 
  Image as ImageIcon,
  Globe,
  Lock
} from 'lucide-react';

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
  } catch (error) {
    console.warn('Token konnte nicht gelesen werden:', error);
    localStorage.removeItem('token');
    return null;
  }
};

export default function Questions() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const passedCategories = location.state?.selectedCategories || [];
  const boardTitle = location.state?.title || 'Mein Jeopardy Board';

  const [categories] = useState(() => passedCategories.map(cat => ({
    name: cat.name,
    description: cat.description || ''
  })));

  const [boardData, setBoardData] = useState(() => {
    const initialData = {};
    passedCategories.forEach(cat => {
      if (cat.clues && Array.isArray(cat.clues)) {
        cat.clues.forEach(clue => {
          initialData[`${cat.name}-${clue.value}`] = {
            question: clue.question || '',
            answer: clue.answer || '',
            questionMedia: clue.questionMedia || '',
            answerMedia: clue.answerMedia || '',
            poolQuestionId: clue.poolQuestionId || null
          };
        });
      }
    });
    return initialData;
  });
  
  // Modal States
  const [activeCell, setActiveCell] = useState(null); 
  const [tempQuestion, setTempQuestion] = useState('');
  const [tempAnswer, setTempAnswer] = useState('');
  const [tempQuestionMedia, setTempQuestionMedia] = useState(''); 
  const [tempAnswerMedia, setTempAnswerMedia] = useState(''); 
  const [saveToPool, setSaveToPool] = useState(false);
  
  // Fragenpool-Vorschläge States
  const [poolSuggestions, setPoolSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Speicher & Privatsphäre States
  const [isSaving, setIsSaving] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false); // NEU: Sichtbarkeits-Modal
  const [isPublic, setIsPublic] = useState(true); // NEU: Standardmäßig öffentlich
  const [showSuccess, setShowSuccess] = useState(false);

  const filledCount = Object.values(boardData).filter(item => item?.question?.trim() && item?.answer?.trim()).length;

  // Lädt passende Fragen aus dem Fragenpool für das Modal
  const openCell = async (category, points) => {
    const currentId = `${category}-${points}`;
    setActiveCell({ category, points });
    setTempQuestion(boardData[currentId]?.question || '');
    setTempAnswer(boardData[currentId]?.answer || '');
    setTempQuestionMedia(boardData[currentId]?.questionMedia || ''); 
    setTempAnswerMedia(boardData[currentId]?.answerMedia || ''); 
    
    setShowSuggestions(false);
    setSaveToPool(false);

    try {
      const response = await fetch(`${API_BASE_URL}/question-pool?category=${encodeURIComponent(category)}`);
      if (response.ok) {
        const data = await response.json();
        setPoolSuggestions(Array.isArray(data) ? data : []);
      } else {
        setPoolSuggestions([]);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Fragenpool-Daten:", error);
      setPoolSuggestions([]);
    }
  };

  // BEFÜLLT EINE GANZE KATEGORIE ZUFÄLLIG AUS DEM FRAGENPOOL
  const fillCategoryRandomly = async (categoryName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/question-pool?category=${encodeURIComponent(categoryName)}`);
      if (!response.ok) return alert("Fehler beim Abrufen des Fragenpools.");
      
      const poolQuestions = await response.json();
      if (!Array.isArray(poolQuestions)) {
        return alert(`Fehler: Fragenpool hat kein gültiges Format für "${categoryName}".`);
      }

      const pointValues = [100, 200, 300, 400, 500];
      const updatedData = { ...boardData };

      // Ermittele leere Slots (keine Frage-Text eingegeben)
      const emptySlots = pointValues.filter((points) => {
        const cell = updatedData[`${categoryName}-${points}`];
        return !(cell && cell.question && cell.question.trim());
      });

      if (emptySlots.length === 0) {
        // Nichts zu tun
        return;
      }

      if (poolQuestions.length < emptySlots.length) {
        return alert(`Nicht genug Fragen im Fragenpool! Für "${categoryName}" werden ${emptySlots.length} Fragen benötigt.`);
      }

      // Zufällige Auswahl genau so vieler Fragen, wie benötigt werden
      const shuffled = [...poolQuestions].sort(() => 0.5 - Math.random());
      const picks = shuffled.slice(0, emptySlots.length);

      // Fülle nur die leeren Slots, in Punktreihenfolge, mit den gezogenen Fragen
      let pickIndex = 0;
      pointValues.forEach((points) => {
        const key = `${categoryName}-${points}`;
        const cell = updatedData[key];
        const isEmpty = !(cell && cell.question && cell.question.trim());
        if (isEmpty) {
          const randomClue = picks[pickIndex++];
          updatedData[key] = {
            question: randomClue.question || '',
            answer: randomClue.answer || '',
            questionMedia: randomClue.questionMedia || randomClue.mediaUrl || '',
            answerMedia: randomClue.answerMedia || '',
            poolQuestionId: randomClue._id || null
          };
        }
      });

      setBoardData(updatedData);
    } catch (error) {
      console.error("Fehler beim Random-Befüllen:", error);
      alert("Es gab ein Problem beim Laden der Zufallsfragen.");
    }
  };

  // KATEGORIE LEEREN
  const handleClearCategory = (categoryName) => {
    if (activeCell && activeCell.category === categoryName) {
      setActiveCell(null);
    }

    const updatedData = { ...boardData };
    const pointValues = [100, 200, 300, 400, 500];

    pointValues.forEach((points) => {
      updatedData[`${categoryName}-${points}`] = {
        question: '',
        answer: '',
        questionMedia: '',
        answerMedia: ''
      };
    });

    setBoardData(updatedData);
  };

  const saveCell = async () => {
    if (!activeCell) return;
    const currentId = `${activeCell.category}-${activeCell.points}`;
    
    const cleanedQuestion = (tempQuestion || '').trim();
    const cleanedAnswer = (tempAnswer || '').trim();
    const cleanedQMedia = (tempQuestionMedia || '').trim();
    const cleanedAMedia = (tempAnswerMedia || '').trim();

    if (saveToPool) {
      try {
        // Token für den geschützten Pool-Request holen
        const token = getStoredToken();
        await fetch(`${API_BASE_URL}/question-pool`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            category: activeCell.category,
            value: activeCell.points,
            question: cleanedQuestion,
            answer: cleanedAnswer,
            questionMedia: cleanedQMedia, 
            answerMedia: cleanedAMedia      
          })
        });
      } catch (error) {
        console.error("Fehler beim Speichern im Fragenpool:", error);
      }
    }

    setBoardData(prev => ({
      ...prev,
      [currentId]: { 
        question: cleanedQuestion, 
        answer: cleanedAnswer,
        questionMedia: cleanedQMedia,
        answerMedia: cleanedAMedia,
        poolQuestionId: activeCell.selectedPoolId || null
      }
    }));
    setActiveCell(null);
  };

  const selectSuggestion = (sug) => {
    if (!sug) return;
    setTempQuestion(sug.question || '');
    setTempAnswer(sug.answer || '');
    setTempQuestionMedia(sug.questionMedia || sug.mediaUrl || ''); 
    setTempAnswerMedia(sug.answerMedia || '');
    // Speichere auch die Pool-ID für eindeutige Erkennung
    setActiveCell(prev => ({ ...prev, selectedPoolId: sug._id }));
    setShowSuggestions(false);
  };

  // Wird aufgerufen, wenn der finale Speicher-Button gedrückt wird
  const handleSaveTrigger = () => {
    setShowWarning(false);
    // Öffnet jetzt das Sichtbarkeits-Modal statt direkt zu speichern
    setShowPrivacyModal(true);
  };

  // Sendet die Daten inklusive der gewählten Sichtbarkeit ans Backend
  const proceedToSave = async () => {
    setShowPrivacyModal(false);
    setIsSaving(true);

    const token = getStoredToken();

    if (!token) {
      setIsSaving(false);
      alert('Du bist nicht eingeloggt oder deine Sitzung ist abgelaufen. Bitte melde dich erneut an.');
      return;
    }

    const payload = {
      title: boardTitle,
      isPublic: isPublic, // NEU: Wird ans Backend übertragen
      categories: categories.map(cat => ({
        name: cat.name,
        description: cat.description || '',
        clues: [100, 200, 300, 400, 500].map(points => {
          const data = boardData[`${cat.name}-${points}`];
          return {
            value: points,
            question: data?.question || "",
            answer: data?.answer || "",
            questionMedia: data?.questionMedia || "",
            answerMedia: data?.answerMedia || ""
          };
        })
      }))
    };

    try {
      const response = await fetch(`${API_BASE_URL}/boards`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowSuccess(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Fehler beim Speichern: ${errorData.message || 'Der Server hat die Anfrage abgelehnt.'}`);
      }
    } catch (error) {
      console.error('Netzwerkfehler:', error);
      alert('Netzwerkfehler beim Speichern.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 p-6 md:p-12 font-sans relative">
      
      {/* HEADER */}
      <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/edit')} className="bg-white hover:bg-slate-100 text-slate-700 p-3 rounded-full shadow-sm border border-slate-200 transition active:scale-95 cursor-pointer flex items-center justify-center">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <span className="text-sm font-bold text-[#3b42f1] uppercase tracking-wider">Schritt 2 von 2</span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Fragen anpassen</h1>
          </div>
        </div>
        
        <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-200 font-bold text-sm text-slate-700">
          ✨ {filledCount} von 25 Fragen aktiv befüllt
        </div>
      </div>

      {/* FRAGEN GRID */}
      <div className="max-w-6xl w-full mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <div key={`${category.name}-${index}`} className="space-y-3 flex flex-col">
              
              <div className="bg-slate-900 text-white p-4 rounded-2xl text-center font-black shadow-sm text-sm min-h-[56px] flex items-center justify-center break-words">
                {category.name}
              </div>

              <div className="flex gap-2 w-full mb-1">
                <button
                  type="button"
                  onClick={() => fillCategoryRandomly(category.name)}
                  className="flex-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-sm"
                  title="Zufällige Fragen aus dem Fragenpool laden"
                >
                  <Shuffle className="w-3.5 h-3.5 shrink-0" />
                  <span>Zufällig</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleClearCategory(category.name)}
                  className="px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-sm"
                  title="Kategorie komplett leeren"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Leeren</span>
                </button>
              </div>

              {[100, 200, 300, 400, 500].map((points) => {
                const isFilled = !!boardData[`${category.name}-${points}`]?.question?.trim();
                return (
                  <button
                    key={points}
                    onClick={() => openCell(category.name, points)}
                    className={`w-full p-5 rounded-xl text-center text-sm font-bold border transition-all cursor-pointer active:scale-95 block
                      ${isFilled 
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white border-emerald-600 shadow-md' 
                        : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-300 shadow-sm'
                      }`}
                  >
                    {points}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-10">
          <button 
            onClick={() => filledCount < 25 ? setShowWarning(true) : handleSaveTrigger()}
            disabled={isSaving}
            className="bg-[#3b42f1] hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black tracking-wide text-sm transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            SPIEL-BOARD SPEICHERN
          </button>
        </div>
      </div>

      {/* POPUP FRAGEN MODAL */}
      {activeCell && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div className="pr-4 break-words max-w-[60%]">
                <span className="text-xs font-bold text-[#ff7a22] uppercase tracking-wider block">{activeCell.category}</span>
                <h3 className="text-xl font-black text-slate-900">{activeCell.points} Punkte Kachel</h3>
              </div>
              
              {poolSuggestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-amber-200 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {showSuggestions ? "Zurück zur Eingabe" : `Fragenpool (${poolSuggestions.length})`}
                </button>
              )}
            </div>

            {showSuggestions ? (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verfügbare Fragen aus der Cloud:</h4>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                  {poolSuggestions.map((sug) => {
                    // Vergleiche basierend auf eindeutiger poolQuestionId statt Frage-Text
                    const isAlreadyInBoard = sug._id && Object.values(boardData).some(
                      (clue) => clue.poolQuestionId === sug._id
                    );

                    return (
                      <button
                        key={sug._id}
                        onClick={() => selectSuggestion(sug)}
                        className={`w-full text-left p-3.5 border rounded-xl transition text-sm flex flex-col gap-1 cursor-pointer
                          ${isAlreadyInBoard 
                            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70 text-slate-800' 
                            : 'bg-slate-50 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-800'
                          }`}
                      >
                        <div className="flex justify-between items-start w-full gap-2">
                          <span className="font-bold break-words">{sug.question}</span>
                          {isAlreadyInBoard && (
                            <span className="shrink-0 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              ✓ Board
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-medium break-words ${isAlreadyInBoard ? 'text-emerald-700' : 'text-indigo-600'}`}>
                          Antwort: {sug.answer}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#3b42f1] uppercase tracking-wider">Frage</label>
                  <textarea 
                    value={tempQuestion}
                    onChange={(e) => setTempQuestion(e.target.value)}
                    placeholder="Tippe eine eigene Frage..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 min-h-[70px] focus:outline-none transition resize-y font-medium text-sm"
                  />
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-indigo-500" /> Fragen-Medium <span className="text-[9px] text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="url"
                      value={tempQuestionMedia}
                      onChange={(e) => setTempQuestionMedia(e.target.value)}
                      placeholder="Bild-, YouTube- oder Spotify-URL für die Frage..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <MediaPreview url={tempQuestionMedia} label="Fragen-Medien" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#3b42f1] uppercase tracking-wider">Antwort</label>
                  <textarea 
                    rows="2" 
                    value={tempAnswer} 
                    onChange={(e) => setTempAnswer(e.target.value)}
                    placeholder="Hier die Antwort eingeben..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-indigo-500 transition resize-y"
                  ></textarea>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-emerald-500" /> Antwort-Medium <span className="text-[9px] text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="url"
                      value={tempAnswerMedia}
                      onChange={(e) => setTempAnswerMedia(e.target.value)}
                      placeholder="Bild-URL für die Auflösung..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <MediaPreview url={tempAnswerMedia} label="Antwort-Medien" />
                  </div>
                </div>

                <label className="flex items-start gap-3 bg-indigo-50/50 hover:bg-indigo-50 p-3 rounded-xl border border-indigo-100 transition cursor-pointer mt-2 select-none">
                  <input 
                    type="checkbox"
                    checked={saveToPool}
                    onChange={(e) => setSaveToPool(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="text-xs text-slate-700 font-medium leading-tight flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Diese Frage im globalen Fragenpool speichern</span>
                  </div>
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setActiveCell(null)} className="w-1/2 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition">Abbrechen</button>
              <button 
                type="button"
                onClick={saveCell} 
                disabled={!tempQuestion?.trim() || !tempAnswer?.trim()} 
                className="w-1/2 py-3 bg-indigo-600 disabled:opacity-40 text-white rounded-xl font-bold cursor-pointer hover:bg-indigo-700 transition"
              >
                Sichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: WARNUNG BEI UNVOLLSTÄNDIGEM BOARD */}
      {showWarning && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center"><AlertTriangle className="w-10 h-10" /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">Board unvollständig</h3>
              <p className="text-slate-500 text-sm mt-2">Es sind nicht alle 25 Felder ausgefüllt. Möchtest du trotzdem speichern?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowWarning(false)} className="w-1/2 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer">Zurück</button>
              <button onClick={handleSaveTrigger} className="w-1/2 py-3 bg-amber-500 text-white rounded-xl font-bold cursor-pointer">Trotzdem weiter</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NEU - AUSWAHL DER SICHTBARKEIT (PRIVAT / ÖFFENTLICH) */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sichtbarkeit wählen</h3>
              <p className="text-slate-500 text-sm mt-1">Wer darf dieses Board sehen und spielen?</p>
            </div>

            <div className="space-y-3">
              {/* Option: Öffentlich */}
              <button 
                onClick={() => setIsPublic(true)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition flex items-center gap-4 cursor-pointer
                  ${isPublic 
                    ? 'border-indigo-600 bg-indigo-50/50' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
              >
                <div className={`p-3 rounded-xl ${isPublic ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Öffentliches Board</div>
                  <div className="text-xs text-slate-500">Jeder registrierte Nutzer kann dieses Board sehen und spielen.</div>
                </div>
              </button>

              {/* Option: Privat */}
              <button 
                onClick={() => setIsPublic(false)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition flex items-center gap-4 cursor-pointer
                  ${!isPublic 
                    ? 'border-indigo-600 bg-indigo-50/50' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
              >
                <div className={`p-3 rounded-xl ${!isPublic ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Privates Board</div>
                  <div className="text-xs text-slate-500">Nur du kannst dieses Board in deiner Liste sehen und starten.</div>
                </div>
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowPrivacyModal(false)} 
                className="w-1/2 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition"
              >
                Abbrechen
              </button>
              <button 
                onClick={proceedToSave} 
                className="w-1/2 py-3 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer hover:bg-indigo-700 transition"
              >
                Finale Speicherung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ERFOLGSMELDUNG */}
      {showSuccess && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center"><CheckCircle className="w-10 h-10" /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">Erfolgreich gespeichert!</h3>
              <p className="text-slate-500 text-sm mt-2">
                Dein Board wurde als <strong>{isPublic ? 'öffentliches' : 'privates'}</strong> Board in der MongoDB hinterlegt.
              </p>
            </div>
            <button onClick={() => { setShowSuccess(false); navigate('/'); }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer">Zurück zur Startseite</button>
          </div>
        </div>
      )}

    </div>
  );
}