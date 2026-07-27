import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import CategoryTemplate from './models/categoryTemplate.js';
import QuestionPool from './models/questionPool.js';
import Board from './models/board.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/user.js';
import auth from './middleware/auth.js';

const app = express();
const PORT = 5050;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// MongoDB Verbindung
dotenv.config();
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jeopardy';
mongoose.connect(mongoURI)
  .then(() => console.log('Erfolgreich mit MongoDB verbunden (DB):', mongoose.connection.name))
  .catch(err => console.error('Fehler bei der MongoDB-Verbindung:', err));

// ============================================================================
// 0. AUTHENTIFIZIERUNG ROUTES (Registrierung & Login)
// ============================================================================

// POST: Neuen Benutzer registrieren
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, avatar } = req.body;

    // 1. Validierung der Eingaben
    if (!username || !password) {
      return res.status(400).json({ message: 'Bitte Benutzername und Passwort angeben.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: 'Der Benutzername muss mindestens 3 Zeichen lang sein.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
    }

    // 2. Prüfen, ob der Benutzer bereits existiert
    const existingUser = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }); // Case-insensitive Prüfung
    if (existingUser) {
      return res.status(400).json({ message: 'Dieser Benutzername ist leider schon vergeben.' });
    }

    // 3. Passwort verschlüsseln (Hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Benutzer in der DB speichern
    const newUser = new User({
      username: username.trim(),
      password: hashedPassword,
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}` // Dynamischer Avatar basierend auf Username
    });

    await newUser.save();

    // 5. Token generieren, damit der Nutzer sofort eingeloggt ist
    const token = jwt.sign(
      { id: newUser._id, userId: newUser._id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token ist 7 Tage gültig
    );

    res.status(201).json({
      message: 'Registrierung erfolgreich!',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        avatar: newUser.avatar
      }
    });

  } catch (error) {
    console.error('Fehler bei der Registrierung:', error);
    res.status(500).json({ message: 'Serverfehler bei der Registrierung.' });
  }
});

// POST: Benutzer einloggen
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Bitte Benutzername und Passwort angeben.' });
    }

    // 1. Benutzer in der DB suchen
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(400).json({ message: 'Ungültige Anmeldedaten.' });
    }

    // 2. Passwort überprüfen
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Ungültige Anmeldedaten.' });
    }

    // 3. Token generieren
    const token = jwt.sign(
      { id: user._id, userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Erfolgreich eingeloggt!',
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Fehler beim Login:', error);
    res.status(500).json({ message: 'Serverfehler beim Login.' });
  }
});

// ============================================================================
// 1. KATEGORIE-VORLAGEN ROUTES (category-templates)
// ============================================================================

app.get('/api/category-templates', async (req, res) => {
  try {
    const templates = await CategoryTemplate.find();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Neue Kategorie erstellen (Jetzt AUCH mit Tags!)
app.post('/api/category-templates', async (req, res) => {
  try {
    const { name, description, tags } = req.body;
    
    // Tags säubern und vereinheitlichen
    let cleanedTags = ['allgemein'];
    if (tags && Array.isArray(tags)) {
      const parsed = tags.map(t => t.trim().toLowerCase()).filter(t => t !== '');
      if (parsed.length > 0) cleanedTags = parsed;
    }

    const newTemplate = new CategoryTemplate({ 
      name, 
      description,
      tags: cleanedTags
    });
    
    await newTemplate.save();
    res.status(201).json(newTemplate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// NEU - PUT: Bestehende Kategorie updaten (Tags, Name & Beschreibung bearbeiten)
app.put('/api/category-templates/:id', async (req, res) => {
  try {
    const { name, description, tags } = req.body;

    let cleanedTags = [];
    if (tags && Array.isArray(tags)) {
      cleanedTags = tags
        .map(t => t.trim().toLowerCase())
        .filter(t => t !== '');
    }

    const updatedCategory = await CategoryTemplate.findByIdAndUpdate(
      req.params.id,
      {
        name: name ? name.trim() : undefined,
        description: description ? description.trim() : undefined,
        tags: cleanedTags.length > 0 ? cleanedTags : ['allgemein'] // Fallback, falls alle Tags gelöscht wurden
      },
      { new: true, runValidators: true } // Gibt das neue Dokument zurück
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Kategorie nicht gefunden.' });
    }

    res.json(updatedCategory);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Kategorie:', error);
    res.status(500).json({ message: 'Serverfehler beim Bearbeiten der Kategorie.' });
  }
});

// ============================================================================
// 2. FRAGEN-POOL ROUTES (question-pool)
// ============================================================================

app.get('/api/question-pool', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category) {
      query.category = category;
    }
    const questions = await QuestionPool.find(query);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/question-pool', async (req, res) => {
  try {
    const { category, value, question, answer, questionMedia, answerMedia, mediaUrl } = req.body;
    
    const newPoolQuestion = new QuestionPool({
      category,
      value,
      question,
      answer,
      questionMedia: questionMedia || "",
      answerMedia: answerMedia || "",
      mediaUrl: mediaUrl || ""
    });

    await newPoolQuestion.save();
    res.status(201).json(newPoolQuestion);
  } catch (error) {
    console.error("Fehler beim Erstellen der Pool-Frage:", error);
    res.status(500).json({ message: "Server-Fehler beim Speichern der Pool-Frage" });
  }
});

// ============================================================================
// 3. GAME-BOARD ROUTES (boards)
// ============================================================================

app.get('/api/boards', async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    let currentUserId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dein_super_geheimnis_hier');
          currentUserId = decoded.id || decoded.userId || null;
        } catch (error) {
          currentUserId = null;
        }
      }
    }

    const query = currentUserId
      ? {
          $or: [
            { isPublic: true },
            { createdBy: currentUserId }
          ]
        }
      : { isPublic: true };

    const boards = await Board.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username avatar');
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/boards/:id', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board nicht gefunden' });
    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Neues Board erstellen (Jetzt GESCHÜTZT!)
app.post('/api/boards', auth, async (req, res) => {
  try {
    const { title, categories, isPublic } = req.body;

    const formattedCategories = categories.map(cat => ({
      name: cat.name,
      description: cat.description || "",
      clues: cat.clues.map(clue => ({
        value: clue.value,
        question: clue.question || "",
        answer: clue.answer || "",
        questionMedia: clue.questionMedia || "",
        answerMedia: clue.answerMedia || "",
        mediaUrl: clue.mediaUrl || ""
      }))
    }));

    // Hier weisen wir das Board dem Ersteller zu (req.user kommt aus der Middleware!)
    const newBoard = new Board({
      title,
      categories: formattedCategories,
      createdBy: req.user.id || req.user.userId,
      isPublic: typeof isPublic === 'boolean' ? isPublic : true
    });

    await newBoard.save();
    res.status(201).json(newBoard);
  } catch (error) {
    console.error("Fehler beim Speichern des Boards:", error);
    res.status(500).json({ message: "Server-Fehler beim Speichern des Boards" });
  }
});

// PUT: Bestehendes Board aktualisieren (nur Ersteller darf ändern)
app.put('/api/boards/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board nicht gefunden' });
    }

    const currentUserId = req.user?.id || req.user?.userId;
    if (!currentUserId || board.createdBy.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: 'Nicht autorisiert, dieses Board zu ändern' });
    }

    const { title, categories, isPublic } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;

    if (typeof isPublic === 'boolean') updateData.isPublic = isPublic;

    if (categories !== undefined) {
      updateData.categories = categories.map(cat => ({
        name: cat.name,
        description: cat.description || '',
        clues: (cat.clues || []).map(clue => ({
          value: clue.value,
          question: clue.question || '',
          answer: clue.answer || '',
          questionMedia: clue.questionMedia || '',
          answerMedia: clue.answerMedia || '',
          mediaUrl: clue.mediaUrl || ''
        }))
      }));
    }

    const updatedBoard = await Board.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedBoard);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Boards:', error);
    res.status(500).json({ message: 'Server-Fehler beim Aktualisieren des Boards' });
  }
});

// DELETE: Board löschen (nur Ersteller darf löschen)
app.delete('/api/boards/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board nicht gefunden.' });
    }

    const currentUserId = req.user?.userId || req.user?.id;
    if (!currentUserId || board.createdBy.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: 'Nicht autorisiert. Du kannst nur deine eigenen Boards löschen!' });
    }

    const deletedBoard = await Board.findByIdAndDelete(req.params.id);
    res.json({ message: 'Board erfolgreich gelöscht', deletedBoard });
  } catch (error) {
    console.error('Fehler beim Löschen des Boards:', error);
    res.status(500).json({ message: 'Server-Fehler beim Löschen des Boards' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend-Server läuft auf http://localhost:${PORT}`);
});