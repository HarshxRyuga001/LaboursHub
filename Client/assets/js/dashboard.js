/* dashboard.js
   - Render labour cards from data
   - Supports search, skill filter, availability filter, refresh
   - Replace fetchSampleData() with real API call to /api/labours when backend ready
*/

document.addEventListener('DOMContentLoaded', () => {
  // DOM references
  const cardsContainer = document.getElementById('cardsContainer');
  const searchInput = document.getElementById('searchInput');
  const skillFilter = document.getElementById('skillFilter');
  const availFilter = document.getElementById('availFilter');
  const refreshBtn = document.getElementById('refreshBtn');

  // Data fetch kr rahe hai database mese
  async function fetchFromApi() {
  const res = await fetch("/api/labours", {
    credentials: "include"
  });
  return await res.json();
}


  // Render a single card HTML
  function renderCard(labour) {
    const skillsText = labour.skills.map(s => capitalize(s)).join(", ");
    const availabilityClass = labour.availability === "available" ? "available" : "not-available";
    const ratingStars = renderStars(labour.rating);

    return `
      <article class="card" data-id="${labour.id}" data-skills="${labour.skills.join(",")}" data-availability="${labour.availability}">
        <div class="card-top">
          <img src="/${labour.image}" class="avatar">
          <div class="info">
            <div class="name">${labour.name}</div>
            <div class="skill-list small">${skillsText}</div>
            <div><span class="badge ${availabilityClass}">${labour.availability === 'available' ? 'Available' : 'Not Available'}</span></div>
          </div>
        </div>

        <div class="meta-row">
          <div class="rating">${ratingStars} <span class="small">${labour.rating.toFixed(1)}</span></div>
          <div class="price">${labour.price}</div>
        </div>

        <div class="small">${truncate(labour.bio, 120)}</div>

        <div class="card-actions">
          <button class="btn-outline view-btn" data-id="${labour.id}">View Profile</button>
          <button class="btn-primary hire-btn" data-id="${labour.id}" ${labour.availability==='available' ? '' : 'disabled'}>${labour.availability==='available' ? 'Hire' : 'Unavailable'}</button>
        </div>
      </article>
    `;
  }

  // Helpers
  function truncate(str, n) { return str.length > n ? str.slice(0,n-1) + "…" : str; }
  function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  function renderStars(rating){
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let html = '';
    for(let i=0;i<full;i++) html += '★';
    if(half) html += '☆';
    // keep to 5 stars visually
    const remaining = 5 - (full + (half?1:0));
    for(let i=0;i<remaining;i++) html += '✩';
    return `<span style="color:#f59e0b">${html}</span>`;
  }

  // Render list of labours to DOM
  async function renderList() {
    cardsContainer.innerHTML = `<div class="small">Loading labours…</div>`;
    // Replace the line below with a real fetch to your API: fetch('/api/labours').then(...)
    const data = await fetchFromApi();

    // Apply filters
    const q = searchInput.value.trim().toLowerCase();
    const skill = skillFilter.value;
    const avail = availFilter.value;

    const filtered = data.filter(l => {
      if (skill && !l.skills.includes(skill)) return false;
      if (avail) {
        if (avail === 'available' && l.availability !== 'available') return false;
        if (avail === 'not-available' && l.availability === 'available') return false;
      }
      if (q) {
        const inName = l.name.toLowerCase().includes(q);
        const inSkills = l.skills.join(',').toLowerCase().includes(q);
        return inName || inSkills;
      }
      return true;
    });

    if (filtered.length === 0) {
      cardsContainer.innerHTML = `<div class="small">No labours match your filters.</div>`;
      return;
    }

    cardsContainer.innerHTML = filtered.map(renderCard).join('');

    // Wire buttons (delegation)
    document.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', onView));
    document.querySelectorAll('.hire-btn').forEach(btn => btn.addEventListener('click', onHire));
  }

  // Event handlers
  function onView(e) {
    const id = e.currentTarget.dataset.id;
    openModalWithLabour(id);
  }

  function onHire(e) {
    const id = e.currentTarget.dataset.id;
    // For MVP we simulate: redirect to profile or open hire flow
    alert('Starting hire flow for ' + id + '. (Integrate real logic: send job-request or open booking modal)');
  }

  // Modal display for quick profile
  const modal = document.getElementById('profileModal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');
  modalClose?.addEventListener('click', closeModal);
  modal.addEventListener('click', (ev) => { if(ev.target === modal) closeModal(); });

  async function openModalWithLabour(id) {
    // fetch details (use API in real app)
    const data = await fetchFromApi();
    const L = data.find(x => x.id === id);
    if(!L) return;
    modalBody.innerHTML = `
      <div style="display:flex;gap:12px;align-items:flex-start">
        <img src="/${labour.image}" class="avatar">
        <div>
          <h3 style="margin:0">${L.name}</h3>
          <div class="small">${L.skills.map(s=>capitalize(s)).join(', ')}</div>
          <div style="margin-top:8px"><strong>Price:</strong> ${L.price}</div>
          <div style="margin-top:8px"><strong>Rating:</strong> ${L.rating.toFixed(1)}</div>
          <p style="margin-top:10px">${L.bio}</p>
        </div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="btn-primary" onclick="alert('Proceed to hire ${L.name} (integrate backend)')">Hire</button>
        <button class="btn-outline" onclick="closeModal()">Close</button>
      </div>
    `;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
  }

  function closeModal(){
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
  }

  // Wire UI events
  [searchInput, skillFilter, availFilter].forEach(el => el.addEventListener('input', debounce(renderList, 250)));
  refreshBtn.addEventListener('click', renderList);

  // menu toggle (same as other pages)
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('nav-links').classList.toggle('show');
  });

  // initial render
  renderList();

  // tiny debounce helper
  function debounce(fn,ms=200){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }
});

// Auto refresh dashboard every 10 seconds
setInterval(() => {
  renderList();
}, 10000);
