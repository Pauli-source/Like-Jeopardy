import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  tags: { 
    type: [String], 
    required: true, 
    default: ['allgemein'] 
  }
}, { collection: 'categorytemplates' });

categorySchema.add({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null bedeutet "System-Standard" (für die bereits existierenden Kategorien)
  }
});

const CategoryTemplate = mongoose.model('CategoryTemplate', categorySchema);
export default CategoryTemplate;