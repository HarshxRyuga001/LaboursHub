import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Contacts } from "./models/Contact.js";
import mongoose from "mongoose";
import { log } from "console";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import {User} from "./models/User.js"
import multer from "multer";
import fs from "fs";
import session from "express-session";

const app = express();
app.use(express.urlencoded({ extended: true }));

// Handle __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware - mere contact form se jo bhi data aaiga usko jso format me convert krke req.body me dal dega
app.use(express.json());

// To render css files
app.use(express.static(path.join(__dirname, "../Client")));

// MongoDB connection
mongoose.connect(
    "mongodb+srv://yourtypenot17:XXZgZOkVH3jdkXMH@cluster0.f7lp2.mongodb.net/LaboursHub",
    {
        dbName: "LaboursHub"
    }
).then(() => console.log("MongoDB Connected")).catch((err) => console.log(err))

// API to handle form submission jo bhi data form me aaiga vo mongodb me save hoga
app.post("/api/contact", async (req, res) => {
  try {
    // Ye niche vale teen try kiye the lekin they were of no use....
    // let name = document.getElementById('name');
    // let email = document.getElementById('email');
    // let message = document.getElementById('message');

    // Console me data website se aa raha hai ki nahi vo check krne ke liye krvaya hai
    console.log(req.body);

    // const { name } = req.body;
    // console.log(name);

    const { name, email, message } = req.body;
    const newContact = new Contacts({ name, email, message });
    await newContact.save();
    res.status(201).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error("Error saving contact:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Register page ka logic

// ---------- Ensure krenge ki uploads folder exist krta ki nahi ----------
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// ---------- multer config use krenge image save ke liye ----------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, Date.now() + '_' + name + ext);
  }
});

function fileFilter (req, file, cb) {
  // accept images only
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

// ---------- POST /register handler ----------
app.post('/register', upload.single('validProof'), async (req, res) => {
  try {
    const { name, email, phone, city, password, identity, role } = req.body;
    const file = req.file;

    // basic validation
    if (!name || !email || !phone || !city || !password || !identity || !role) {
      if (file && file.path) fs.unlinkSync(file.path);
      return res.status(400).send('Missing required fields.');
    }

    // role must be 'labour' or 'customer' (extra safety)
    if (!['labour','customer'].includes(role)) {
      if (file && file.path) fs.unlinkSync(file.path);
      return res.status(400).send('Invalid role selected.');
    }

    // check existing user by email or phone
    const existing = await User.findOne({ $or: [{ email }, { phone }] }).exec();
    if (existing) {
      if (file && file.path) fs.unlinkSync(file.path);
      return res.status(409).send('User with this email or phone already exists.');
    }

    // hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // create user document
    const userDoc = new User({
      name,
      email,
      phone,
      city,
      passwordHash,
      identity,
      role, // saved here
      validProof: {
        filename: file.filename,
        path: path.relative(__dirname, file.path),
        mimetype: file.mimetype,
        size: file.size
      }
    });

    await userDoc.save();

    return res.redirect('/login.html');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal Server Error');
  }
});

// ---------- optional: serve uploaded files ----------
app.use('/uploads', express.static(UPLOAD_DIR));


// Login Page ka logic 

// session create kr rahe hai
app.use(session({
  name: 'laburshub-secret',
  secret: process.env.SESSION_SECRET || 'change_this_secret_in_prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax"
  }
}));

app.post('/login', async (req, res) => {
  try {
    const { role, email, password } = req.body;

    if (!role || !email || !password) {
      return res.redirect('/login.html?err=' + encodeURIComponent('Missing required fields.'));
    }
    if (!['labour','customer'].includes(role)) {
      return res.redirect('/login.html?err=' + encodeURIComponent('Invalid role.'));
    }

    // Find user with matching email AND role
    const user = await User.findOne({ email: email.toLowerCase(), role }).exec();
    if (!user) {
      return res.redirect('/login.html?err=' + encodeURIComponent('Invalid email or password.'));
    }

    // Compare password
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.redirect('/login.html?err=' + encodeURIComponent('Invalid email or password.'));
    }

    // Auth success: create session
    req.session.userId = user._id.toString();
    req.session.role = user.role;
    req.session.name = user.name;
    

    // Redirect based on role (change pages as you prefer)
    if (user.role === 'customer') {
      return res.redirect('/dashboard.html');
    } else {
      return res.redirect('/dashboards.html');
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.redirect('/login.html?err=' + encodeURIComponent('Server error. Try again.'));
  }
});

// logout krne ka logic
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    // ignore error, redirect to login
    res.clearCookie('laburshub-secret');
    return res.redirect('/login.html');
  });
});

// Ensure krne ka ki user login kre aisa
function ensureAuth(roleRequired) {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) return res.redirect('/login.html?err=' + encodeURIComponent('Please login.'));
    if (roleRequired && req.session.role !== roleRequired) {
      return res.redirect('/login.html?err=' + encodeURIComponent('Access denied.'));
    }
    next();
  };
}

app.get('/labour-dashboard.html', ensureAuth('labour'), (req, res) => {
  res.sendFile(path.join(__dirname, '../Client/dashboard.html'));
});


// Profile page ka logic
app.put("/api/profile", upload.single("image"), async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: "Not logged in" });
    }
    const userId = req.session.user.id;

    // Build update object from incoming form fields
    const update = {};

    // Common fields
    if (req.body.name) update.name = req.body.name;
    if (req.body.phone) update.phone = req.body.phone;
    if (req.body.location) update.location = req.body.location;

    // Role-specific fields (if present)
    if (req.body.company) update.company = req.body.company;
    if (req.body.skills) {
      // Accept comma-separated skills string -> store as array
      update.skills = req.body.skills.split(",").map(s => s.trim()).filter(Boolean);
    }
    if (req.body.experience) update.experience = req.body.experience;
    if (req.body.availability) update.availability = req.body.availability; // "available" / "not-available"

    // If image uploaded, save its path
    if (req.file && req.file.path) {
      // store relative path like "uploads/12345.jpg"
      update.image = req.file.path.replace(/\\/g, "/");
    }

    // Update the user in 'users' collection (adjust if your model name differs)
    const updated = await User.findByIdAndUpdate(userId, { $set: update }, { new: true }).lean();

    if (!updated) return res.status(404).json({ message: "User not found" });

    // Return updated user (omit sensitive fields in production)
    res.json({ message: "Profile updated", user: updated });

  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Profile update failed", error: err.message });
  }
});



// Fetch all labours for dashboard availability
app.get("/api/labours", async (req, res) => {
  try {
    const labours = await User.find({ role: "labour" }).select(
      "name skills rating price availability image location"
    );

    res.json(labours);

  } catch (err) {
    console.log("Labour fetch error:", err);
    res.status(500).json({ message: "Failed to fetch labours" });
  }
});


// Html Files ko render krvane ke liye route
app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../Client", "/index.html"));
});

const port = 1000;

app.listen(port, () => console.log(`Server is running on port ${port}`));
