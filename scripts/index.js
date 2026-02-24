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
globalThis.map = map;

const SUPABASE = {
	API_KEY: "sb_publishable__M6fyGnAyEymqPV0JAj9TA_pvdG3Tx8",
	BASE_URL: "https://deobegwgsvlzqzpidpqq.supabase.co/rest/v1/",
	SCHEMA: "public",
	TABLE: "kirker",
};

const CONSTS = {
	TOILET_DATASET_PATH: "dataset/handikapp_toalett.geojson",
	TOILET_SOURCE: "handikapp_toalett_source",
	TOILET_LAYER: "handikapp_toalett_layer",
	TOILET_LAYER_COLOR: "#FFC0CB",
	CHURCH_DATASET_PATH: "dataset/kirker.geojson",
	CHURCH_SOURCE: "church_source",
	CHURCH_LAYER: "church_layer",
	CHURCH_LAYER_COLOR: "#d09206",
};

const FYLKER = [
	"Akershus",
	"Oslo",
	"Vestland",
	"Rogaland",
	"Trøndelag",
	"Innlandet",
	"Agder",
	"Østfold",
	"Møre og Romsdal",
	"Buskerud",
	"Vestfold",
	"Nordland",
	"Telemark",
	"Troms",
	"Finnmark",
];

const lastInnDataFraGeoJSON = async () => {
	try {
		const toiletData = await fetch(CONSTS.TOILET_DATASET_PATH).then((res) =>
			res.json(),
		);

		map.addSource(CONSTS.TOILET_SOURCE, {
			type: "geojson",
			data: toiletData,
			cluster: true,
		});

		map.addLayer({
			id: CONSTS.TOILET_LAYER,
			source: CONSTS.TOILET_SOURCE,
			type: "circle",
			paint: {
				"circle-radius": 6,
				"circle-color": "#FFC0CB",
				"circle-stroke-width": 2,
				"circle-stroke-color": "#ffffff",
			},
		});

		map.addLayer({
			id: "clusters",
			type: "circle",
			source: CONSTS.TOILET_SOURCE,
			filter: ["has", "point_count"],
			paint: {
				"circle-color": [
					"step",
					["get", "point_count"],
					"#007c95", // < 100
					100,
					"#c4c244", // 100-750
					750,
					"#ae4f75", // > 750
				],
				"circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
				"circle-stroke-width": 1,
				"circle-stroke-color": "#fff",
			},
		});

		map.addLayer({
			id: "cluster-count",
			type: "symbol",
			source: CONSTS.TOILET_SOURCE,
			filter: ["has", "point_count"],
			layout: {
				"text-field": ["get", "point_count"],
				"text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
				"text-size": 12,
			},
			paint: {
				"text-color": "#fff",
			},
		});
	} catch (error) {
		console.error("Feil under lasting av data fra GeoJSON:", error);
	}
};

const lastInnDataFraSupabase = async () => {
	const churchData = await fetch(
		`${SUPABASE.BASE_URL}${SUPABASE.TABLE}?select=*`,
		{
			headers: {
				apiKey: SUPABASE.API_KEY,
				"Accept-Profile": SUPABASE.SCHEMA,
			},
			method: "GET",
		},
	)
		.then((res) => res.json())
		.then((raw) => {
			const features = [];

			raw.forEach((plass) => {
				const {
					geometryproperty,
					bygningsnavn,
					adressenavn,
					postnummer,
					poststed,
					kommune,
					fylke,
				} = plass;

				const [x, y] = geometryproperty.coordinates;

				const geojson = {
					type: "Feature",
					geometry: {
						type: "Point",
						coordinates: [x, y],
					},
					properties: {
						bygningsnavn,
						adressenavn,
						postnummer,
						poststed,
						kommune,
						fylke,
					},
				};

				features.push(geojson);
			});

			return features;
		});

	map.addSource(CONSTS.CHURCH_SOURCE, {
		type: "geojson",
		data: {
			type: "FeatureCollection",
			features: churchData,
		},
		cluster: true,
	});

	map.addLayer({
		id: CONSTS.CHURCH_LAYER,
		source: CONSTS.CHURCH_SOURCE,
		type: "circle",
		paint: {
			"circle-radius": 6,
			"circle-color": CONSTS.CHURCH_LAYER_COLOR,
			"circle-stroke-width": 2,
			"circle-stroke-color": "#ffffff",
		},
	});

	map.addLayer({
		id: "church-clusters",
		type: "circle",
		source: CONSTS.CHURCH_SOURCE,
		filter: ["has", "point_count"],
		paint: {
			"circle-color": [
				"step",
				["get", "point_count"],
				"#8B4513", // < 10
				10,
				"#DAA520", // 10-50
				50,
				"#4B0082", // > 50
			],
			"circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 50, 40],
			"circle-stroke-width": 1,
			"circle-stroke-color": "#fff",
		},
	});

	map.addLayer({
		id: "church-cluster-count",
		type: "symbol",
		source: CONSTS.CHURCH_SOURCE,
		filter: ["has", "point_count"],
		layout: {
			"text-field": ["get", "point_count"],
			"text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
			"text-size": 12,
		},
		paint: {
			"text-color": "#fff",
		},
	});
};

