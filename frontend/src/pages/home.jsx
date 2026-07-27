import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthModal from '../components/AuthModal';
import { Play, Plus, Info, User } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  // States für das Auth-Modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authReason, setAuthReason] = useState(''); // Text-Hinweis für das Modal

  // State für den aktuell eingeloggten User (holt sich die Daten aus dem LocalStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Auth-Logik wird jetzt in der wiederverwendbaren Komponente `AuthModal` gehandhabt

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setShowLogoutModal(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#3b42f1] text-white flex items-center justify-center p-6 md:p-12 font-sans relative overflow-hidden">
      
      {/* Profil-Button oben rechts */}
      <div className="absolute top-6 right-6">
        <button 
          onClick={() => {
            if (currentUser) {
              setShowLogoutModal(true);
            } else {
              setShowAuthModal(true);
            }
          }}
          className="bg-white/20 p-1.5 rounded-full hover:bg-white/30 transition cursor-pointer flex items-center justify-center w-12 h-12 overflow-hidden border border-white/10"
          title={currentUser ? `Eingeloggt als ${currentUser.username}` : "Anmelden / Registrieren"}
        >
          {currentUser ? (
            <img 
              src={currentUser.avatar} 
              alt="Profilbild" 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <User className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Haupt-Container */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* LINKE SEITE: Die bunte Grafik-Collage */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto w-full aspect-square">
          <div className="bg-white rounded-tl-full w-full h-full"></div>
          
          <div className="bg-[#00d2ff] rounded-full w-full h-full flex items-center justify-center relative">
            <div className="bg-[#ffcc00] w-12 h-12 rounded md:w-16 md:h-16 flex items-center justify-center font-bold text-2xl text-black shadow-md transform rotate-12">
              ?
            </div>
          </div>
          
          <div className="bg-[#b96bf8] rounded-full w-full h-full"></div>
          
          <div className="bg-[#ff7a22] rounded-r-full w-full h-full"></div>
          
          <div className="bg-[#ffcc00] rounded-bl-full w-full h-full flex items-center justify-center relative">
            <div className="absolute bottom-6 left-6 bg-white p-3 rounded-xl shadow-md transform -rotate-12 text-black font-black text-xl">
              !?
            </div>
          </div>
          
          <div className="bg-white rounded-full w-full h-full"></div>
        </div>

        {/* RECHTE SEITE: Text & Buttons */}
        <div className="flex flex-col justify-center text-center md:text-left">
          <span 
            style={{ fontFamily: "'Brush Script MT', 'Comic Sans MS', cursive" }} 
            className="text-4xl md:text-5xl text-white/90 block mb-1"
          >
            Like
          </span>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none mb-6">
            Jeopardy
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-md mb-10 leading-relaxed">
            Spiele, individualisiere oder kreiere eigene Boards und challenge deine Freunde & Familie beim nächsten Quizzabend!
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link to="/select-board" className="bg-[#b96bf8] hover:bg-[#a24ee2] text-white font-bold px-8 py-4 rounded-full flex items-center justify-center gap-2 shadow-lg transition transform hover:scale-105">
              <Play className="w-5 h-5 fill-current" />
              SPIEL STARTEN
            </Link>
            
            {/* DYNAMISCHER BUTTON JE NACH LOGIN-STATUS */}
            {currentUser ? (
             <Link 
             to="/edit" 
             className="bg-[#00d2ff] hover:bg-[#00b2d9] text-black font-bold px-8 py-4 rounded-full flex items-center justify-center gap-2 shadow-lg transition transform hover:scale-105"
             >
             <Plus className="w-5 h-5" />
              BOARD ERSTELLEN
              </Link>
             ) : (
             <button
              onClick={() => {
              setAuthReason('Melde dich an, um eigene Boards zu erstellen!');
              setIsLogin(true); // Modal im Login-Modus öffnen
              setShowAuthModal(true);
             }}
             className="bg-slate-500/30 hover:bg-[#00d2ff] text-slate-300 hover:text-black font-bold px-8 py-4 rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition transform hover:scale-105 cursor-pointer border border-slate-500/20"
            >
            <Plus className="w-5 h-5" />
              BOARD ERSTELLEN
            </button>
            )}

            <button
              onClick={() => navigate('/rules')}
              className="bg-[#ff7a22] hover:bg-[#e06313] text-white font-bold px-8 py-4 rounded-full flex items-center justify-center gap-2 shadow-lg transition transform hover:scale-105"
            >
              <Info className="w-5 h-5" />
              REGELN
            </button>
          </div>
        </div>

      </div>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 text-slate-800">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative border border-slate-100 animate-fade-in">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer p-2"
            >
              ✕
            </button>

            <div className="text-center space-y-3">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Abmelden</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Möchtest du dich wirklich abmelden?</p>
            </div>

            <div className="flex flex-col items-center justify-center gap-3">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <User className="w-7 h-7 text-slate-400" />
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 bg-[#3b42f1] hover:bg-blue-700 text-white rounded-xl font-black text-sm transition tracking-wider active:scale-[0.98] cursor-pointer"
            >
              ABMELDEN
            </button>
          </div>
        </div>
      )}

      {/* Wiederverwendbares Auth-Modal */}
      <AuthModal
        key={isLogin ? 'login' : 'register'}
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setAuthReason(''); }}
        authReason={authReason}
        initialMode={isLogin}
        onSuccess={(user) => { setCurrentUser(user); }}
      />
    </div>
  );
}