/** @type {import("maplibre-gl").Map} */
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
				paint: {},
			},
		],
	},
	center: [8.003155, 58.163655],
	zoom: 15,
});

// https://kartkatalog.geonorge.no/metadata/tilgjengelighet/843ab449-888c-4b08-bd66-d8b3efc0e529

const API_KEY = "sb_publishable_9LEtlqVfUwFwsO9DBAmDGQ_MPxw5P1T",
	BASE_URL = "https://bibmvakzltmfrjjelnyx.supabase.co/rest/v1/",
	SCHEMA = "tilgjengelighet",
	TABLE = "friluftfiskeplassbrygge",
	FRILUFTFISKEPLASSBRYGGE_SOURCE_ID = "friluftfiskeplassbrygge-source",
	FRILUFTFISKEPLASSBRYGGE_LAYER_ID = "friluftfiskeplassbrygge-layer",
	FRILUFTSBÅLPLASSER_SOURCE_ID = "friluftsbålplasser-source",
	FRILUFTSBÅLPLASSER_LAYER_ID = "friluftsbålplasser-layer";

const $menu = document.getElementById("menu");

// https://epsg.io/25833.proj4js
proj4.defs(
	"EPSG:25833",
	"+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
);

const konverterTilWGS84 = (coordinates, sourceCrs) => {
	const targetCrs = "EPSG:4326";

	if (sourceCrs.includes("4326") || sourceCrs.includes("WGS84")) {
		return coordinates;
	}

	let sourceEpsg = sourceCrs;
	const epsgMatch = sourceCrs.match(/EPSG[:\s]*(\d+)/i);
	if (epsgMatch) {
		sourceEpsg = `EPSG:${epsgMatch[1]}`;
	}

	const transformed = proj4(sourceEpsg, targetCrs, coordinates);

	return transformed;
};

const lastInnDataFraSupabase = async () => {
	try {
		const features = [];
		const response = await fetch(`${BASE_URL}${TABLE}?select=*`, {
			headers: {
				apikey: API_KEY,
				"Accept-Profile": SCHEMA,
			},
			method: "GET",
		});

		const data = await response.json();

		data.forEach((plass) => {
			const { geometri, kommentar, forbedringsforslag, bildefil1, bildefil2 } =
				plass;
			const coordinateSystem = geometri.crs.properties.name;
			const coordinates = konverterTilWGS84(
				geometri.coordinates,
				coordinateSystem,
			);

			const geojson = {
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: coordinates,
				},
				properties: {
					kommentar: kommentar,
					forbedringsforslag: forbedringsforslag,
					bildefil1: bildefil1,
					bildefil2: bildefil2,
				},
			};

			features.push(geojson);
		});

		map.addSource(FRILUFTFISKEPLASSBRYGGE_SOURCE_ID, {
			type: "geojson",
			data: {
				type: "FeatureCollection",
				features,
			},
		});

		map.addLayer({
			id: FRILUFTFISKEPLASSBRYGGE_LAYER_ID,
			source: FRILUFTFISKEPLASSBRYGGE_SOURCE_ID,
			type: "circle",
			paint: {
				"circle-radius": 6,
				"circle-color": "#007cbf",
				"circle-stroke-width": 2,
				"circle-stroke-color": "#ffffff",
			},
		});
	} catch (error) {
		console.error("Feil under lasting av data fra Supabase:", error);
	}
};

const lastInnDataFraGeoJSON = async () => {
	try {
		const geojson = await fetch("/friluftsbålplasser.geojson").then((res) =>
			res.json(),
		);

		const source = map.addSource(FRILUFTSBÅLPLASSER_SOURCE_ID, {
			type: "geojson",
			data: geojson,
		});

		map.addLayer({
			id: FRILUFTSBÅLPLASSER_LAYER_ID,
			source: FRILUFTSBÅLPLASSER_SOURCE_ID,
			type: "circle",
			paint: {
				"circle-radius": 6,
				"circle-color": "#ff7f0e",
				"circle-stroke-width": 2,
				"circle-stroke-color": "#ffffff",
			},
		});
	} catch (error) {
		console.error("Feil under lasting av data fra GeoJSON:", error);
	}
};

map.on("load", async () => {
	await lastInnDataFraSupabase();
	await lastInnDataFraGeoJSON();

	// https://maplibre.org/maplibre-gl-js/docs/examples/display-a-popup-on-click/
	map.on("click", FRILUFTFISKEPLASSBRYGGE_LAYER_ID, (e) => {
		const coordinates = e.features[0].geometry.coordinates.slice();
		const { kommentar, forbedringsforslag, bildefil1, bildefil2 } =
			e.features[0].properties;

		let html = `<strong>Kommentar:</strong> ${kommentar || "Ingen kommentar"}<br/>
                    <strong>Forbedringsforslag:</strong> ${forbedringsforslag || "Ingen forslag"}`;

		if (bildefil1) {
			html += `<br/><img src="${bildefil1}" alt="Bilde 1" style="max-width:200px; max-height:200px;"/>`;
		}
		if (bildefil2) {
			html += `<br/><img src="${bildefil2}" alt="Bilde 2" style="max-width:200px; max-height:200px;"/>`;
		}

		new maplibregl.Popup().setLngLat(coordinates).setHTML(html).addTo(map);
	});

	map.on("mouseenter", FRILUFTFISKEPLASSBRYGGE_LAYER_ID, () => {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseleave", FRILUFTFISKEPLASSBRYGGE_LAYER_ID, () => {
		map.getCanvas().style.cursor = "";
	});

	map.on("click", FRILUFTSBÅLPLASSER_LAYER_ID, (e) => {
		const coordinates = e.features[0].geometry.coordinates.slice();
		const { navn, beskrivelse, bildefil1, bildefil2 } =
			e.features[0].properties;
		let html = `<strong>Navn:</strong> ${navn || "Uten navn"}<br/>
                    <strong>Beskrivelse:</strong> ${beskrivelse || "Ingen beskrivelse"}`;

		if (bildefil1) {
			html += `<br/><img src="${bildefil1}" alt="Bilde 1" style="max-width:200px; max-height:200px;"/>`;
		}
		if (bildefil2) {
			html += `<br/><img src="${bildefil2}" alt="Bilde 2" style="max-width:200px; max-height:200px;"/>`;
		}

		new maplibregl.Popup().setLngLat(coordinates).setHTML(html).addTo(map);
	});

	map.on("mouseenter", FRILUFTSBÅLPLASSER_LAYER_ID, () => {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseleave", FRILUFTSBÅLPLASSER_LAYER_ID, () => {
		map.getCanvas().style.cursor = "";
	});
});
