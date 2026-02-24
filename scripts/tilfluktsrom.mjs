const SUPABASE = {
	API_KEY: "sb_publishable__M6fyGnAyEymqPV0JAj9TA_pvdG3Tx8",
	BASE_URL: "https://deobegwgsvlzqzpidpqq.supabase.co/rest/v1/",
	SCHEMA: "public",
	TABLE: "tilfluktsrom",
};

export const TILFLUKTSROM = {
	SOURCE: "tilfluktsrom_source",
	LAYER: "tilfluktsrom_layer",
	COLOR: "#3a8fe6",
};

const hentTilfluktsromData = async () => {
	try {
		const raw = await fetch(`${SUPABASE.BASE_URL}${SUPABASE.TABLE}?select=*`, {
			headers: {
				apiKey: SUPABASE.API_KEY,
				"Accept-Profile": SUPABASE.SCHEMA,
			},
			method: "GET",
		}).then((res) => {
			if (!res.ok) throw new Error(`Supabase svarte med ${res.status}`);
			return res.json();
		});

		const features = raw.map((plass) => {
			const { posisjon, romnr, plasser, adresse } = plass;

			return {
				type: "Feature",
				geometry: { type: "Point", coordinates: posisjon.coordinates },
				properties: { romnr, plasser, adresse },
			};
		});

		return { type: "FeatureCollection", features };
	} catch (err) {
		console.error("Feil ved innlastning av tilfluktsromdata:", err);

		return { type: "FeatureCollection", features: [] };
	}
};

export const lastInnTilfluktsrom = async (map) => {
	const data = await hentTilfluktsromData();

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
