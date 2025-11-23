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
import {Users} from "./models/User.js"
import multer from "multer";

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

// Register Form ko handle krne ka logic

// Multer setup krne ka
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../uploads/"); // iss folder me save hongi images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Labour registration route with image
app.post("/api/register-labour", upload.single("image"), async (req, res) => {
  try {
    const { name, skill, phone } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const newLabour = new Labour({
      fullname,
      email,
      phone,
      city,
      password,
      identity,
      valid_proof,
      image: imagePath,
    });

    await newLabour.save();
    res.status(201).json({ message: "Labour registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to register labour" });
  }
});


// API to handle form submission jo bhi data form me aaiga vo mongodb me save hoga
app.post("/api/user", async (req, res) => {
  try {
    // Ye niche vale teen try kiye the lekin they were of no use....
    // let name = document.getElementById('name');
    // let email = document.getElementById('email');
    // let message = document.getElementById('message');

    // Console me data website se aa raha hai ki nahi vo check krne ke liye krvaya hai
    console.log(req.body);




    // const { name } = req.body;
    // console.log(name);

    const { email, password } = req.body;
  //   const newContact = new Contacts({ name, email, message });
  //   await newContact.save();
  //   res.status(201).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error("Error saving contact:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Html Files ko render krvane ke liye route
app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../Client", "/index.html"));
});

const port = 1000;

app.listen(port, () => console.log(`Server is running on port ${port}`));
