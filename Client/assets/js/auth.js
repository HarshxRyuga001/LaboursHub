// assets/js/auth.js
// GLOBAL AUTH HANDLER (NON-MODULE)

async function requireAuth() {
  try {
    const res = await fetch("/api/me", { credentials: "include" });

    if (!res.ok) {
      window.location.href = "/login.html";
      return null;
    }

    const data = await res.json();
    return data.user;
  } catch (err) {
    console.error("Auth check failed", err);
    window.location.href = "/login.html";
    return null;
  }
}

// Navbar update (runs on every page)
document.addEventListener("DOMContentLoaded", async () => {
  const loginLink = document.getElementById("nav-login");
  const registerLink = document.getElementById("nav-register");
  const profileLink = document.getElementById("nav-profile");
  const logoutLink = document.getElementById("nav-logout");

  // Page may not have navbar
  if (!loginLink || !registerLink || !profileLink || !logoutLink) return;

  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) throw new Error("Not logged in");

    // LOGGED IN
    loginLink.style.display = "none";
    registerLink.style.display = "none";
    profileLink.style.display = "inline-block";
    logoutLink.style.display = "inline-block";
  } catch {
    // LOGGED OUT
    loginLink.style.display = "inline-block";
    registerLink.style.display = "inline-block";
    profileLink.style.display = "none";
    logoutLink.style.display = "none";
  }
});
