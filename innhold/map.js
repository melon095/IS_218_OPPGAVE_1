var map = L.map('map').setView(
    [58.203, 8.004],
    13
);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
var markerCluster = L.markerClusterGroup();
fetch('Dataset/kulturminner_bygninger.geojson')
    .then(response => response.json())
    .then(data => {
        const geoJsonLayer = L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                const marker = L.marker(latlng);
                marker.bindPopup(feature.properties.navn, 'Freda bygning');
                return marker;
            }
        });

        markerCluster.addLayer(geoJsonLayer);
        map.addLayer(markerCluster);
    });
