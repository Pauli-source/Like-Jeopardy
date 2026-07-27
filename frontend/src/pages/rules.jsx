import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  Save,
  Play,
  Trophy,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Users,
  MonitorPlay,
  Lock,
  WandSparkles,
  BadgeCheck,
  Image
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
  } catch {
    localStorage.removeItem('token');
    return null;
  }
};

export default function Rules() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getStoredToken()));

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(Boolean(getStoredToken()));
    syncAuth();
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const generalSteps = [
    {
      title: '1. Board erstellen',
      text: 'Wähle Kategorien, ergänze Fragen und Antworten und baue dein eigenes Jeopardy-Board auf.',
      icon: Layers,
      accent: 'from-indigo-500 to-blue-600'
    },
    {
      title: '2. Speichern & Teilen',
      text: 'Sobald alle Felder gefüllt sind, kannst du das Board speichern – privat oder öffentlich.',
      icon: Save,
      accent: 'from-emerald-500 to-teal-600'
    },
    {
      title: '3. Spiel starten',
      text: 'Wähle dein Board, lege Teams an, ordne Avatare zu und starte das Match direkt im Browser.',
      icon: Play,
      accent: 'from-amber-500 to-orange-600'
    },
    {
      title: '4. Hosting & Punkte',
      text: 'Ein Host leitet das Spiel, liest die Fragen vor und vergibt Punkte oder Minuspunkte pro Team.',
      icon: MonitorPlay,
      accent: 'from-fuchsia-500 to-violet-600'
    }
  ];

  const creationSteps = [
    {
      title: 'SCHRITT 1: Kategorien wählen oder neu anlegen',
      text: 'Du kannst vorhandene Kategorien nutzen oder selbst eine neue Kategorie mit Erklärung und Tags anlegen. Die Tags dienen dafür, dass du später nach Genre filtern kannst.',
      icon: Layers
    },
    {
      title: 'SCHRITT 2: Fragen im Editor bearbeiten',
      text: 'Im Editor-Modus kannst du neue Fragen bzw. Antworten direkt eingeben oder bestehende Fragen aus dem Fragenpool wählen.',
      icon: WandSparkles
    },
    {
      title: 'SCHRITT 3: Fragenpool nutzen',
      text: 'Wenn dir egal ist welche Fragen gespielt werden, dann klicke einfach auf den "zufällig" Button. Das System wählt dann einfach random Fragen aus und befüllt damit die Kategorie.',
      icon: Sparkles
    },
    {
      title: 'SCHRITT 4: Medieneinbettung',
      text: 'Füge zu Fragen bzw. Antworten direkte Links ein, um mit Bildern, Videos oder Songs zu arbeiten. Hier kannst du einfach die Links von Google-Bilder, YouTube-Videos oder Spotify-Tracks kopieren.',
      icon: Image
    },
    {
      title: 'SCHRITT 5: Board fertigstellen',
      text: 'Sobald eine Frage gespeichert wurde, wird das Feld im Raster grün. Hast du eine Frage aus dem Fragenpool gewählt, dann ist diese ebenfalls grün markiert, dass du weißt welche Fragen bereits im Board sind. Wenn alle 25 Felder grün sind ist das Board komplett und kann gespeichert werden.',
      icon: CheckCircle2
    },
    {
      title: 'SCHRITT 6: Privat oder Öffentlich',
      text: 'Am Ende entscheidest du, ob dein Board für alle sichtbar sein soll oder nur für dich verfügbar ist.',
      icon: Lock
    }
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 p-6 md:p-12 font-sans flex flex-col items-center">
      <div className="max-w-7xl w-full space-y-10">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
          <button onClick={() => navigate('/')} className="bg-white hover:bg-slate-100 text-slate-700 p-3 rounded-full shadow-sm border border-slate-200 transition active:scale-95 cursor-pointer flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Anleitung & Infos</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">So funktioniert die Plattform</h1>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg text-xs">01</span>
            Allgemeiner Spiel- und Hosting-Ablauf
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {generalSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className={`rounded-2xl bg-gradient-to-br ${step.accent} p-3 w-fit text-white shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-slate-900 text-base">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.text}</p>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Schritt {index + 1}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Die offiziellen Jeopardy-Regeln</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 font-medium">
            <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-100/50">
              <span className="font-black text-indigo-600 text-base bg-white w-7 h-7 rounded-lg flex items-center justify-center shadow-sm shrink-0">1</span>
              <p className="leading-relaxed">Die Teams wählen nacheinander eine <strong>Kategorie</strong> und eine <strong>Punktzahl</strong> auf dem Spielfeld aus (z.B. "Wer weiß denn sowas 200").</p>
            </div>
            <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-100/50">
              <span className="font-black text-indigo-600 text-base bg-white w-7 h-7 rounded-lg flex items-center justify-center shadow-sm shrink-0">2</span>
              <p className="leading-relaxed">Sobald die Frage erscheint, wird sie vom Host laut vorgelesen. <strong>Wer zuerst buzzert</strong>, darf die Frage beantworten.</p>
            </div>
            <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-100/50">
              <span className="font-black text-indigo-600 text-base bg-white w-7 h-7 rounded-lg flex items-center justify-center shadow-sm shrink-0">3</span>
              <p className="leading-relaxed">War die Antwort richtig, bekommt das Team die Punkte gutgeschrieben. Wer möchte, kann auch pro falsche Antwort Punkte abziehen. Am besten regelt ihr das unter euch, wie ihr spielen wollt.</p>
            </div>
            <div className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl border border-slate-100/50">
              <span className="font-black text-indigo-600 text-base bg-white w-7 h-7 rounded-lg flex items-center justify-center shadow-sm shrink-0">4</span>
              <p className="leading-relaxed">Das Spiel endet, wenn alle 25 Felder gelöst wurden und der Host das Spiel über den "Match beenden" Button beendet.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg text-xs">02</span>
            Board-Erstellungs-Workflow
          </h2>

          {isLoggedIn ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creationSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 text-emerald-600 rounded-2xl p-2">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{`SCHRITT ${index + 1}`}</div>
                    </div>
                    <h3 className="font-black text-slate-900 text-base">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.text}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-indigo-50 via-white to-slate-50 border border-indigo-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-indigo-700">
                <BadgeCheck className="w-6 h-6" />
                <h3 className="font-black text-lg">Melde dich an, um eigene Boards zu erstellen</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nur eingeloggte Nutzer können eigene Boards bauen, den Fragenpool nutzen und den Hosting-Modus freischalten.
              </p>
              <Link to="/" className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-indigo-700 transition">
                <Users className="w-4 h-4" />
                Zur Anmeldung
              </Link>
            </div>
          )}
        </div>

        <div className="bg-slate-900 text-slate-400 p-8 rounded-3xl text-center space-y-2 border border-slate-800 shadow-xl shadow-slate-200/50">
          <div className="flex justify-center mb-2">
            <Trophy className="w-7 h-7 text-amber-400" />
          </div>
          <p className="text-base font-bold text-slate-200">
            Diese Plattform wurde mit viel ❤️ entwickelt von <span className="text-white font-black">Doro & Pauli</span>.
          </p>
          <p className="text-sm text-slate-400">
            Entstanden im Rahmen des Mastermoduls <span className="text-indigo-400 font-black tracking-wide">Web Engineering</span>.
          </p>
        </div>
      </div>
    </div>
  );
}