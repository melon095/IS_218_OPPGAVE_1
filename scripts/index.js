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

const API_KEY = "sb_publishable_9LEtlqVfUwFwsO9DBAmDGQ_MPxw5P1T";
const BASE_URL = "https://bibmvakzltmfrjjelnyx.supabase.co/rest/v1/";
const SCHEMA = "tilgjengelighet";
const TABLE = "friluftfiskeplassbrygge";

// https://epsg.io/25833.proj4js
proj4.defs(
	"EPSG:25833",
	"+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
);

const convertToWGS84 = (coordinates, sourceCrs) => {
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

map.on("load", async () => {
	const response = await fetch(`${BASE_URL}${TABLE}?select=*`, {
		headers: {
			apikey: API_KEY,
			"Accept-Profile": SCHEMA,
		},
		method: "GET",
	});

	const data = await response.json();

	data.forEach((plass) => {
		const { geometri, kommentar, forbedringsforslag } = plass;
		const coordinateSystem = geometri.crs.properties.name;
		const coordinates = convertToWGS84(geometri.coordinates, coordinateSystem);

		const marker = new maplibregl.Marker()
			.setLngLat([coordinates[0], coordinates[1]])
			.setPopup(
				new maplibregl.Popup({ offset: 25 }) // add popups
					.setHTML(
						`<h3>${plass.navn}</h3>
                        <p>${plass.beskrivelse}</p>
                        <p><strong>Kommentar:</strong> ${kommentar || "Ingen"}</p>
                        <p><strong>Forbedringsforslag:</strong> ${forbedringsforslag || "Ingen"}</p>`,
					),
			);

		marker.addTo(map);
	});
});
