const state = {
  items: [],
  imageFiles: new Map(),
  sort: "latest",
  view: "explore",
  liked: new Set(JSON.parse(localStorage.getItem("explore-liked") || "[]"))
};

const $ = (s) => document.querySelector(s);
const gallery = $("#gallery");
const empty = $("#empty");
const count = $("#count");

function normalize(row) {
  const get = (...keys) => {
    for (const k of keys) if (row[k] != null && String(row[k]).trim() !== "") return String(row[k]).trim();
    return "";
  };
  return {
    id: get("id") || crypto.randomUUID(),
    image: get("image", "image_url", "filename", "file", "src"),
    title: get("title", "name") || "Untitled",
    prompt: get("prompt", "description"),
    category: get("category", "type") || "Other",
    tags: get("tags", "tag"),
    author: get("author", "creator") || "Me",
    date: get("date", "created_at") || "",
    likes: Number(get("likes") || 0)
  };
}

function parseCSV(text) {
  // RFC4180-ish parser: handles commas and newlines inside quoted cells.
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (quoted) {
      if (c === '"' && n === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else {
      if (c === '"') quoted = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (c !== "\r") cell += c;
    }
  }
  row.push(cell);
  if (row.some(x => x.trim() !== "")) rows.push(row);

  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).filter(r => r.some(x => x.trim() !== "")).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i] ?? "");
    return normalize(obj);
  });
}

function resolveImage(item) {
  if (!item.image) return "";
  if (/^(https?:|data:|blob:)/i.test(item.image)) return item.image;

  const clean = item.image.replace(/^["']|["']$/g, "").replace(/^\.?\//, "");
  const file = state.imageFiles.get(clean) || state.imageFiles.get(clean.split("/").pop());
  if (file) return URL.createObjectURL(file);

  // For GitHub Pages / normal hosting: CSV image value can be images/photo.jpg
  return clean;
}

function persistLikes() {
  localStorage.setItem("explore-liked", JSON.stringify([...state.liked]));
}

function render() {
  const q = $("#searchInput").value.trim().toLowerCase();
  const category = $("#categoryFilter").value;

  let items = state.items.filter(item => {
    const hay = [item.title, item.prompt, item.category, item.tags, item.author].join(" ").toLowerCase();
    const matchesQ = !q || hay.includes(q);
    const matchesCat = !category || item.category === category;
    const matchesView = state.view === "explore" || state.liked.has(item.id);
    return matchesQ && matchesCat && matchesView;
  });

  if (state.sort === "random") items.sort(() => Math.random() - 0.5);
  else if (state.sort === "likes") items.sort((a,b) => b.likes - a.likes);
  else items.reverse();

  count.textContent = `${items.length} images`;
  gallery.innerHTML = "";
  empty.style.display = items.length ? "none" : "block";

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = item.id;
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = resolveImage(item);
    img.alt = item.title;
    img.onerror = () => {
      img.style.minHeight = "180px";
      img.style.background = "linear-gradient(135deg,#ddd,#f4f4f4)";
    };

    const overlay = document.createElement("div");
    overlay.className = "card-overlay";
    overlay.innerHTML = `<div class="card-title"></div><div class="card-meta"></div>`;
    overlay.querySelector(".card-title").textContent = item.title;
    overlay.querySelector(".card-meta").textContent = item.category;

    const like = document.createElement("button");
    like.className = "card-like";
    like.textContent = state.liked.has(item.id) ? "♥" : "♡";
    like.title = "Like";
    like.onclick = (e) => {
      e.stopPropagation();
      toggleLike(item.id);
    };

    card.append(img, overlay, like);
    card.onclick = () => openModal(item);
    gallery.appendChild(card);
  }
}

function populateCategories() {
  const current = $("#categoryFilter").value;
  const cats = [...new Set(state.items.map(x => x.category).filter(Boolean))].sort();
  $("#categoryFilter").innerHTML = '<option value="">All categories</option>' +
    cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  $("#categoryFilter").value = cats.includes(current) ? current : "";
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function toggleLike(id) {
  state.liked.has(id) ? state.liked.delete(id) : state.liked.add(id);
  persistLikes();
  render();
  if (!$("#modal").classList.contains("hidden")) {
    $("#likeBtn").textContent = state.liked.has(id) ? "♥" : "♡";
  }
}

function openModal(item) {
  $("#modalImage").src = resolveImage(item);
  $("#modalTitle").textContent = item.title;
  $("#modalMeta").textContent = [item.category, item.author, item.date].filter(Boolean).join(" · ");
  $("#modalPrompt").textContent = item.prompt || "프롬프트 정보가 없습니다.";
  $("#modalTags").innerHTML = item.tags
    ? item.tags.split(/[|,]/).map(t => `<span class="tag">${escapeHtml(t.trim())}</span>`).join("")
    : "";
  $("#likeBtn").textContent = state.liked.has(item.id) ? "♥" : "♡";
  $("#likeBtn").onclick = () => toggleLike(item.id);
  $("#modal").classList.remove("hidden");
}

function closeModal() {
  $("#modal").classList.add("hidden");
}

$("#csvInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  state.items = parseCSV(text);
  populateCategories();
  render();
});

$("#imageInput").addEventListener("change", e => {
  for (const file of e.target.files) {
    state.imageFiles.set(file.name, file);
  }
  // Re-render current CSV items after images are selected.
  render();
});

$("#searchInput").addEventListener("input", render);
$("#categoryFilter").addEventListener("change", render);

document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.sort = btn.dataset.sort;
  render();
}));

document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.view = btn.dataset.view;
  render();
}));

$("#modalClose").onclick = closeModal;
$("#modal").addEventListener("click", e => { if (e.target === $("#modal")) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// Demo data is intentionally empty: the page is ready for the user's CSV + images.
