import mongoose from 'mongoose';
import dotenv from 'dotenv';

// .env Datei laden, damit wir an den echten Connection-String kommen
dotenv.config();

const questionSchema = new mongoose.Schema({
  category: { type: String, required: true },
  value: { type: Number, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

const QuestionPool = mongoose.model('QuestionPool', questionSchema, 'questionpools');

// Hier deine Fragen eintragen (Achte darauf, dass die Kategorie exakt so heißt wie im Editor!)
const questionPoolData = [
  {
    category: "Wer weiß denn sowas?",
    value: 100,
    question: "Welche Funktion führt das Hormon Melatonin aus?",
    answer: "steuert den Schlaf-Wach-Rhythmus"
  },
  {
    category: "Wer weiß denn sowas?",
    value: 200,
    question: "Was hat Johannes Gutenberg erfunden?",
    answer: "Den Buchdruck, 1450"
  },
{
    category: "Wer weiß denn sowas?",
    value: 300,
    question: "Wie viele Staaten hat die USA?",
    answer: "50"
  },
  {
    category: "Wer weiß denn sowas?",
    value: 400,
    question: "Ein Kubikmeter Wasser wiegt wie viele Kilogramm?",
    answer: "1000"
  },
  {
    category: "Wer weiß denn sowas?",
    value: 500,
    question: "Wofür steht die Abkürzung Haribo?",
    answer: "Hans Riegel Bonn"
  }, 
];

// Holt sich den Link jetzt vollautomatisch aus der .env
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ FEHLER: Keine MONGO_URI in deiner .env Datei gefunden!");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("🍃 Erfolgreich mit MongoDB Cloud verbunden!");
    console.log("🌱 Befülle den Fragen-Pool...");
    
    await QuestionPool.insertMany(questionPoolData);
    
    console.log("✅ Fragen erfolgreich in den Pool hochgeladen!");
    mongoose.connection.close();
  })
  .catch(err => {
    console.error("❌ Fehler beim Seeding:", err.message);
  });