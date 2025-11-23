// =============================
// Mobile Menu Toggle
// =============================
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("inactive");
  menuToggle.classList.toggle("open");
});

// =============================
// Smooth Scroll Animation
// =============================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
    navLinks.classList.remove("active"); // Close menu after click on mobile
    menuToggle.classList.remove("open");
  });
});

// =============================
// Fade-In Animation on Scroll
// =============================
const faders = document.querySelectorAll(".step, .feature");

const appearOptions = {
  threshold: 0.2,
  rootMargin: "0px 0px -50px 0px",
};

const appearOnScroll = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("fade-in");
    observer.unobserve(entry.target);
  });
}, appearOptions);

faders.forEach((fader) => {
  appearOnScroll.observe(fader);
});

// Mobile menu toggle (shared for all pages)
const menuBtn = document.getElementById("menu-toggle");
const navList = document.getElementById("nav-links");

if (menuBtn && navList) {
  menuBtn.addEventListener("click", () => {
    const open = navList.classList.toggle("active");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-links");

  toggle.addEventListener("click", () => {
    nav.classList.toggle("show");
  });

  // Close menu when clicking a link (mobile)
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("show"));
  });
});

// Accordion Functionality
const accordionBtns = document.querySelectorAll(".accordion-btn");

accordionBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const content = btn.nextElementSibling;

    // Close all other accordions
    document.querySelectorAll(".accordion-content").forEach((acc) => {
      if (acc !== content) {
        acc.style.maxHeight = null;
        acc.style.padding = "0 15px";
      }
    });

    // Toggle selected accordion
    if (content.style.maxHeight) {
      content.style.maxHeight = null;
      content.style.padding = "0 15px";
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
      content.style.padding = "15px";
    }
  });
});

// Profile page ka logic
// Navbar Toggle
document.getElementById("menu-toggle").addEventListener("click", () => {
  document.querySelector(".nav-links").classList.toggle("active");
});

// Simulated Role (In real use, fetch from login session)
let userRole = "Customer"; // Change krne ka role to page me changes dikhenge

function loadProfileForm() {
  const form = document.getElementById("profileForm");
  form.innerHTML = "";

  if (userRole === "Labour") {
    form.innerHTML += `
      <label>Name</label><input type="text" value="John Doe">
      <label>Phone</label><input type="text" value="9876543210">
      <label>Location</label><input type="text" value="Ahmedabad">
      <label>Skills</label><input type="text" value="Masonry, Carpentry">
      <label>Experience</label><input type="text" value="5 years">
      <label>Availability</label>
      <select><option>Available</option><option>Not Available</option></select>
    `;
  } else {
    form.innerHTML += `
      <label>Name</label><input type="text" value="Jane Smith">
      <label>Phone</label><input type="text" value="9876543210">
      <label>Location</label><input type="text" value="Surat">
      <label>Company</label><input type="text" value="ABC Constructions">
      <label>Job History</label><textarea rows="3">Posted 10 jobs</textarea>
    `;
  }
  document.getElementById("userRole").innerText = userRole;
}

function updateProfile() {
  alert("Profile updated successfully!");
}

function changePassword() {
  alert("Redirecting to change password page...");
}

// Load form on page load
loadProfileForm();