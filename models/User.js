const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    console.log(`Hashing password for ${this.username}`);
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.statics.authenticate = async function (username, password) {
  console.log('Authenticating user:', username);
  const user = await this.findOne({ username });
  if (!user) {
    console.log('User not found:', username);
    return null;
  }
  console.log('User found:', user.username);
  const isMatch = await bcrypt.compare(password, user.password);
  console.log('Password match:', isMatch);
  return isMatch ? user : null;
};

module.exports = mongoose.model('User', userSchema);