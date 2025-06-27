const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  ingredients: [String],
  favorites: [Number]
});
module.exports = mongoose.model('User', UserSchema);
