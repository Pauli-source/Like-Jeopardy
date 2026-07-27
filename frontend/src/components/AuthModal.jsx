import API_BASE_URL from "../config/api";

import { useState } from 'react';

export default function AuthModal({ isOpen, onClose, authReason = '', initialMode = true, onSuccess }) {
  const [isLogin, setIsLogin] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatarBase64, setAvatarBase64] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // initialMode is used to set initial local state; parent can remount component
  // by changing the `key` prop if it needs to reset internal mode.

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarError('');

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Das Bild ist zu groß. Bitte wähle eine Datei unter 5 MB.');
      setAvatarBase64('');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const endpoint = isLogin
  ? "/auth/login"
  : "/auth/register";
    const payload = isLogin
      ? { username, password }
      : {
          username,
          password,
          avatar: avatarBase64 || 'https://api.dicebear.com/7.x/bottts/svg?seed=Default'
        };

    try {
      const response = await ffetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMessage = 'Etwas ist schiefgelaufen.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          const textError = await response.text();
          console.error('Server-Fehler-Details:', textError);
          errorMessage = `Server-Fehler: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Speichere Token und User global
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Callback an Parent
      if (onSuccess) {
        try { onSuccess(data.user); } catch (err) { console.warn('onSuccess callback failed', err); }
      }

      // Cleanup
      setUsername('');
      setPassword('');
      setAvatarBase64('');
      setAvatarError('');
      setError('');
      setIsLoading(false);

      if (onClose) onClose();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 text-slate-800">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative border border-slate-100 animate-fade-in">
        <button
          onClick={() => { if (onClose) onClose(); setError(''); setAvatarError(''); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer p-2"
        >
          ✕
        </button>

        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {isLogin ? 'Willkommen!' : 'Konto erstellen'}
          </h3>
          {authReason ? (
            <p className="text-indigo-600 text-xs font-bold bg-indigo-50 py-1.5 px-3 rounded-lg inline-block animate-pulse">
              ✨ {authReason}
            </p>
          ) : (
            <p className="text-slate-500 text-xs font-medium">
              {isLogin ? 'Melde dich an, um eigene Jeopardy-Boards zu erstellen.' : 'Erstelle ein Profil und lade dein eigenes Bild hoch.'}
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Benutzername</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Dein Username..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-indigo-500 transition text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Passwort</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 6 Zeichen..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-indigo-500 transition text-slate-800"
            />
          </div>

          {!isLogin && (
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Profilbild hochladen (optional)</label>
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {avatarBase64 ? (
                    <img src={avatarBase64} alt="Vorschau" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">Bild</span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer w-full"
                />
              </div>
              <p className="text-xs text-gray-500">Max. Dateigröße: 5 MB (JPG, PNG, WebP)</p>
              {avatarError && (
                <p className="text-xs text-rose-500">{avatarError}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#3b42f1] hover:bg-blue-700 text-white rounded-xl font-black text-sm transition tracking-wider active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Bitte warten...' : (isLogin ? 'ANMELDEN' : 'REGISTRIEREN')}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); setAvatarBase64(''); setAvatarError(''); }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
          >
            {isLogin ? 'Noch kein Konto? Jetzt registrieren' : 'Bereits ein Konto? Hier anmelden'}
          </button>
        </div>
      </div>
    </div>
  );
}
