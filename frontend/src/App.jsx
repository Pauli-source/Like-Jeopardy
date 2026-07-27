import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Editor from './pages/editor';
import Questions from './pages/questions';
import SelectBoard from './pages/SelectBoard';
import GameSession from './pages/GameSession';
import Rules from './pages/rules';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/select-board" element={<SelectBoard />} />
        <Route path="/game-session" element={<GameSession />} />
        <Route path="/edit" element={<Editor />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/rules" element={<Rules />} />
      </Routes>
    </BrowserRouter>
  );
}
