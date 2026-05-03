export const map = new maplibregl.Map({
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
	center: [10.75, 59.9],
	zoom: 6,
});

globalThis.map = map;

export const beregnBoks = (geometry) => {
	const lons = [];
	const lats = [];

	const collect = (coords) => {
		if (typeof coords[0] === "number") {
			lons.push(coords[0]);
			lats.push(coords[1]);
		} else {
			coords.forEach(collect);
		}
	};

	collect(geometry.coordinates);

	return [
		Math.min(...lons),
		Math.min(...lats),
		Math.max(...lons),
		Math.max(...lats),
	];
};

export const fylkeFilter = (geometri) => {
	if (!geometri) return null;

	return ["within", { type: "Feature", geometry: geometri }];
};

const KOMMUNEINFO_BASE = "https://api.kartverket.no/kommuneinfo/v1";

export const hentFylker = async () => {
	try {
		const liste = await fetch(`${KOMMUNEINFO_BASE}/fylker`).then((res) => {
			if (!res.ok) throw new Error(`Fylkeliste: HTTP ${res.status}`);
			return res.json();
		});

		const oppslag = await Promise.all(
			liste.map(async ({ fylkesnavn, fylkesnummer }) => {
				const detaljer = await fetch(
					`${KOMMUNEINFO_BASE}/fylker/${fylkesnummer}?utkoordsys=4326&filtrer=avgrensningsboks`,
				).then((res) => {
					if (!res.ok)
						throw new Error(`Fylke ${fylkesnavn}: HTTP ${res.status}`);
					return res.json();
				});
				return { namn: fylkesnavn, geometri: detaljer.avgrensningsboks };
			}),
		);

		return Object.fromEntries(
			oppslag.map(({ namn, geometri }) => [namn, geometri]),
		);
	} catch (err) {
		console.error("Kunne ikke hente fylkegrenser fra Kartverket:", err);
		return {};
	}
};

export const byggFilter = (parts) => {
	if (parts.length === 0) return null;
	if (parts.length === 1) return parts[0];

	return ["all", ...parts];
};
