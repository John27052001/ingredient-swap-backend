require('dotenv').config();
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("API running!"));

// ====== User model and Auth logic ======
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// ---- Register ----
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ email, password: hashed, ingredients: [], favorites: [] });
    res.json({ message: "User created!" });
  } catch (e) {
    res.status(400).json({ error: "User already exists" });
  }
});

// ---- Login ----
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Invalid credentials" });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

// ---- Auth middleware ----
function auth(req, res, next) {
  const token = req.headers['authorization']?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ---- Get/Set Ingredients and Favorites ----
app.get("/api/ingredients", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  res.json({ ingredients: user.ingredients, favorites: user.favorites });
});

app.post("/api/ingredients", auth, async (req, res) => {
  const { ingredients, favorites } = req.body;
  await User.findByIdAndUpdate(req.userId, { ingredients, favorites });
  res.json({ message: "Updated" });
});

// ====== MongoDB connection and server start ======
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => {
    app.listen(process.env.PORT || 5000, () => 
      console.log("Server running on port", process.env.PORT || 5000)
    );
    console.log("MongoDB connected");
  })
  .catch(err => console.log("MongoDB error:", err));
