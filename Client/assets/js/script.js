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
