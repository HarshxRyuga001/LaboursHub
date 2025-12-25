import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import session from "express-session";
import multer from "multer";
import fs from "fs";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

import { User } from "./models/User.js";
import { Contacts } from "./models/Contact.js";
import { Job } from "./models/Job.js";

const app = express();

// checking empty strings and invalid phone numbers
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

/* ---------------- BASIC SETUP ---------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5500",
    credentials: true,
  })
);

/* ---------------- SESSION ---------------- */

app.use(
  session({
    name: "laburshub.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // keep false for localhost
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

/* ---------------- STATIC ---------------- */

app.use(express.static(path.join(__dirname, "../Client")));

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
app.use("/uploads", express.static(UPLOAD_DIR));

/* ---------------- DATABASE ---------------- */

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "LaboursHub",
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

/* ---------------- AUTH MIDDLEWARE ---------------- */

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not logged in" });
    }

    if (req.session.user.role !== role) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
}

app.post(
  "/api/rate/:labourId",
  requireAuth,
  requireRole("customer"),
  async (req, res) => {
    try {
      const { rating } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Invalid rating" });
      }

      const labour = await User.findById(req.params.labourId);

      if (!labour || labour.role !== "labour") {
        return res.status(404).json({ message: "Labour not found" });
      }

      labour.ratings.push(rating);

      const avg =
        labour.ratings.reduce((a, b) => a + b, 0) / labour.ratings.length;

      labour.rating = Math.round(avg * 10) / 10; // 1 decimal

      await labour.save();

      res.json({
        message: "Rating submitted",
        rating: labour.rating,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Rating failed" });
    }
  }
);

/* ---------------- MULTER ---------------- */

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }

    cb(null, true);
  },
});

/* ---------------- AUTH APIs ---------------- */

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.redirect("/login.html?err=User not found");
  }

  if (user.role !== role) {
    return res.redirect("/login.html?err=Please select correct role");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.redirect("/login.html?err=Wrong password");
  }

  req.session.user = {
    id: user._id,
    role: user.role,
    name: user.name,
  };

  return res.redirect(
    user.role === "customer" ? "/dashboard.html" : "/dashboards.html"
  );
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("laburshub-secret");
    res.redirect("/login.html");
  });
});

// CHECK LOGIN
app.get("/api/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ loggedIn: false });
  }
  res.json({ loggedIn: true, user: req.session.user });
});

/* ---------------- Registering new user ---------------- */

app.post("/register", upload.single("validProof"), async (req, res) => {
  try {
    const { name, email, phone, city, password, role, identity } = req.body;

    if (!name || !email || !phone || !city || !password || !role || !identity) {
      return res.redirect("/register.html?err=Missing fields");
    }

    if (!["customer", "labour"].includes(role)) {
      return res.redirect("/register.html?err=Invalid role");
    }

    const existing = await User.findOne({
      $or: [
        { email, role },
        { phone, role },
      ],
    });

    if (existing) {
      return res.redirect("/register.html?err=User already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    if (
      !isNonEmptyString(name) ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(password) ||
      !isValidPhone(phone)
    ) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const user = new User({
      name,
      email,
      phone,
      city,
      role,
      identity,
      passwordHash,
      validProof: req.file
        ? {
            filename: req.file.filename,
            path: "uploads/" + req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : undefined,
    });

    await user.save();

    res.redirect("/login.html");
  } catch (err) {
    console.error("Register error:", err);
    res.redirect("/register.html?err=Server error");
  }
});

/* ---------------- PROFILE APIs ---------------- */

app.get("/api/profile", requireAuth, async (req, res) => {
  const user = await User.findById(req.session.user.id).lean();
  res.json({ user, role: req.session.user.role });
});

app.put(
  "/api/profile",
  requireAuth,
  (req, res, next) => {
    upload.single("image")(req, res, function (err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const allowedFields = [
        "name",
        "phone",
        "city",
        "skills",
        "experience",
        "availability",
      ];

      const update = {};

      allowedFields.forEach((field) => {
        const value = req.body[field];

        if (!value) return;

        if (!isNonEmptyString(value)) {
          return;
        }

        if (field === "phone" && !isValidPhone(value)) {
          return;
        }

        update[field] = value.trim();
      });

      if (update.skills) {
        update.skills = update.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      if (req.file) {
        update.image = "uploads/" + req.file.filename;
      }

      const user = await User.findByIdAndUpdate(
        req.session.user.id,
        { $set: update },
        { new: true }
      ).lean();

      if (Object.keys(update).length === 0 && !req.file) {
        return res.status(400).json({
          message: "No valid fields provided to update",
        });
      }

      res.json({
        message: "Profile updated",
        user,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Profile update failed" });
    }
  }
);

/* ---------------- DASHBOARD API ---------------- */

app.get("/api/labours", requireAuth, async (req, res) => {
  try {
    const labours = await User.find({ role: "labour" })
      .select("name skills availability image rating experience city")
      .lean();

    res.json(
      labours.map((l) => ({
        id: l._id,
        name: l.name,
        skills: l.skills || [],
        availability: l.availability || "available",
        image: l.image || "uploads/default.png",

        // ✅ REAL rating from DB
        rating: l.rating || 0,

        // ⚠️ Temporary placeholder (OK for now)
        price: "₹800/day",

        bio: l.experience || "Experienced labour",
        city: l.city || "",
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load labours" });
  }
});

/* ---------------- CONTACT ---------------- */

app.post("/api/contact", async (req, res) => {
  await new Contacts(req.body).save();
  res.json({ message: "Message sent" });
});

/*---------- Customer hires labour ----------*/
app.post(
  "/api/hire/:labourId",
  requireAuth,
  requireRole("customer"),
  async (req, res) => {
    const job = await Job.create({
      customerId: req.session.user.id,
      labourId: req.params.labourId,
    });

    // 🔔 REAL-TIME NOTIFY LABOUR
    const labourSocket = onlineUsers.get(req.params.labourId);
    if (labourSocket) {
      io.to(labourSocket).emit("new-job", job);
    }

    res.json({ message: "Hire request sent", job });
  }
);

/*---------- LABOUR VIEW JOB REQUESTS ----------*/
app.get("/api/jobs", requireAuth, requireRole("labour"), async (req, res) => {
  if (req.session.user.role !== "labour") {
    return res.status(403).json({ message: "Access denied" });
  }

  const jobs = await Job.find({ labourId: req.session.user.id })
    .populate("customerId", "name phone city")
    .sort({ createdAt: -1 });

  res.json(jobs);
});

/*---------- ACCEPT / REJECT JOB ----------*/
app.put(
  "/api/jobs/:id",
  requireAuth,
  requireRole("labour"),
  async (req, res) => {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    // 🔔 REAL-TIME NOTIFY CUSTOMER
    const customerSocket = onlineUsers.get(job.customerId.toString());
    if (customerSocket) {
      io.to(customerSocket).emit("job-status-updated", job);
    }

    res.json({ job });
  }
);

/* ---------------- START ---------------- */

const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: "http://localhost:5500",
    credentials: true,
  },
});

httpServer.listen(process.env.PORT || 1000, () => {
  console.log("Server + Socket running on http://localhost:1000");
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("disconnect", () => {
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});
