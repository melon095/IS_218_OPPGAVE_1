export const BEFOLKNING = {
	SOURCE: "befolkning_source",
	LAYER: "befolkning_layer",
	LAYER_OUTLINE: "befolkning_outline_layer",
	DATASET_PATH: "dataset/befolkning_wgs84.geojson",
};

export const lastInnBefolkning = async (map) => {
	try {
		const data = await fetch(BEFOLKNING.DATASET_PATH).then((res) => {
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return res.json();
		});

		map.addSource(BEFOLKNING.SOURCE, {
			type: "geojson",
			data,
		});

		map.addLayer({
			id: BEFOLKNING.LAYER,
			source: BEFOLKNING.SOURCE,
			type: "fill",
			paint: {
				"fill-color": [
					"interpolate",
					["linear"],
					["get", "popTot"],
					0,
					"rgba(255, 255, 255, 0)",
					1,
					"#ffffcc",
					10,
					"#ffeda0",
					25,
					"#fed976",
					50,
					"#feb24c",
					100,
					"#fd8d3c",
					200,
					"#fc4e2a",
					500,
					"#e31a1c",
					1000,
					"#bd0026",
					2000,
					"#800026",
				],
				"fill-opacity": 0.6,
			},
		});

		map.addLayer({
			id: BEFOLKNING.LAYER_OUTLINE,
			source: BEFOLKNING.SOURCE,
			type: "line",
			paint: {
				"line-color": "#666",
				"line-width": 0.5,
				"line-opacity": 0.3,
			},
		});
	} catch (err) {
		console.error("Feil ved innlasting av befolkningsdata:", err);
	}
};

export const installBefolkningEventer = (map) => {
	map.on("click", BEFOLKNING.LAYER, (e) => {
		const { popTot, popAve, popFem, popMal } = e.features[0].properties;
		const coords = e.lngLat;

		const html = `
			<strong>Befolkningsstatistikk (1km²)</strong><br/>
			<strong>Total:</strong> ${popTot ?? 0} personer<br/>
			<strong>Kvinner:</strong> ${popFem ?? 0}<br/>
			<strong>Menn:</strong> ${popMal ?? 0}<br/>
			<strong>Gjennomsnittsalder:</strong> ${popAve ? popAve + " år" : "Ikke oppgitt"}
		`;

		new maplibregl.Popup({ className: "popup" })
			.setLngLat(coords)
			.setHTML(html)
			.addTo(map);
	});

	map.on("mouseenter", BEFOLKNING.LAYER, () => {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseleave", BEFOLKNING.LAYER, () => {
		map.getCanvas().style.cursor = "";
	});
};

export const befolkningMinFilter = (minPop) => {
	if (!minPop) return null;
	return [">=", ["get", "popTot"], Number(minPop)];
};
