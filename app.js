const galleryTitle = "Client Photo Review";

const localPhotos = [
  "DSC04612.JPG",
  "DSC04668.JPG",
  "137528907_10225269734588863_1591402323624805068_n.jpg",
  "490001481_10236910247834419_5907329435133312836_n.jpg",
  "506030003_10237770946311343_7631057345068729416_n.jpg",
  "515899727_10238566800447199_6166528131772100607_n.jpg",
  "518166112_10238662159991128_4767362672662859722_n.jpg",
  "518294377_10238703661348636_6771338636581120392_n.jpg",
  "584630493_10240517800020969_3430015132872891477_n.jpg",
  "584884146_10240517799900966_4943613974280582766_n.jpg",
  "594858768_10240771550444571_576198765235941040_n.jpg",
  "616653947_10241335189815203_5822762176339891164_n.jpg",
  "617889382_10241412125538548_5551915394435813659_n.jpg",
  "632616551_10241753926003346_8611622651686242828_n.jpg",
  "634021563_10241782664561792_1094546941353969982_n.jpg",
  "648351707_10242093677656925_1993475519541832160_n.jpg",
  "661152148_10242454770164012_1868618903042149984_n.jpg",
  "688830693_10242876831795289_7060845205678954958_n.jpg",
  "715izCzxsXL._AC_UF1000,1000_QL80_.jpg",
  "71mPftlv9aL._UF1000,1000_QL80_.jpg",
  "723730959_2818656588502473_8234765178670552278_n.png.jpeg",
  "FullSizeRender.webp",
  "Screenshot 2026-06-29 at 12.45.26 PM.png",
  "Screenshot 2026-06-29 at 12.45.36 PM.png",
  "Screenshot 2026-06-29 at 12.46.01 PM.png",
  "Screenshot 2026-06-29 at 12.47.44 PM.png",
  "Screenshot 2026-06-29 at 12.47.52 PM.png",
  "Screenshot 2026-06-29 at 12.48.09 PM.png",
  "Screenshot 2026-06-29 at 12.49.14 PM.png",
  "Screenshot 2026-06-30 at 4.41.13 PM.png",
  "Screenshot 2026-06-30 at 4.41.40 PM.png"
].map((file, index) => ({
  id: `photo-${String(index + 1).padStart(2, "0")}`,
  title: `Photo ${String(index + 1).padStart(2, "0")}`,
  file,
  displayUrl: `Photos/${file}`,
  previewUrl: `Photos/${file}`,
  downloadUrl: `Photos/${file}`,
  source: "local"
}));

const stateKey = "client-photo-review-state-v1";
const state = loadState();
let photos = localPhotos;
let activeFilter = "all";
let activePhoto = null;

const grid = document.querySelector("#galleryGrid");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const selectedCount = document.querySelector("#selectedCount");
const totalCount = document.querySelector("#totalCount");
const feedStatus = document.querySelector("#feedStatus");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxTitle = document.querySelector("#lightboxTitle");
const lightboxMeta = document.querySelector("#lightboxMeta");
const modalNote = document.querySelector("#modalNote");
const modalDownload = document.querySelector("#modalDownload");
const modalSelectBtn = document.querySelector("#modalSelectBtn");

document.querySelector("#galleryTitle").textContent = galleryTitle;
totalCount.textContent = photos.length;

document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    renderGallery();
  });
});

searchInput.addEventListener("input", renderGallery);
document.querySelector("#downloadSelectedBtn").addEventListener("click", () => downloadPhotos(selectedPhotos()));
document.querySelector("#downloadAllBtn").addEventListener("click", () => downloadPhotos(photos));
document.querySelector("#exportBtn").addEventListener("click", exportReview);
document.querySelector("#clearReviewBtn").addEventListener("click", clearReview);
modalNote.addEventListener("input", () => updatePhoto(activePhoto.id, { note: modalNote.value }));
modalSelectBtn.addEventListener("click", () => toggleSelected(activePhoto.id));

renderGallery();
loadDrivePhotos();

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(stateKey)) || {};
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(stateKey, JSON.stringify(state));
}

function getReview(photoId) {
  return state[photoId] || { selected: false, note: "" };
}

function updatePhoto(photoId, updates) {
  state[photoId] = { ...getReview(photoId), ...updates };
  saveState();
  updateCounts();
  renderGallery();
  if (activePhoto?.id === photoId) {
    updateModalActions(activePhoto);
  }
}

function toggleSelected(photoId) {
  const review = getReview(photoId);
  updatePhoto(photoId, { selected: !review.selected });
}

function selectedPhotos() {
  return photos.filter((photo) => getReview(photo.id).selected);
}

