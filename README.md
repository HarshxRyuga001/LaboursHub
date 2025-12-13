# 🏗️ LabursHub – Construction Labour Hiring Platform

LabursHub is a **full-stack web application** designed to connect **construction labours** with **customers** who want to hire them.
The platform is built with **simplicity, accessibility, and professionalism** in mind, especially for labours who may have limited smartphone or technical knowledge.

---

## 🚀 Project Objective

* Allow **labours** to register, manage their profiles, and get hired
* Allow **customers** to find, view, and hire available labours
* Provide **real-time availability updates**
* Maintain a **simple, mobile-friendly UI**
* Use **secure session-based authentication**

---

## 🧱 Tech Stack

### Frontend

* HTML5
* CSS3 (Responsive Design + Animations)
* JavaScript (Vanilla JS)

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* express-session (Session-based authentication)
* Multer (Image upload handling)

---

## 📂 Project Structure (Simplified)

```
Client/
 ├── index.html
 ├── about.html
 ├── contact.html
 ├── login.html
 ├── register-labour.html
 ├── register-customer.html
 ├── profile.html
 ├── dashboard.html
 ├── faq.html
 ├── styles/
 ├── scripts/
 ├── assets/
Server/
├── uploads/
├── models/
 ├── User.js
 ├── Contacts.js
├── server.js
├── package.json
```

---

## 📄 Pages Implemented

### 
### ✅ Home Page

* Video background
* Simple call-to-action
* Responsive navigation with mobile toggle

### ✅ About Section [ on home page ]

* Platform description
* Clean and professional layout
* Animations

### ✅ Contact Section [ on home page ]

* Contact form
* Data stored in MongoDB
* Form resets after submission
* Animations + responsive layout

### ✅ Authentication

* **Single Login Page** (Labour & Customer)
* Session-based authentication using `express-session`
* Secure login persistence across pages

### ✅ Registration page

* Separate registration pages:

  * Register as Labour
  * Register as Customer
* Image upload support (profile photo)

---

## 👤 Profile Page (Single Shared Page)

A **dynamic profile page** used by both labours and customers.

### Features:

* Loads **real user data from MongoDB**
* Role-based form fields:

  * **Labour**: skills, experience, availability
  * **Customer**: company details
* Profile image loaded from `/uploads`
* Update profile functionality
* Availability toggle (Available / Not Available)

---

## 📊 Dashboard (Single Dynamic Dashboard)

### Labour Cards (for customers):

* Card-based layout
* Shows:

  * Profile image
  * Name
  * Skill set
  * Rating
  * Price
  * Availability badge
* Mobile & desktop responsive

### Live Availability Sync:

* Dashboard re-fetches labour data every **10 seconds**
* Availability changes from profile are reflected automatically
* No page reload required

---

## 🧠 Backend Features

### Session Management

* Uses `express-session`
* Sessions persist across page navigation
* No repeated login required

### APIs Implemented

* `POST /api/login`
* `POST /api/register`
* `GET /api/profile`
* `PUT /api/profile` (update profile + image upload)
* `GET /api/labours` (dashboard data)
* `POST /api/contact`
* `POST /logout`

### Image Upload

* Handled via **Multer**
* Images stored in `/uploads`
* Image path stored in MongoDB
* Served statically via Express

---

## 🔐 Authentication & Security

* Session-based authentication (no JWT on frontend)
* Secure cookies (`httpOnly`, `sameSite: lax`)
* Protected routes using session checks
* Proper logout using `req.session.destroy()`

---

## 📱 Responsive Design

* Mobile-first approach
* Easy-to-use UI for labours
* Toggle navigation on small screens
* Tables and cards adapt to screen size

---

## ✨ Animations & UX Enhancements

* Smooth fade-in animations
* Hover effects
* Accordion-style FAQ
* Interactive dashboard cards

---

## 🧪 Current Status

✅ Core features completed
✅ Frontend & backend integrated
✅ Real-time availability working
⏳ Optional enhancements pending (admin panel, notifications, sorting)

---

## 🔮 Possible Future Enhancements

* Admin dashboard
* Sorting & filtering labours
* Pagination
* Booking confirmation flow
* Notifications
* Socket.io for real-time updates
* Deployment (Render / Railway / VPS)

---

## 🧑‍💻 Author

**LabursHub**
A real-world job marketplace project for the construction industry.

Just tell me 👍
