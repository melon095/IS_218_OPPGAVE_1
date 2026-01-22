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
	friluftfiske = {
		source: "friluftfiskeplassbrygge",
		layer: "friluftfiskeplassbrygge",
		farge: "#1f78b4",
	},
	friluftbålplass = {
		source: "friluftsbålplasser",
		layer: "friluftsbålplasser",
		farge: "#33a02c",
	};

const $menu = document.getElementById("menu"),
	$menu$layers = $menu.querySelector("#layers"),
	$menu$filtering = $menu.querySelector("#filtering");

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

		map.addSource(friluftfiske.source, {
			type: "geojson",
			data: {
				type: "FeatureCollection",
				features,
			},
		});

		map.addLayer({
			id: friluftfiske.layer,
			source: friluftfiske.source,
			type: "circle",
			paint: {
				"circle-radius": 6,
				"circle-color": friluftfiske.farge,
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
		const geojson = await fetch("/data/friluftsbålplasser.geojson").then(
			(res) => res.json(),
		);

		map.addSource(friluftbålplass.source, {
			type: "geojson",
			data: geojson,
		});

		map.addLayer({
			id: friluftbålplass.layer,
			source: friluftbålplass.source,
			type: "circle",
			paint: {
				"circle-radius": 6,
				"circle-color": friluftbålplass.farge,
				"circle-stroke-width": 2,
				"circle-stroke-color": "#ffffff",
			},
		});
	} catch (error) {
		console.error("Feil under lasting av data fra GeoJSON:", error);
	}
};

const installereEventer = () => {
	// https://maplibre.org/maplibre-gl-js/docs/examples/display-a-popup-on-click/
	map.on("click", friluftfiske.layer, (e) => {
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

	map.on("mouseenter", friluftfiske.layer, () => {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseleave", friluftfiske.layer, () => {
		map.getCanvas().style.cursor = "";
	});

	map.on("click", friluftbålplass.layer, (e) => {
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

	map.on("mouseenter", friluftbålplass.layer, () => {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseleave", friluftbålplass.layer, () => {
		map.getCanvas().style.cursor = "";
	});
};

const meny = () => {
	const lagMenyElement = (id, navn, farge, checked = true) => {
		const container = document.createElement("div");
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.id = id;
		checkbox.checked = checked;

		const label = document.createElement("label");
		label.htmlFor = id;
		label.style.color = farge;
		label.textContent = navn;

		checkbox.addEventListener("change", (e) => {
			map.setLayoutProperty(
				id,
				"visibility",
				e.target.checked ? "visible" : "none",
			);
		});

		container.appendChild(checkbox);
		container.appendChild(label);
		return container;
	};

	$menu$layers.appendChild(
		lagMenyElement(
			friluftfiske.layer,
			"Friluftfiskeplassbrygge",
			friluftfiske.farge,
			true,
		),
	);

	$menu$layers.appendChild(
		lagMenyElement(
			friluftbålplass.layer,
			"Friluftsbålplasser",
			friluftbålplass.farge,
			true,
		),
	);

	const $distanceInput = document.getElementById("distance-input"),
		$distanceSubmit = document.getElementById("distance-submit"),
		$distanceReset = document.getElementById("distance-reset"),
		$distanceStats = document.querySelector("#distance-stats #distance-value"),
		$distanceBålCount = document.querySelector("#distance-stats #bål-count"),
		$distanceFilteredBålCount = document.querySelector(
			"#distance-stats #filtered-bål-count",
		);

	const initialDistance = parseFloat($distanceInput.value);
	if (initialDistance && initialDistance > 0) {
		$distanceStats.textContent = initialDistance.toFixed(2);
	}

	$distanceInput.addEventListener("input", () => {
		const distance = parseFloat($distanceInput.value);
		if (distance && distance > 0) {
			$distanceStats.textContent = distance.toFixed(2);
		}
	});

	$distanceSubmit.addEventListener("click", () => {
		const distance = parseFloat($distanceInput.value);
		if (!distance || distance <= 0) {
			alert("Vennligst oppgi en gyldig avstand");
			return;
		}

		const fiskeData = map.getSource(friluftfiske.source)._data.geojson.features;
		const bålData = map.getSource(friluftbålplass.source)._data.geojson
			.features;

		const buffers = fiskeData.map((feature) =>
			turf.buffer(feature, distance, { units: "meters" }),
		);

		const filteredBål = bålData.filter((bålFeature) => {
			return buffers.some((buffer) => {
				const point = turf.point(bålFeature.geometry.coordinates);
				return turf.booleanPointInPolygon(point, buffer);
			});
		});

		const filteredGeoJSON = {
			type: "FeatureCollection",
			features: filteredBål,
		};

		map.getSource(friluftbålplass.source).setData(filteredGeoJSON);

		$distanceBålCount.textContent = bålData.length;
		$distanceFilteredBålCount.textContent = filteredBål.length;
	});

	$distanceReset.addEventListener("click", async () => {
		const geojson = await fetch("/data/friluftsbålplasser.geojson").then(
			(res) => res.json(),
		);
		map.getSource(friluftbålplass.source).setData(geojson);
		$distanceInput.value = "";
	});
};

map.on("load", async () => {
	await lastInnDataFraSupabase();
	await lastInnDataFraGeoJSON();
	installereEventer();
	meny();
});
