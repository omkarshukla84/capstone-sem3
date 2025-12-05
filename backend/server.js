import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


dotenv.config();

const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");


// Configure multer for memory storage (for Vercel support)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit (MongoDB doc limit is 16MB)
});

// Serve static files from uploads directory (keep for backward compatibility if needed, though we are moving to Base64)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//Scehma
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  profilePicture: { type: String }, // Will store Base64 string
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// Note Schema
const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String },
  summary: { type: String },
  tags: { type: [String], default: ["Live Recording"] },
  date: { type: Date, default: Date.now },
});

const Note = mongoose.model("Note", noteSchema);

// console.log(process.env.DATABASE_URL)
mongoose.connect(process.env.DATABASE_URL)
.then(() => console.log("Connected to MongoDB"))
.catch(err => {
  console.error("MongoDB connection failed:", err);
  process.exit(1);
});

//cors
app.use(
  cors()
);

app.use(express.json());

//signup
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashed,
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User created",
      user: { id: savedUser._id, name, email },
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Signup failed" });
  }
});


//login route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Wrong password" });

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Login failed" });
  }
});



//dashboard route
app.get("/api/dashboard", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ error: "User not found" });

    res.json({ message: `Welcome ${user.name}!` });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// --- User Profile API ---

// Get User Profile
app.get("/api/user", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password"); // Exclude password

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Update User Profile
app.put("/api/user", async (req, res) => {
  console.log("PUT /api/user called");
  console.log("Body:", req.body);
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { name, phoneNumber } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { name, phoneNumber },
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    
    console.log("User updated:", updatedUser);
    res.json(updatedUser);
  } catch (err) {
    console.error("Update failed:", err);
    res.status(400).json({ error: "Update failed" });
  }
});

// Upload Profile Picture
app.post("/api/user/avatar", upload.single('avatar'), async (req, res) => {
  console.log("POST /api/user/avatar called");
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    console.log("File uploaded (memory):", req.file.originalname);

    // Convert buffer to Base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const mimeType = req.file.mimetype;
    const profilePicture = `data:${mimeType};base64,${b64}`;

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { profilePicture },
      { new: true }
    ).select("-password");

    console.log("User avatar updated (Base64)");
    res.json({ profilePicture: updatedUser.profilePicture });

  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// --- Notes API ---

// Middleware to verify token
// Middleware to verify token
const authenticateToken = (req, res, next) => {
  console.log("Auth Middleware Hit");
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("No token provided");
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Token verification failed:", err.message);
      return res.sendStatus(403);
    }
    console.log("Token verified for user:", user.id);
    req.user = user;
    next();
  });
};

// Create a new note
app.post("/api/notes", authenticateToken, async (req, res) => {
  try {
    console.log("Creating new note:", req.body);
    const { title, content, tags } = req.body;
    const newNote = new Note({
      userId: req.user.id,
      title,
      content,
      summary: req.body.summary || "",
      tags: tags || ["Live Recording"]
    });
    const savedNote = await newNote.save();
    console.log("Note saved successfully:", savedNote._id);
    res.status(201).json(savedNote);
  } catch (err) {
    console.error("Error saving note:", err);
    res.status(400).json({ error: err.message });
  }
});

// Get all notes for user with filtering, sorting, pagination, and search
app.get("/api/notes", authenticateToken, async (req, res) => {
  try {
    const { filter, sort, page = 1, limit = 6, search } = req.query;
    const query = { userId: req.user.id };

    // Filtering
    if (filter && filter !== 'All') {
      query.tags = { $in: [filter] };
    }

    // Search
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Sorting
    const sortOption = { date: sort === 'oldest' ? 1 : -1 };

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalNotes = await Note.countDocuments(query);
    const notes = await Note.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.json({
      notes,
      currentPage: pageNum,
      totalPages: Math.ceil(totalNotes / limitNum),
      totalNotes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single note by ID
app.get("/api/notes/:id", authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a note
app.put("/api/notes/:id", authenticateToken, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title, content, tags, summary: req.body.summary },
      { new: true }
    );
    if (!updatedNote) return res.status(404).json({ error: "Note not found" });
    res.json(updatedNote);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// AI Query endpoint
app.post("/api/notes/:id/ai", authenticateToken, async (req, res) => {
  try {
    const { query, action } = req.body;
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!note) return res.status(404).json({ error: "Note not found" });
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    let prompt;
    if (action === "summary") {
      prompt = `Please provide a concise summary of the following note:\n\nTitle: ${note.title}\n\nContent: ${note.content}`;
    } else {
      prompt = `Based on this note:\n\nTitle: ${note.title}\n\nContent: ${note.content}\n\nQuestion: ${query}`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

// Delete a note
app.delete("/api/notes/:id", authenticateToken, async (req, res) => {
  try {
    const deletedNote = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deletedNote) return res.status(404).json({ error: "Note not found" });
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload and transcribe audio
app.post("/api/upload-audio", authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    // Read the audio file from buffer (memory storage)
    const audioBuffer = req.file.buffer;
    const audioBase64 = audioBuffer.toString('base64');

    // Determine MIME type based on file extension or mimetype
    const mimeType = req.file.mimetype || 'audio/mpeg';

    // Use Gemini to transcribe
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBase64
        }
      },
      "Please transcribe this audio file. Provide only the transcription text without any additional commentary."
    ]);

    const response = await result.response;
    const transcription = response.text();

    res.json({ transcription });
  } catch (err) {
    console.error("Transcription error:", err);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

// Generic AI Process Endpoint
app.post("/api/ai-process", authenticateToken, async (req, res) => {
  try {
    const { text, instruction, type } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    let prompt;
    if (type === 'summary') {
      prompt = `Please provide a concise and well-structured summary of the following text:\n\n${text}`;
    } else if (type === 'refine') {
      prompt = `Please refine the following text based on this instruction: "${instruction}".\n\nText:\n${text}\n\nReturn ONLY the refined text.`;
    } else if (type === 'query') {
      prompt = `Based on the following text, answer this question: "${instruction}"\n\nText:\n${text}`;
    } else {
      return res.status(400).json({ error: "Invalid process type" });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const processedText = response.text();

    res.json({ result: processedText });
  } catch (err) {
    console.error("AI Process Error:", err);
    res.status(500).json({ error: "Failed to process with AI" });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));