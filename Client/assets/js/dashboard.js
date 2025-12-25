// ============================
// Customer Dashboard (dashboard.js)
// ============================

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireAuth();
  if (!user) return;

  // 🔌 Socket connection
  const socket = io({
    withCredentials: true,
  });
  socket.emit("register-user", user.id);

  socket.on("job-status-updated", (job) => {
    alert(`Your job was ${job.status}`);
  });

  // DOM
  const cardsContainer = document.getElementById("cardsContainer");
  const searchInput = document.getElementById("searchInput");
  const skillFilter = document.getElementById("skillFilter");
  const availFilter = document.getElementById("availFilter");
  const refreshBtn = document.getElementById("refreshBtn");

  let labours = [];

  // 📡 Fetch labours from backend
  async function fetchLabours() {
    const res = await fetch("/api/labours", { credentials: "include" });
    if (!res.ok) return [];
    return res.json();
  }

  // 🧱 Render UI
  function renderLabours(list) {
    if (!list.length) {
      cardsContainer.innerHTML = `
    <div class="empty-state">
      <h3>No labours available</h3>
      <p>Please try again later or adjust your filters.</p>
    </div>
  `;
      return;
    }

    cardsContainer.innerHTML = list
      .map(
        (l) => `
      <div class="card">
        <div class="card-top">
          <img src="/${l.image}" class="avatar" />
          <div class="info">
            <div class="name">${l.name}</div>
            <div class="skill-list">${(l.skills || []).join(", ")}</div>
            <span class="badge ${
              l.availability === "available" ? "available" : "not-available"
            }">${l.availability}</span>
          </div>
        </div>

        <div class="meta-row">
          <div class="rating">⭐ ${l.rating}</div>
          <div class="price">${l.price}</div>
        </div>

        <p class="small">${l.bio}</p>

        <button 
          class="btn-primary hire-btn" 
          data-id="${l.id}" 
          ${l.availability !== "available" ? "disabled" : ""}
        >
          ${l.availability === "available" ? "Hire" : "Unavailable"}
        </button>
      </div>
    `
      )
      .join("");

    document.querySelectorAll(".hire-btn").forEach((btn) => {
      btn.addEventListener("click", hireLabour);
    });
  }

  // 🔍 Filters
  function applyFilters() {
    const q = searchInput.value.toLowerCase();
    const skill = skillFilter.value;
    const avail = availFilter.value;

    const filtered = labours.filter((l) => {
      if (skill && !l.skills?.includes(skill)) return false;
      if (avail && l.availability !== avail) return false;
      if (
        q &&
        !l.name.toLowerCase().includes(q) &&
        !l.skills.join(",").toLowerCase().includes(q)
      )
        return false;
      return true;
    });

    renderLabours(filtered);
  }

  // 💼 Hire action
  async function hireLabour(e) {
    const labourId = e.target.dataset.id;
    const res = await fetch(`/api/hire/${labourId}`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    alert(data.message);
  }

  // 🔁 Initial load
  async function init() {
    cardsContainer.innerHTML = `
  <div class="loading-state"> 
    <p>Loading available labours…</p>
  </div>
`;
    labours = await fetchLabours();
    renderLabours(labours);
  }

  // Events
  [searchInput, skillFilter, availFilter].forEach((el) =>
    el.addEventListener("input", applyFilters)
  );
  refreshBtn.addEventListener("click", init);

  init();
});
