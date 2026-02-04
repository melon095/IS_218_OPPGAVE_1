var map = L.map('map').setView(
    [58.203, 8.004],
    13
);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
// Klynge for markører
var markerCluster = L.markerClusterGroup();

// Hente datasett fra geojson
fetch('Dataset/kulturminner_bygninger.geojson')
    .then(response => response.json())
    .then(data => {
        const kulturminnerLayer = L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                const i = feature.properties;
                if (i. navn === null) {
                    i.navn = "Bygg uten navn";
                }
                if (i.kulturminneKategori === null) {
                    i.kulturminneKategori = "Ukjent kategori";
                }
                if (i.kulturminneDateringEksakt === null) {
                    i.LkulturminneDateringEksakt = "Ukjent byggeår";
                }
                if (i.informasjon === null) {
                    i.informasjon = "Ingen informasjon er tilgjengelig, beklager for ulempen as...";
                }
                const infomatic =
                    `<strong>${i.navn}</strong><br/>
                    Kategori: ${i.kulturminneKategori}</br>
                    Byggeår: ${i.kulturminneDateringEksakt}</br>
                    <strong>Informasjon:</strong></br>
                    ${i.informasjon}`;
                const marker = L.marker(latlng);
                marker.bindPopup(infomatic);
                return marker;
            }
        });

        markerCluster.addLayer(kulturminnerLayer);
        map.addLayer(markerCluster);
    });

// Skru av og på datasett
const toggle = document.getElementById('toggleClusters');
toggle.addEventListener('change', function() {
    if (this.checked) {
        map.addLayer(markerCluster);
    } else {
        map.removeLayer(markerCluster);
    }
});
document.addEventListener("keydown", e => {
    if (e.key === "k") toggle.click();
});
const audio = document.getElementById('background-audio');
audio.play();
// Filtrere basert på avstand UiA
const centerPoint = L.latLng(58.16346315241287, 8.003540956885693);
let allFeatures