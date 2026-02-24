export const BRANNSTASJON = {
	SOURCE: "brannstasjon_source",
	LAYER: "brannstasjon_layer",
	DATASET_PATH: "dataset/brannstasjoner.geojson",
	COLOR: "#e63c3c",
};

/**
 * Laster inn data fra GeoJSON og legger til lag på kartet.
 * @param {import("maplibre-gl").Map} map
 */
export const lastInnBrannstasjoner = async (map) => {
	const data = await fetch(BRANNSTASJON.DATASET_PATH).then((res) => res.json());

	map.addSource(BRANNSTASJON.SOURCE, {
		type: "geojson",
		data,
	});

	map.addLayer({
		id: BRANNSTASJON.LAYER,
		source: BRANNSTASJON.SOURCE,
		type: "circle",
		paint: {
			"circle-radius": 7,
			"circle-color": [
				"match",
				["get", "stasjonstype"],
				"H",
				BRANNSTASJON.COLOR,
				"L",
				"#f09a3a",
				BRANNSTASJON.COLOR,
			],
			"circle-stroke-width": 2,
			"circle-stroke-color": "#ffffff",
		},
	});
};

/**
 * Registrerer klikk- og museeventer for brannstasjonslag.
 * @param {import("maplibre-gl").Map} map
 */
export const installBrannstasjonEventer = (map) => {
	map.on("click", BRANNSTASJON.LAYER, (e) => {
		const coords = e.features[0].geometry.coordinates.slice();
		const { brannstasjon, brannvesen, stasjonstype, kasernert } =
			e.features[0].properties;

		const stasjonstypeLabel =
			stasjonstype === "H"
				? "Hovedstasjon"
				: stasjonstype === "L"
					? "Lokal / underordnet stasjon"
					: stasjonstype;

		const kasernertLabel =
			kasernert === "DN"
				? "Døgnkasernert"
				: kasernert === "DA"
					? "Delvis kasernert"
					: kasernert === "IK"
						? "Ikke kasernert"
						: kasernert;

		const html = `
			<strong>Brannstasjon:</strong> ${brannstasjon || "Ukjent"}<br/>
			<strong>Brannvesen:</strong> ${brannvesen || "Ukjent"}<br/>
			<strong>Stasjonstype:</strong> ${stasjonstypeLabel}<br/>
			<strong>Kasernert:</strong> ${kasernertLabel}
		`;

		new maplibregl.Popup({ className: "popup" })
			.setLngLat(coords)
			.setHTML(html)
			.addTo(map);
	});

	map.on("mouseenter", BRANNSTASJON.LAYER, () => {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseleave", BRANNSTASJON.LAYER, () => {
		map.getCanvas().style.cursor = "";
	});
};

/**
 * Filteruttrykk for å vise bare én stasjonstype (H / L), eller null for alle.
 * @param {"H"|"L"|""} type
 * @returns {Array|null}
 */
export const brannstasjonStasjonstypeFilter = (type) => {
	if (!type) return null;
	return ["==", ["get", "stasjonstype"], type];
};
