import mongoose from 'mongoose';

const ClueSchema = new mongoose.Schema({
  value: { type: Number, required: true },
  question: { type: String, default: "" },
  answer: { type: String, default: "" },
  questionMedia: { type: String, default: "" }, 
  answerMedia: { type: String, default: "" },   
  mediaUrl: { type: String, default: "" }        
});

const BoardCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  clues: [ClueSchema]
});

const BoardSchema = new mongoose.Schema({
  title: { type: String, required: true, default: "Mein Jeopardy Board" },
  categories: [BoardCategorySchema],
  
  // Verknüpfung zum User
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Da die Route jetzt geschützt ist, muss jeder Ersteller eingeloggt sein
  },
  
  // Geändert von isPrivate zu isPublic (passend zur server.js)
  isPublic: {
    type: Boolean,
    default: true // Standardmäßig für alle sichtbar
  }
}, { 
  timestamps: true,
  collection: 'boards'
});

const Board = mongoose.model('Board', BoardSchema);
export default Board;