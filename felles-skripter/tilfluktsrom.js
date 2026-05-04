import * as supabase from "./supabasekobling.js";

export const TILFLUKTSROM = {
	SOURCE: "tilfluktsrom_source",
	LAYER: "tilfluktsrom_layer",
	COLOR: "#3a8fe6",
};

export const lastInnTilfluktsrom = async (map) => {
	const data = await supabase.hentTilfluktsromData().then((data) =>
		supabase.konverterResponseTilGeoJSON(data, (plass) => ({
			type: "Feature",
			geometry: plass.posisjon,
			properties: plass,
		})),
	);

	map.addSource(TILFLUKTSROM.SOURCE, {
		type: "geojson",
		data,
	});

	map.addLayer({
		id: TILFLUKTSROM.LAYER,
		source: TILFLUKTSROM.SOURCE,
		type: "circle",
		paint: {
			"circle-radius": 6,
			"circle-color": TILFLUKTSROM.COLOR,
			"circle-stroke-width": 2,
			"circle-stroke-color": "#ffffff",
		},
	});
};

export const installTilfluktsromEventer = (map) => {
	map.on("click", TILFLUKTSROM.LAYER, (e) => {
		const coords = e.features[0].geometry.coordinates.slice();
		const { romnr, plasser, adresse } = e.features[0].properties;

		const html = `
			<strong>Romnr:</strong> ${romnr ?? "Ukjent"}<br/>
			<strong>Plasser:</strong> ${plasser ?? "Ukjent"}<br/>
			<strong>Adresse:</strong> ${adresse || "Ukjent"}
		`;

		new maplibregl.Popup({ className: "popup" })
			.setLngLat(coords)
			.setHTML(html)
			.addTo(map);
	});

	map.on("mouseenter", TILFLUKTSROM.LAYER, () => {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseleave", TILFLUKTSROM.LAYER, () => {
		map.getCanvas().style.cursor = "";
	});
};

export const tilfluktsromKapasitetsFilter = (minPlasser) => {
	if (!minPlasser) return null;
	return [">=", ["get", "plasser"], Number(minPlasser)];
};
