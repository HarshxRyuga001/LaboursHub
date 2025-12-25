// profile.js
document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAuth();
  if (!user) return;
  const formEl = document.getElementById("profileForm");
  formEl.innerHTML = "<p>Loading profile…</p>";
  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRole");
  const avatarImg = document.querySelector(".profile-header img");
  const updateBtn = document.querySelector("#updateProfileBtn"); // ensure button id exists
  const changePwdBtn = document.querySelector("#changePasswordBtn");

  let currentRole = null;

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (!res.ok) {
        window.location.href = "login.html";
        return;
      }
      const data = await res.json();
      if (!data || !data.user) {
        window.location.href = "login.html";
        return;
      }
      populateProfile(data.role, data.user);
    } catch (err) {
      console.error(err);
      alert("Failed to load profile");
    }
  }

  function populateProfile(role, user) {
    currentRole = role;
    userNameEl.innerText = user.name || "Unnamed";
    userRoleEl.innerText = role;
    avatarImg.src = user.image ? "/" + user.image : "assets/default-avatar.png";

    // Build the form HTML (keep ids for easy access)
    if (role === "labour") {
      formEl.innerHTML = `
    <label>Name</label>
    <input id="name" name="name" value="${escapeHtml(user.name || "")}" />

    <label>Phone</label>
    <input id="phone" name="phone" value="${escapeHtml(user.phone || "")}" />

    <label>City</label>
    <input id="city" name="city" value="${escapeHtml(user.city || "")}" />

    <label>Skills (comma separated)</label>
    <input id="skills" name="skills" value="${escapeHtml(
      (user.skills || []).join(", ")
    )}" />

    <label>Experience</label>
    <input id="experience" name="experience" value="${escapeHtml(
      user.experience || ""
    )}" />

    <label>Availability</label>
    <select id="availability" name="availability">
      <option value="available" ${
        user.availability === "available" ? "selected" : ""
      }>
        Available
      </option>
      <option value="not-available" ${
        user.availability === "not-available" ? "selected" : ""
      }>
        Not Available
      </option>
    </select>

    <label>Profile Image</label>
    <input id="image" name="image" type="file" accept="image/*" />
  `;

      document
        .getElementById("availability")
        .addEventListener("change", onAvailabilityChange);
    } else {
      formEl.innerHTML = `
    <label>Name</label>
    <input id="name" name="name" value="${escapeHtml(user.name || "")}" />

    <label>Phone</label>
    <input id="phone" name="phone" value="${escapeHtml(user.phone || "")}" />

    <label>City</label>
    <input id="city" name="city" value="${escapeHtml(user.city || "")}" />

    <label>Profile Image</label>
    <input id="image" name="image" type="file" accept="image/*" />
  `;
    }
  }

  // Escape helper to avoid injecting quotes
  function escapeHtml(s = "") {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Update profile submission
  async function submitProfile(e) {
    e && e.preventDefault();

    // Build formData (to support file upload)
    const fd = new FormData();

    // Collect fields by ids
    const name = document.getElementById("name")?.value || "";
    if (!name.trim()) {
      alert("Name cannot be empty");
      return;
    }
    const phone = document.getElementById("phone")?.value || "";
    const city = document.getElementById("city")?.value || "";
    fd.append("name", name);
    fd.append("phone", phone);
    fd.append("city", city);

    // Role-specific
    if (currentRole === "labour") {
      const skills = document.getElementById("skills")?.value || "";
      const experience = document.getElementById("experience")?.value || "";
      const availability = document.getElementById("availability")?.value || "";
      fd.append("skills", skills);
      fd.append("experience", experience);
      fd.append("availability", availability);
    } else {
    }

    // Image file (if selected)
    const fileInput = document.getElementById("image");
    if (fileInput && fileInput.files && fileInput.files[0]) {
      fd.append("image", fileInput.files[0]);
    }
    
    updateBtn.disabled = true;
    updateBtn.innerText = "Saving...";
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        body: fd,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Nothing to update");
        return;
      }

      // Success case
      populateProfile(data.user.role || currentRole, data.user);
      alert("Profile updated successfully");
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      updateBtn.disabled = false;
      updateBtn.innerText = "Update Profile";
    }
  }

  // Availability change immediate handler (optimistic update)
  async function onAvailabilityChange(e) {
    const newVal = e.target.value;
    // send a small update to server (no file upload)
    try {
      const fd = new FormData();
      fd.append("availability", newVal);
      const res = await fetch("/api/profile", {
        method: "PUT",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Could not update availability");
      } else {
        // update dashboard will reflect via re-fetch or websocket (we will implement sync)
        alert("Availability updated");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  }

  // Hook up form submit & buttons
  formEl.addEventListener("submit", submitProfile);

  // If your HTML has separate buttons (e.g. updateProfileBtn), ensure they call submitProfile
  // Example: (we will assume you added these IDs)
  const localUpdateBtn = document.getElementById("updateProfileBtn");
  if (localUpdateBtn) localUpdateBtn.addEventListener("click", submitProfile);
  if (changePwdBtn)
    changePwdBtn.addEventListener("click", () => {
      window.location.href = "change-password.html";
    });

  // initial fetch
  fetchProfile();
});
