export const BRANNSTASJON = {
	SOURCE: "brannstasjon_source",
	LAYER: "brannstasjon_layer",
	DATASET_PATH: "dataset/brannstasjoner.geojson",
	COLOR: "#e63c3c",
};

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

export const installBrannstasjonEventer = (map) => {
	map.on("click", BRANNSTASJON.LAYER, (e) => {
		const coords = e.features[0].geometry.coordinates.slice();
		const { brannstasjon, brannvesen, stasjonstype, kasernert } =
			e.features[0].properties;

		let stasjonstypeLabel;
		switch (stasjonstype) {
			case "H":
				stasjonstypeLabel = "Hovedstasjon";
				break;
			case "L":
				stasjonstypeLabel = "Lokal / underordnet stasjon";
				break;
			default:
				stasjonstypeLabel = stasjonstype || "Ukjent";
		}

		let kasernertLabel;
		switch (kasernert) {
			case "DN":
				kasernertLabel = "Døgnkasernert";
				break;
			case "DA":
				kasernertLabel = "Delvis kasernert";
				break;
			case "IK":
				kasernertLabel = "Ikke kasernert";
				break;
			default:
				kasernertLabel = kasernert || "Ukjent";
		}

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

export const brannstasjonStasjonstypeFilter = (type) => {
	if (!type) return null;
	return ["==", ["get", "stasjonstype"], type];
};
