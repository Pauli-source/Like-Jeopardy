import mongoose from 'mongoose';

// 1. Wir definieren das Schema direkt hier im Skript, damit Mongoose es kennt
const categoryTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  clues: [
    {
      value: { type: Number, required: true },
      question: { type: String, required: true },
      answer: { type: String, required: true }
    }
  ]
});

// Modell erstellen
const CategoryTemplate = mongoose.model('CategoryTemplate', categoryTemplateSchema);

// 2. Die Daten für den Pool
const templates = [
  {
    name: "Die ewigen Zweiten",
    description: "Hier werden nicht die Erstplatzierten, sondern die Zweitplatzierten aus Geschichte, Sport und Wissenschaft gesucht.",
    clues: [
      { value: 100, question: "Dieser Planet ist von der Sonne aus gesehen der zweite.", answer: "Was ist die Venus?" },
      { value: 200, question: "Er erreichte 1911 als zweiter Mensch den Südpol, kurz nach Roald Amundsen.", answer: "Wer ist Robert Falcon Scott?" },
      { value: 300, question: "Dieses Land verlor das WM-Finale 1974 gegen Deutschland und wurde Vize-Weltmeister.", answer: "Was sind die Niederlande?" },
      { value: 400, question: "Dieses chemische Element hat die Ordnungszahl 2 im Periodensystem.", answer: "Was ist Helium?" },
      { value: 500, question: "Er war der zweite US-Präsident nach George Washington.", answer: "Wer ist John Adams?" }
    ]
  },
  {
    name: "Klingt wie ein Pokémon",
    description: "Medikament, chemisches Element oder taschengroßes Monster? Ratet, was sich hinter dem Namen verbirgt.",
    clues: [
      { value: 100, question: "Hinter dem Begriff 'Dulcolax' verbirgt sich kein Pokémon, sondern ein...", answer: "Was ist ein Abführmittel?" },
      { value: 200, question: "Dieses echte Element im Periodensystem mit der Ordnungszahl 105 klingt wie ein legendäres Monster.", answer: "Was ist Dubnium?" },
      { value: 300, question: "Es ist ein entzündungshemmendes Schmerzmittel, kein Pflanzen-Pokémon.", answer: "Was ist Diclofenac?" },
      { value: 400, question: "Dieses Edelgas leuchtet in Schildern rötlich-orange und klingt nach einem Elektro-Pokémon.", answer: "Was ist Neon?" },
      { value: 500, question: "Ein bekanntes Magen-Darm-Medikament, das wie ein mächtiges Drachen-Pokémon klingt.", answer: "Was ist Pantoprazol?" }
    ]
  }
];

// 3. Verbindung aufbauen und Daten in die Cloud jagen
const MONGO_URI = "mongodb+srv://pwiessner_db_user:oMoKXRIwH81vERPJ@cluster0.foma8gb.mongodb.net/jeopardy?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("🌱 Verbindung für Seeding hergestellt...");
    // Altes Zeug in dieser Collection löschen
    await CategoryTemplate.deleteMany({});
    // Neue Vorlagen einfügen
    await CategoryTemplate.insertMany(templates);
    console.log("✅ Fragen-Pool erfolgreich mit 'Die ewigen Zweiten' und 'Klingt wie ein Pokémon' befüllt!");
    mongoose.connection.close();
  })
  .catch(err => {
    console.error("❌ Fehler beim Seeding:", err);
  });