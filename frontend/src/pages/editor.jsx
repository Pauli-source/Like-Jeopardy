import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Check, HelpCircle, X, Lock, Globe, Hash, Image as ImageIcon } from 'lucide-react';
import API_BASE_URL from "../config/api";

export default function Editor() {
  const navigate = useNavigate();
  const [dbCategories, setDbCategories] = useState([]); // Lädt Vorlagen aus dem Backend
  const [selectedCategories, setSelectedCategories] = useState([]); // Speichert gewählte Objekte
  const [boardTitle, setBoardTitle] = useState('Mein Jeopardy Board');
  const [activeInfo, setActiveInfo] = useState(null); // Für das i-Icon Pop-up

  // States für das Erstellen einer neuen eigenen Kategorie
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatTags, setNewCatTags] = useState(''); // String-Eingabe für Tags (z.B. "Sport, Fussball")
  const [isPrivate, setIsPrivate] = useState(false);
  const [poolClues, setPoolClues] = useState([
    { value: 100, question: '', answer: '', questionMedia: '', answerMedia: '' },
    { value: 200, question: '', answer: '', questionMedia: '', answerMedia: '' },
    { value: 300, question: '', answer: '', questionMedia: '', answerMedia: '' },
    { value: 400, question: '', answer: '', questionMedia: '', answerMedia: '' },
    { value: 500, question: '', answer: '', questionMedia: '', answerMedia: '' },
  ]);
  const [activeMediaModal, setActiveMediaModal] = useState(null); // { type: 'question' | 'answer', index: number, url: string }
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTags, setEditTags] = useState('');

  // States für die Tag-Filterung im Pool
  const [allTags, setAllTags] = useState([]); // Alle einzigartigen Tags aus der DB
  const [activeTagFilter, setActiveTagFilter] = useState(null); // Aktuell ausgewählter Tag-Filter

  // 1. SCHUTZ-CHECK: Fängt nicht angemeldete User direkt ab
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Bitte melde dich zuerst an, um den Editor zu nutzen!");
      navigate('/');
    }
  }, [navigate]);

  // Prüft, ob alle Pflichtfelder ausgefüllt sind (Inklusive Tags bei öffentlichen Kategorien)
  const isFormValid = newCatName.trim() !== '' && 
    newCatDesc.trim() !== '' &&
    (isPrivate || newCatTags.trim() !== '') && // Tags sind nur bei öffentlichen Kategorien Pflicht
    poolClues.every(clue => clue.question.trim() !== '' && clue.answer.trim() !== '');

  // Hilfsfunktion zum Aktualisieren einzelner Fragen
  const handleClueChange = (index, field, value) => {
    const updatedClues = [...poolClues];
    updatedClues[index][field] = value;
    setPoolClues(updatedClues);
  };

  // Kategorien beim Laden aus der MongoDB holen
  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/category-templates`);
      if (!response.ok) throw new Error('Fehler beim Laden');
      const data = await response.json();
      setDbCategories(data);
      
      // Extrahiere alle einzigartigen Tags aus den geladenen Kategorien für die Filter-Leiste
      const tagsSet = new Set();
      data.forEach(cat => {
        if (cat.tags && Array.isArray(cat.tags)) {
          cat.tags.forEach(tag => tagsSet.add(tag.toLowerCase().trim()));
        }
      });
      setAllTags(Array.from(tagsSet));
    } catch (error) {
      console.error('Kategorien konnten nicht geladen werden:', error);
    }
  };

  useEffect(() => {
    const loadTemplates = async () => {
      await fetchTemplates();
    };
    loadTemplates();
  }, []);

  // Logik: Kategorie auswählen / abwählen
  const toggleCategory = (categoryObj) => {
    const isSelected = selectedCategories.some(c => c.name === categoryObj.name);
    if (isSelected) {
      setSelectedCategories(selectedCategories.filter(c => c.name !== categoryObj.name));
    } else {
      if (selectedCategories.length < 5) {
        setSelectedCategories([...selectedCategories, categoryObj]);
      }
    }
  };

  // Eine komplett neue Kategorie erstellen (Lokal ODER Datenbank)
  const generateLocalCategoryId = () => `local_${Date.now()}`;

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Tags aus dem String-Feld parsen und bereinigen
    const parsedTags = isPrivate 
      ? ['privat'] 
      : newCatTags.split(',').map(tag => tag.replace('#', '').trim().toLowerCase()).filter(tag => tag !== '');

    const generatedCategory = {
      _id: isPrivate ? generateLocalCategoryId() : undefined,
      name: newCatName.trim(),
      description: newCatDesc.trim(),
      tags: parsedTags,
      isLocalPrivate: isPrivate, 
      clues: poolClues.map(c => ({
        value: c.value,
        question: c.question.trim(),
        answer: c.answer.trim(),
        questionMedia: c.questionMedia.trim() || '',
        answerMedia: c.answerMedia.trim() || ''
      }))
    };

    if (isPrivate) {
      if (selectedCategories.length >= 5) {
        alert("Dein Board ist bereits voll (5 Kategorien). Du musst erst einen Platz frei machen, um eine private Kategorie direkt hinzuzufügen.");
        return;
      }
      setSelectedCategories([...selectedCategories, generatedCategory]);
      resetForm();
      return;
    }

    // 2. ABSICHERUNG: Token beim Erstellen öffentlicher Kategorien mitsenden
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/category-templates`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(generatedCategory)
      });

      if (response.ok) {
        await Promise.all(
          poolClues.map(clue => 
            fetch(`${API_BASE_URL}/question-pool`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                category: newCatName.trim(),
                value: clue.value,
                question: clue.question.trim(),
                answer: clue.answer.trim(),
                questionMedia: clue.questionMedia.trim() || '',
                answerMedia: clue.answerMedia.trim() || ''
              })
            })
          )
        );

        resetForm();
        fetchTemplates();
        alert("Kategorie (inkl. Tags) und 5 Fragen erfolgreich in der Cloud angelegt! 🎉");
      } else {
        alert('Fehler beim Erstellen der Kategorie auf dem Server.');
      }
    } catch (error) {
      console.error('Netzwerkfehler beim Erstellen:', error);
    }
  };

  const resetForm = () => {
    setNewCatName('');
    setNewCatDesc('');
    setNewCatTags(''); 
    setIsPrivate(false);
    setPoolClues([
      { value: 100, question: '', answer: '', questionMedia: '', answerMedia: '' },
      { value: 200, question: '', answer: '', questionMedia: '', answerMedia: '' },
      { value: 300, question: '', answer: '', questionMedia: '', answerMedia: '' },
      { value: 400, question: '', answer: '', questionMedia: '', answerMedia: '' },
      { value: 500, question: '', answer: '', questionMedia: '', answerMedia: '' },
    ]);
    setActiveMediaModal(null);
  };

  // 3. ABSICHERUNG: Token beim Bearbeiten von Kategorien mitsenden
  const handleUpdateCategory = async () => {
    if (!editName.trim() || !editDesc.trim() || !editTags.trim()) {
      alert("Bitte fülle alle Felder aus.");
      return;
    }

    const parsedTags = editTags
      .split(',')
      .map(tag => tag.replace('#', '').trim().toLowerCase())
      .filter(tag => tag !== '');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/category-templates/${activeInfo._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim(),
          tags: parsedTags
        })
      });

      if (response.ok) {
        alert("Kategorie erfolgreich aktualisiert! 🎉");
        setIsEditing(false);
        setActiveInfo(null);
        fetchTemplates(); 
      } else {
        alert("Fehler beim Aktualisieren auf dem Server.");
      }
    } catch (error) {
      console.error("Netzwerkfehler beim Updaten:", error);
    }
  };

  // Kategorien filtern basierend auf dem ausgewählten Tag
  const filteredDbCategories = activeTagFilter
    ? dbCategories.filter(cat => cat.tags?.map(t => t.toLowerCase().trim()).includes(activeTagFilter))
    : dbCategories;

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 p-6 md:p-12 font-sans selection:bg-purple-200 relative">
      
      {/* SCROLLBAR */}
      <style>{`
        .feste-scrollbar::-webkit-scrollbar {
          width: 8px !important;
          display: block !important;
        }
        .feste-scrollbar::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 1) !important;
          border-radius: 9999px;
        }
        .feste-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 122, 34, 0.4) !important;
          border-radius: 9999px;
          border: 1px solid rgba(241, 245, 249, 1);
        }
        .feste-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 122, 34, 0.7) !important;
        }
      `}</style>
      
      {/* HEADER BEREICH */}
      <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="bg-white hover:bg-slate-100 text-slate-700 p-3 rounded-full shadow-sm border border-slate-200 transition active:scale-95 cursor-pointer flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <span className="text-sm font-bold text-[#3b42f1] uppercase tracking-wider">Schritt 1 von 2</span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Erstelle dein eigenes Jeopardy Board
            </h1>
          </div>
        </div>
        
        <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 self-start md:self-center font-bold">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>{selectedCategories.length} von 5 gewählt</span>
        </div>
      </div>

      {/* UPPER MAIN LAYOUT GRID */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* KATEGORIE POOL mit Tag-Filter */}
        <div className="bg-[#ff7a22]/10 rounded-3xl p-6 shadow-sm border border-[#ff7a22]/20 md:col-span-1 flex flex-col min-h-[500px]">          
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Verfügbare Kategorien</h2>
          
          {/* Tag-Filterleiste */}
          {allTags.length > 0 && (
            <div className="mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Filter nach Tag:</span>
              <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto pr-1 feste-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTagFilter(null)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer border
                    ${!activeTagFilter 
                      ? 'bg-[#ff7a22] text-white border-[#ff7a22]' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  Alle
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-0.5
                      ${activeTagFilter === tag 
                        ? 'bg-[#ff7a22] text-white border-[#ff7a22]' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    <Hash className="w-2.5 h-2.5" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 overflow-y-scroll flex-1 max-h-[350px] pr-2 feste-scrollbar">
            {filteredDbCategories.map((cat) => {
              const isSelected = selectedCategories.some(c => c.name === cat.name);
              const isFull = selectedCategories.length >= 5;
              
              return (
                <div 
                  key={cat._id || 'local_' + cat.name}
                  className={`flex items-center justify-between rounded-2xl font-bold text-sm transition-all duration-200 border w-full
                    ${isSelected 
                      ? 'bg-[#3b42f1] text-white border-[#3b42f1] shadow-md shadow-blue-100' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    disabled={isFull && !isSelected}
                    className="px-4 py-3 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-left flex-1 min-w-0"
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3] shrink-0" />}
                    <div className="flex flex-col min-w-0 w-full">
                      <span className="truncate">{cat.name}</span>
                      {cat.tags && cat.tags.length > 0 && (
                        <span className={`text-[9px] font-medium mt-0.5 truncate uppercase tracking-wider
                          ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                          {cat.tags.map(t => `#${t}`).join(' ')}
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center shrink-0 h-full">
                    <button 
                      type="button"
                      onClick={() => setActiveInfo(cat)}
                      className={`px-3 py-3.5 border-l cursor-pointer transition-colors h-full flex items-center justify-center rounded-r-2xl
                        ${isSelected ? 'border-blue-400 hover:bg-blue-700 text-blue-200' : 'border-slate-200 hover:bg-slate-200 text-slate-400'}`}
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredDbCategories.length === 0 && (
              <div className="text-center text-xs text-slate-400 font-medium py-8 bg-white/40 rounded-2xl border border-dashed border-slate-200">
                Keine Kategorien mit diesem Tag gefunden.
              </div>
            )}
          </div>
        </div>

        {/* Eigene Kategorie hinzufügen */}
        <form onSubmit={handleCreateCategory} className="bg-[#00d2ff]/10 rounded-3xl p-6 shadow-sm border border-[#00d2ff]/20 md:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#00d2ff]/20 pb-2">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Neue Kategorie hinzufügen</h2>
            
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm
                ${isPrivate 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'bg-white text-[#00b2d9] border border-[#00d2ff]/30'}`}
            >
              {isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              {isPrivate ? 'Status: Privat' : 'Status: Öffentlich'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategorie Name *</label>
              <input
                type="text"
                placeholder="z.B. Wissenschaft, Essen..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#00d2ff]/30 font-medium shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Erklärung *</label>
              <input
                type="text"
                placeholder="Kurze Beschreibung..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#00d2ff]/30 font-medium shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#00b2d9] uppercase mb-1">
                Tags {isPrivate ? '(Optional)' : '*'}
              </label>
              <input
                type="text"
                placeholder="z.B. sport, geschichte, 90er"
                value={newCatTags}
                onChange={(e) => setNewCatTags(e.target.value)}
                disabled={isPrivate}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#00d2ff]/30 font-medium shadow-sm disabled:bg-slate-100/50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Fragen für diese Kategorie (100 - 500 Punkte)</label>
            <div className="space-y-2.5">
              {poolClues.map((clue, index) => (
                <div key={clue.value} className="grid grid-cols-12 gap-2 items-center bg-white/60 p-2.5 rounded-xl border border-[#00d2ff]/20 shadow-sm">
                  <div className="col-span-2 text-center font-black text-xs text-slate-600 bg-slate-100 py-1.5 rounded-lg border border-slate-200">
                    {clue.value}
                  </div>
                  <div className="col-span-5 relative">
                    <input
                      type="text"
                      placeholder="Frage..."
                      value={clue.question}
                      onChange={(e) => handleClueChange(index, 'question', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-[#00d2ff]/20 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setActiveMediaModal({ type: 'question', index, url: clue.questionMedia || '' })}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 transition cursor-pointer ${
                        clue.questionMedia ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-slate-500'
                      }`}
                      title="Medium für Frage hinzufügen"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="col-span-5 relative">
                    <input
                      type="text"
                      placeholder="Antwort..."
                      value={clue.answer}
                      onChange={(e) => handleClueChange(index, 'answer', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-[#00d2ff]/20 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setActiveMediaModal({ type: 'answer', index, url: clue.answerMedia || '' })}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 transition cursor-pointer ${
                        clue.answerMedia ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-slate-500'
                      }`}
                      title="Medium für Antwort hinzufügen"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!isFormValid}
              className={`text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition flex items-center gap-1 shadow-sm disabled:cursor-not-allowed disabled:opacity-40
                ${isPrivate ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-[#3b42f1] hover:bg-blue-700 text-white'}`}
            >
              {isPrivate ? 'Zum Board hinzufügen' : 'In Datenbank speichern'}
            </button>
          </div>
        </form>
      </div>

      {/* LOWER MAIN AREA */}
      <div className="max-w-6xl w-full mx-auto space-y-6">
        
        {/* TITEL DIREKT BEI DER VORSCHAU INTEGRIERT */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider shrink-0">
            BOARD VORSCHAU
          </h2>
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Titel:</span>
            <input
              id="board-title"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              placeholder="Mein Jeopardy Board"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3b42f1]/30 text-xs font-semibold"
            />
          </div>
        </div>

        {/* BOARD VORSCHAU RASTER */}
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[0, 1, 2, 3, 4].map((index) => {
              const cat = selectedCategories[index];
              
              return (
                <div key={index} className="space-y-3">
                  {cat ? (
                    <div className={`p-4 rounded-2xl text-center font-black shadow-sm min-h-[70px] flex flex-col items-center justify-center text-sm md:text-base text-white relative
                      ${cat.isLocalPrivate 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
                        : 'bg-gradient-to-br from-purple-600 to-indigo-600'}`}>
                      <span>{cat.name}</span>
                      {cat.isLocalPrivate && (
                        <span className="text-[10px] opacity-75 font-bold flex items-center gap-0.5 mt-0.5">
                          <Lock className="w-2.5 h-2.5" /> Privat
                        </span>
                      )}
                      
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); 
                          toggleCategory(cat); 
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 shadow-sm cursor-pointer z-10"
                        title="Aus Board entfernen"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 text-slate-400 p-4 rounded-2xl text-center font-medium min-h-[70px] flex items-center justify-center text-xs bg-slate-50">
                      Freier Slot {index + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* WEITER BUTTON */}
        <div className="flex justify-end pt-4">
          <button
            disabled={selectedCategories.length !== 5}
            onClick={() => navigate('/questions', { state: { selectedCategories, title: boardTitle } })}
            className={`px-8 py-4 rounded-2xl font-black tracking-wide text-sm transition-all shadow-lg
              ${selectedCategories.length === 5
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-100 cursor-pointer hover:-translate-y-0.5 active:translate-y-0'
                : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
              }`}
          >
            WEITER ZU DEN FRAGEN
          </button>
        </div>
      </div>

      {/* MEDIA LINK MODAL */}
      {activeMediaModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-4">
            <button 
              type="button"
              onClick={() => setActiveMediaModal(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Medien-Link</span>
                <h3 className="text-xl font-black text-slate-900">
                  {activeMediaModal.type === 'question' ? 'Frage-Medium' : 'Antwort-Medium'}
                </h3>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  URL einfügen (optional)
                </label>
                <input
                  type="url"
                  placeholder="z.B. https://... oder YouTube/Spotify-Link"
                  value={activeMediaModal.url}
                  onChange={(e) => setActiveMediaModal({ ...activeMediaModal, url: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setActiveMediaModal(null)} 
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Abbrechen
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (activeMediaModal.type === 'question') {
                      handleClueChange(activeMediaModal.index, 'questionMedia', activeMediaModal.url);
                    } else {
                      handleClueChange(activeMediaModal.index, 'answerMedia', activeMediaModal.url);
                    }
                    setActiveMediaModal(null);
                  }} 
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INFO / EDIT MODAL */}
      {activeInfo && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-4">
            <button 
              type="button"
              onClick={() => { setActiveInfo(null); setIsEditing(false); }} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {isEditing ? (
              // BEARBEITUNGS-MODUS
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Kategorie bearbeiten</span>
                  <h3 className="text-xl font-black text-slate-900">Details anpassen</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Kategorie Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Erklärung</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows="3"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tags (kommagetrennt)</label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="z.B. sport, fussball"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)} 
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button 
                    type="button"
                    onClick={handleUpdateCategory} 
                    className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            ) : (
              // REINER VIEW-MODUS
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#3b42f1] uppercase tracking-wider">Kategorie-Info</span>
                  <h3 className="text-2xl font-black text-slate-900 pr-6">{activeInfo.name}</h3>
                </div>
                <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {activeInfo.description || "Für diese Kategorie wurde noch keine Erklärung hinterlegt."}
                </p>
                
                {activeInfo.tags && activeInfo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block w-full mb-0.5">Zugeordnete Tags:</span>
                    {activeInfo.tags.map(tag => (
                      <span key={tag} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-bold border border-slate-200 flex items-center gap-0.5">
                        <Hash className="w-2.5 h-2.5 text-slate-400" /> {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {!activeInfo.isLocalPrivate && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditName(activeInfo.name);
                        setEditDesc(activeInfo.description || '');
                        setEditTags(activeInfo.tags ? activeInfo.tags.join(', ') : '');
                        setIsEditing(true);
                      }} 
                      className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Bearbeiten
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => setActiveInfo(null)} 
                    className={`py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer ${activeInfo.isLocalPrivate ? 'w-full' : 'w-2/3'}`}
                  >
                    Verstanden
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}