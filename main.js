// Lag kartet
const map = L.map("map").setView([59.91, 10.75], 6);

// Bakgrunnskart
const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap"
}).addTo(map);
