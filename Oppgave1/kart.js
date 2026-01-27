const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {
      kartverket: {
        type: "raster",
        tiles: [
          "https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png",
        ],
        tileSize: 256,
        attribution: "© Kartverket",
      },
    },
    layers: [
      {
        id: "topo",
        type: "raster",
        source: "kartverket",
      },
    ],
  },
  center: [8.003155, 58.163655],
  zoom: 10,
});

map.on("load", () => {

  map.addSource("kirkebygg", {
    type: "geojson",
    data: "/Datasett/kirkebygg.geojson",
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 15,
  });

  map.addSource("brannsmitteområde", {
    type: "geojson",
    data: "/Datasett/brannsmitteområde.geojson",
  });

 
  const resetBtn = document.getElementById("resetView");
  resetBtn.addEventListener("click", () => {
    map.easeTo({
      bearing: 0,
      pitch: 0,
      duration: 600,
    });
  });

  
  map.loadImage("/Oppgave1/assets/Marker.png", (error, image) => {
    if (error) throw error;

    map.addImage("custom-marker", image);

    map.addLayer({
      id: "kirkebygg-layer",
      type: "symbol",
      source: "kirkebygg",
      layout: {
        "icon-image": "custom-marker",
        "icon-size": 0.02,
        "icon-allow-overlap": true,
      },
    });
  });

  map.addLayer({
      id: "brannsmitteområde-layer",
      type: "fill",
      source: "brannsmitteområde",
      paint: {
        "fill-color": "#ff0000",
        "fill-opacity": 1,
      },
    });
});


map.on("click", "kirkebygg-layer", (e) => {
  const feature = e.features[0];
  const props = feature.properties;

  const name = props.bygningsnavn || "Ukjent navn";
  const address = props.adressenavn || "Ukjent adresse";
  const municipality = props.kommune || "Ukjent kommune";

  new maplibregl.Popup()
    .setLngLat(feature.geometry.coordinates)
    .setHTML(
      `<strong>${name}</strong><br/>
       Adresse: ${address}<br/>
       Kommune: ${municipality}`
    )
    .addTo(map);
});


map.on("mouseenter", "kirkebygg-layer", () => {
  map.getCanvas().style.cursor = "help";
});

map.on("mouseleave", "kirkebygg-layer", () => {
  map.getCanvas().style.cursor = "";
});
