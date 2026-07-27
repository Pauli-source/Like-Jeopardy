import mongoose from 'mongoose';

const QuestionPoolSchema = new mongoose.Schema({
  category: { type: String, required: true },
  value: { type: Number, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  questionMedia: { type: String, default: "" }, 
  answerMedia: { type: String, default: "" },   
  mediaUrl: { type: String, default: "" }        
}, { 
  timestamps: true,
  collection: 'questionpools' // 👈 HIER wird die Collection bombenfest definiert!
});

const QuestionPool = mongoose.model('QuestionPool', QuestionPoolSchema);
export default QuestionPool;