const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
const path = require('path');
const routes = require('./routes/index');
const User = require('./models/User');

dotenv.config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: `${process.env.MONGODB_URI}/mylove` }),
  })
);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', routes);

// Seed users
const seedUsers = async () => {
  try {
    const users = [
      { username: `${process.env.username}`, password:`${process.env.password}` },
      { username: `${process.env.username1}`, password:`${process.env.password1}` },
    ];

    const userCount = await User.countDocuments();
    console.log('Current user count:', userCount);
    if (userCount === 0) {
      for (const user of users) {
        await User.create({
          username: user.username,
          password: user.password, // Let pre('save') handle hashing
        });
        console.log(`Created user: ${user.username}`);
      }
      console.log('Predefined users created: user1, user2');
    } else {
      console.log('Users already exist, skipping seeding');
    }
  } catch (err) {
    console.error('Error seeding users:', err);
  }
};

// MongoDB connection
mongoose.connect(`${process.env.MONGODB_URI}/mylove`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to MongoDB');
  await seedUsers();
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});