const installereEventer = () => {
	// https://maplibre.org/maplibre-gl-js/docs/examples/display-a-popup-on-click/
	map.on("click", CONSTS.TOILET_LAYER, (e) => {
		const coordinates = e.features[0].geometry.coordinates.slice();
		const { kommentar, forbedringsforslag, bildefil1, bildefil2, bildefil3 } =
			e.features[0].properties;

		const images = [bildefil1, bildefil2, bildefil3].filter(Boolean);

		let html = `<strong>Kommentar:</strong> ${kommentar || "Ingen kommentar"}<br/>
                    <strong>Forbedringsforslag:</strong> ${forbedringsforslag || "Ingen forslag"}`;

		images.forEach((bildefil, idx) => {
			html += `<br/><img src="${bildefil}" alt="Bilde ${idx + 1}" style="max-width:200px; max-height:200px;"/>`;
		});

		new maplibregl.Popup({ className: "popup" })
			.setLngLat(coordinates)
			.setHTML(html)
			.addTo(map);
	});

	map.on("mouseenter", CONSTS.TOILET_LAYER, () => {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseleave", CONSTS.TOILET_LAYER, () => {
		map.getCanvas().style.cursor = "";
	});

	map.on("click", CONSTS.CHURCH_LAYER, (e) => {
		const coordinates = e.features[0].geometry.coordinates.slice();
		const { bygningsnavn, adressenavn, postnummer, poststed, kommune, fylke } =
			e.features[0].properties;

		const html = `<strong>Bygningsnavn:</strong> ${bygningsnavn || "Ukjent"}<br/>
                    <strong>Adresse:</strong> ${adressenavn || "Ukjent"}, ${postnummer || "Ukjent"} ${poststed || "Ukjent"}<br/>
                    <strong>Kommune:</strong> ${kommune || "Ukjent"}<br/>
                    <strong>Fylke:</strong> ${fylke || "Ukjent"}`;

		new maplibregl.Popup({ className: "popup" })
			.setLngLat(coordinates)
			.setHTML(html)
			.addTo(map);
	});

	map.on("mouseenter", CONSTS.CHURCH_LAYER, () => {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseleave", CONSTS.CHURCH_LAYER, () => {
		map.getCanvas().style.cursor = "";
	});
};

const meny = async () => {
	const audio = document.getElementById("bird-sounds");

	const $toiletSection = document.getElementById("toilet-section"),
		$filterHandicapLightButton = document.getElementById(
			"filter-handicap-lighting",
		),
		$filterHandicapRampButton = document.getElementById("filter-handicap-ramp"),
		$resetFiltersButton = document.getElementById("reset-filters"),
		$toggleToiletsButton = document.getElementById("toggle-toilets"),
		$toggleChurchesButton = document.getElementById("toggle-churches"),
		$toggleSoundButton = document.getElementById("toggle-sound");

	$filterHandicapLightButton.onclick = () => {
		const filterExpression = ["==", ["get", "belysningInne"], "Ja"];
		map.setFilter(CONSTS.TOILET_LAYER, filterExpression);
	};

	$filterHandicapRampButton.onclick = () => {
		const filterExpression = ["==", ["get", "rampe"], "Ja"];
		map.setFilter(CONSTS.TOILET_LAYER, filterExpression);
	};

	$resetFiltersButton.onclick = () => {
		map.setFilter(CONSTS.TOILET_LAYER, null);
	};

	const onToggleToilets = () => {
		const visibility = map.getLayoutProperty(CONSTS.TOILET_LAYER, "visibility");
		map.setLayoutProperty(
			CONSTS.TOILET_LAYER,
			"visibility",
			visibility === "visible" ? "none" : "visible",
		);

		const clustersVisibility = map.getLayoutProperty("clusters", "visibility");
		map.setLayoutProperty(
			"clusters",
			"visibility",
			clustersVisibility === "visible" ? "none" : "visible",
		);

		if (visibility === "visible") {
			$toggleToiletsButton.textContent = "Vis Toaletter (T)";
			$toiletSection.classList.add("hidden");
		} else {
			$toggleToiletsButton.textContent = "Skjul Toaletter (T)";
			$toiletSection.classList.remove("hidden");
		}
	};

	const onToggleChurches = () => {
		const visibility = map.getLayoutProperty(CONSTS.CHURCH_LAYER, "visibility");
		map.setLayoutProperty(
			CONSTS.CHURCH_LAYER,
			"visibility",
			visibility === "visible" ? "none" : "visible",
		);

		const clustersVisibility = map.getLayoutProperty(
			"church-clusters",
			"visibility",
		);
		map.setLayoutProperty(
			"church-clusters",
			"visibility",
			clustersVisibility === "visible" ? "none" : "visible",
		);

		if (visibility === "visible") {
			$toggleChurchesButton.textContent = "Vis Kirker (K)";
		} else {
			$toggleChurchesButton.textContent = "Skjul Kirker (K)";
		}
	};

	const onToggleSound = () => {
		if (audio.paused) {
			audio.play();
			$toggleSoundButton.textContent = "Skru av lyd (M)";
		} else {
			audio.pause();
			$toggleSoundButton.textContent = "Skru på lyd (M)";
		}
	};

	$toggleToiletsButton.onclick = onToggleToilets;
	$toggleChurchesButton.onclick = onToggleChurches;
	$toggleSoundButton.onclick = onToggleSound;

	document.onkeydown = (e) => {
		switch (e.key.toLowerCase()) {
			case "t":
				onToggleToilets();
				break;
			case "k":
				onToggleChurches();
				break;
			case "m":
				onToggleSound();
				break;
		}
	};

	onToggleToilets();
	onToggleChurches();
};

map.on("load", async () => {
	await Promise.all([lastInnDataFraGeoJSON(), lastInnDataFraSupabase()]);
	installereEventer();
	await meny();
});

let loadedMeny = false;
map.on("sourcedata", async (e) => {
	if (loadedMeny) return;

	if (e.sourceId === CONSTS.TOILET_SOURCE && e.isSourceLoaded) {
		loadedMeny = true;
		// await meny();
	}
});
