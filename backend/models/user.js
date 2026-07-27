import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Benutzername ist erforderlich'],
    unique: true,
    trim: true,
    minlength: [3, 'Der Benutzername muss mindestens 3 Zeichen lang sein']
  },
  password: {
    type: String,
    required: [true, 'Passwort ist erforderlich'],
    minlength: [6, 'Das Passwort muss mindestens 6 Zeichen lang sein']
  },
  avatar: {
    type: String,
    default: 'https://api.dicebear.com/7.x/bottts/svg?seed=Jeopardy'
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', UserSchema);
export default User;