function filteredPhotos() {
  const term = searchInput.value.trim().toLowerCase();
  return photos.filter((photo) => {
    const review = getReview(photo.id);
    const searchable = [photo.title, photo.file, review.note].join(" ").toLowerCase();
    const matchesSearch = !term || searchable.includes(term);
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "selected" && review.selected);

    return matchesSearch && matchesFilter;
  });
}

function renderGallery() {
  const visiblePhotos = filteredPhotos();
  grid.innerHTML = visiblePhotos.map(photoCard).join("");
  emptyState.hidden = visiblePhotos.length > 0;
  updateCounts();

  grid.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => openLightbox(button.dataset.open));
  });
  grid.querySelectorAll("[data-select]").forEach((button) => {
    button.addEventListener("click", () => toggleSelected(button.dataset.select));
  });
}

function photoCard(photo) {
  const review = getReview(photo.id);
  const statusLabel = review.selected ? "Selected" : "Review";
  const cardClasses = ["photo-card", review.selected ? "selected" : ""].join(" ");
  const note = review.note ? escapeHtml(review.note) : "No note yet";
  const imageUrl = encodeURI(photo.displayUrl || photo.previewUrl || photo.downloadUrl);
  const downloadUrl = encodeURI(photo.downloadUrl || photo.previewUrl || photo.displayUrl);

  return `
    <article class="${cardClasses}">
      <button class="preview-btn" type="button" data-open="${photo.id}" aria-label="Open ${photo.title}">
        <figure>
          <img src="${imageUrl}" alt="${photo.title}" loading="lazy">
          <span class="badge">${statusLabel}</span>
        </figure>
      </button>
      <div class="photo-info">
        <h2>${photo.title}</h2>
        <p>${note}</p>
        <div class="card-actions">
          <button class="select-btn" type="button" data-select="${photo.id}">${review.selected ? "Selected" : "Select"}</button>
          <a class="download-link" href="${downloadUrl}" download target="_blank" rel="noopener">Download</a>
        </div>
      </div>
    </article>
  `;
}

function updateCounts() {
  selectedCount.textContent = selectedPhotos().length;
  totalCount.textContent = photos.length;
}

function openLightbox(photoId) {
  activePhoto = photos.find((photo) => photo.id === photoId);
  if (!activePhoto) return;

  const review = getReview(activePhoto.id);
  const previewUrl = encodeURI(activePhoto.previewUrl || activePhoto.displayUrl || activePhoto.downloadUrl);
  const downloadUrl = encodeURI(activePhoto.downloadUrl || activePhoto.previewUrl || activePhoto.displayUrl);
  lightboxImage.src = previewUrl;
  lightboxImage.alt = activePhoto.title;
  lightboxTitle.textContent = activePhoto.title;
  lightboxMeta.textContent = review.selected ? "Selected" : "Ready for review";
  modalNote.value = review.note || "";
  modalDownload.href = downloadUrl;
  modalDownload.download = activePhoto.file;
  updateModalActions(activePhoto);
  lightbox.showModal();
}

function updateModalActions(photo) {
  const review = getReview(photo.id);
  modalSelectBtn.textContent = review.selected ? "Selected" : "Select";
  lightboxMeta.textContent = review.selected ? "Selected" : "Ready for review";
}

function downloadPhotos(photoList) {
  if (!photoList.length) {
    alert("Select at least one photo first.");
    return;
  }

  photoList.forEach((photo, index) => {
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = encodeURI(photo.downloadUrl || photo.previewUrl || photo.displayUrl);
      link.download = photo.file;
      link.target = "_blank";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }, index * 300);
  });
}

function exportReview() {
  const header = ["Photo", "File", "Selected", "Note", "Source"];
  const rows = photos.map((photo) => {
    const review = getReview(photo.id);
    return [photo.title, photo.file, review.selected ? "Yes" : "No", review.note || "", photo.source || ""];
  });
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "client-photo-review.csv";
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

async function loadDrivePhotos() {
  try {
    const response = await fetch("/api/drive-photos");
    if (!response.ok) {
      throw new Error("Drive photos are not configured yet.");
    }

    const data = await response.json();
    if (!Array.isArray(data.photos) || !data.photos.length) {
      throw new Error("No photos were found in the Drive folder.");
    }

    photos = data.photos;
    feedStatus.textContent = `Loaded ${photos.length} photos from Google Drive.`;
    renderGallery();
  } catch (error) {
    feedStatus.textContent = "Using local preview photos until Google Drive is connected in Vercel.";
    renderGallery();
  }
}

function clearReview() {
  const confirmed = confirm("Clear all selections and notes on this device?");
  if (!confirmed) return;

  Object.keys(state).forEach((photoId) => delete state[photoId]);
  saveState();
  activePhoto = null;
  if (lightbox.open) {
    lightbox.close();
  }
  searchInput.value = "";
  activeFilter = "all";
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });
  renderGallery();
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
