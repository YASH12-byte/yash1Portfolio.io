const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const btn = document.getElementById('capture-btn');
const downloadBtn = document.getElementById('download-btn');
const gallery = document.getElementById('gallery');
const toggleBtn = document.getElementById('toggle-btn');
const locationBox = document.getElementById('location');
const bgSelect = document.getElementById('bg-select');
const cameraContainer = document.querySelector('.camera-container');
const bgUpload = document.getElementById('bg-upload');
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const context = canvas.getContext('2d');

let bgImg = null;
let customBgUrl = '';
let lastLocation = { lat: null, lng: null, text: '' };
let currentStream = null;
let usingFrontCamera = true;

// Filter dropdown
const filterSelect = document.createElement('select');
filterSelect.id = 'filter-select';
['none', 'grayscale(100%)', 'sepia(100%)', 'contrast(200%)', 'blur(3px)', 'brightness(150%)'].forEach(f => {
  const opt = document.createElement('option');
  opt.value = f;
  opt.textContent = f.split('(')[0];
  filterSelect.appendChild(opt);
});
cameraContainer.appendChild(filterSelect);

// Sticker Button
const stickerBtn = document.createElement('button');
stickerBtn.textContent = '🎉 Add Sticker';
stickerBtn.style.marginTop = '10px';
stickerBtn.onclick = () => {
  const img = document.createElement('img');
  img.src = 'https://em-content.zobj.net/thumbs/120/apple/354/smiling-face-with-sunglasses_1f60e.png';
  img.className = 'gallery-img';
  img.style.position = 'absolute';
  img.style.top = '50px';
  img.style.left = '50px';
  img.style.width = '60px';
  img.style.cursor = 'move';
  cameraContainer.appendChild(img);
  img.onmousedown = function(e) {
    const offsetX = e.clientX - img.offsetLeft;
    const offsetY = e.clientY - img.offsetTop;
    function onMouseMove(ev) {
      img.style.left = (ev.clientX - offsetX) + 'px';
      img.style.top = (ev.clientY - offsetY) + 'px';
    }
    document.addEventListener('mousemove', onMouseMove);
    document.onmouseup = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.onmouseup = null;
    };
  };
};
cameraContainer.appendChild(stickerBtn);

// Background images
const bgImages = {
  default: '',
  nature: 'images/nature1.jpg',
  city: 'images/city1.jpg',
  mountains: 'images/nature2.jpg'
};

function updateBackground() {
  const val = bgSelect.value;
  if (!bgImg) {
    bgImg = document.createElement('img');
    bgImg.className = 'camera-bg';
    cameraContainer.insertBefore(bgImg, video);
  }
  if (val === 'custom' && customBgUrl) {
    bgImg.src = customBgUrl;
    bgImg.style.display = 'block';
  } else if (bgImages[val]) {
    bgImg.src = bgImages[val];
    bgImg.style.display = 'block';
  } else {
    bgImg.style.display = 'none';
  }
}
bgSelect.addEventListener('change', updateBackground);
window.addEventListener('DOMContentLoaded', updateBackground);

// Custom background upload
bgUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(ev) {
      customBgUrl = ev.target.result;
      if (!bgSelect.querySelector('option[value="custom"]')) {
        const opt = document.createElement('option');
        opt.value = 'custom';
        opt.textContent = 'Custom';
        bgSelect.appendChild(opt);
      }
      bgSelect.value = 'custom';
      updateBackground();
    };
    reader.readAsDataURL(file);
  }
});

async function startCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: {
      facingMode: usingFrontCamera ? 'user' : 'environment',
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    }
  };

  try {
    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentStream;
  } catch (err) {
    alert("Camera access denied or unavailable.");
    console.error(err);
  }
}

btn.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  context.filter = filterSelect.value || 'none';
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  context.filter = 'none';

  if (bgImg && bgImg.style.display !== 'none') {
    context.globalAlpha = 0.5;
    context.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    context.globalAlpha = 1.0;
  }

  if (lastLocation.text) {
    context.font = '24px sans-serif';
    context.fillStyle = 'rgba(0,0,0,0.7)';
    context.fillRect(10, canvas.height - 50, 400, 40);
    context.fillStyle = '#fff';
    context.fillText(lastLocation.text, 20, canvas.height - 20);
  }

  canvas.style.display = 'block';
  const imageUrl = canvas.toDataURL('image/png');

  const img = document.createElement('img');
  img.src = imageUrl;
  img.className = 'gallery-img';
  gallery.appendChild(img);

  // Save to localStorage
  let galleryData = JSON.parse(localStorage.getItem("galleryImages") || "[]");
  galleryData.push(imageUrl);
  localStorage.setItem("galleryImages", JSON.stringify(galleryData));

  downloadBtn.href = imageUrl;
  downloadBtn.download = 'captured_image.png';
  downloadBtn.style.display = 'block';
});

toggleBtn.addEventListener('click', () => {
  usingFrontCamera = !usingFrontCamera;
  startCamera();
});

gallery.addEventListener('click', (e) => {
  if (e.target.classList.contains('gallery-img')) {
    lightboxImg.src = e.target.src;
    lightboxModal.style.display = 'flex';
  }
});
lightboxModal.addEventListener('click', () => {
  lightboxModal.style.display = 'none';
  lightboxImg.src = '';
});

function loadLeaflet(callback) {
  if (window.L && window.L.map) return callback();
  const leafletCss = document.createElement('link');
  leafletCss.rel = 'stylesheet';
  leafletCss.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
  document.head.appendChild(leafletCss);
  const leafletJs = document.createElement('script');
  leafletJs.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
  leafletJs.onload = callback;
  document.body.appendChild(leafletJs);
}

function showMap(lat, lng) {
  loadLeaflet(() => {
    const mapDiv = document.getElementById('map');
    mapDiv.innerHTML = '';
    const map = L.map('map').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    L.marker([lat, lng]).addTo(map);
  });
}

function fetchLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      const locText = `📍 Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
      locationBox.textContent = locText;
      lastLocation = { lat: latitude, lng: longitude, text: locText };
      showMap(latitude, longitude);
    }, (err) => {
      locationBox.textContent = "📍 Location access denied.";
      lastLocation = { lat: null, lng: null, text: '' };
      document.getElementById('map').innerHTML = '<div style="color:red;text-align:center;">Map unavailable</div>';
      console.error(err);
    });
  } else {
    locationBox.textContent = "📍 Geolocation not supported.";
    lastLocation = { lat: null, lng: null, text: '' };
    document.getElementById('map').innerHTML = '<div style="color:red;text-align:center;">Map unavailable</div>';
  }
}

function updateDateTime() {
  const dtBox = document.getElementById('datetime');
  const now = new Date();
  dtBox.textContent = now.toLocaleString();
}
setInterval(updateDateTime, 1000);
updateDateTime();

// Load saved gallery images
window.addEventListener("DOMContentLoaded", () => {
  const savedImages = JSON.parse(localStorage.getItem("galleryImages") || "[]");
  savedImages.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.className = "gallery-img";
    gallery.appendChild(img);
  });
});

startCamera();
fetchLocation();
