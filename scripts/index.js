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

const CONSTS = {
	DATASET_PATH: "/dataset/handikapp_toalett.geojson",
	SOURCE: "handikapp_toalett_source",
	LAYER: "handikapp_toalett_layer",
	LAYER_COLOR: "#FFC0CB",
};

const lastInnDataFraGeoJSON = async () => {
	try {
		const geojson = await fetch(CONSTS.DATASET_PATH).then((res) => res.json());

		map.addSource(CONSTS.SOURCE, {
			type: "geojson",
			data: geojson,
			cluster: true,
		});

		map.addLayer({
			id: CONSTS.LAYER,
			source: CONSTS.SOURCE,
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
			source: CONSTS.SOURCE,
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
			source: CONSTS.SOURCE,
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

const installereEventer = () => {
	// https://maplibre.org/maplibre-gl-js/docs/examples/display-a-popup-on-click/
	map.on("click", CONSTS.LAYER, (e) => {
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

	map.on("mouseenter", CONSTS.LAYER, () => {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseleave", CONSTS.LAYER, () => {
		map.getCanvas().style.cursor = "";
	});
};

const meny = async () => {
	const $menu = document.getElementById("menu"),
		// $menu$toilets = $menu.querySelector("#toilets ul"),
		$filterHandicapLightButton = document.getElementById(
			"filter-handicap-lighting",
		),
		$filterHandicapRampButton = document.getElementById("filter-handicap-ramp"),
		$resetFiltersButton = document.getElementById("reset-filters");

	/*
        Maplibre sitt filtrering system suger.
        Dersom man ønsker å filtrere data og deretter hente ut de filtrerte dataene på nytt,
        så er det ikke mulig med mindre man lagrer filteret selv og bruker det til å filtrere
        dataene manuelt. :(

        `querySourceFeatures` og `queryRenderedFeatures` er så sporadisk at de henter ikke ut engang
        riktig data. Noen ganger fungerer det, andre ganger ikke.
        
        Clusters gjør det enda verre, fordi disse teller som egne features!
    */

	// const updateToiletList = (filter = null) => {
	// 	const features = map
	// 		.querySourceFeatures(CONSTS.SOURCE, {
	// 			sourceLayer: CONSTS.LAYER,
	// 		})
	// 		.filter((f) => !f.properties.point_count);

	// 	console.log({ filter, features });
	// 	$menu$toilets.innerHTML = "";

	// 	features.forEach((feat, idx) => {
	// 		const li = document.createElement("li");
	// 		li.textContent = `Toalett ${idx + 1}`;
	// 		li.dataset.coordinates = JSON.stringify(feat.geometry.coordinates);
	// 		$menu$toilets.appendChild(li);
	// 	});
	// };

	// $menu$toilets.onclick = (e) => {
	// 	if (e.target && e.target.nodeName === "LI") {
	// 		const coordinates = JSON.parse(e.target.dataset.coordinates);
	// 		map.flyTo({ center: coordinates, zoom: 18 });
	// 	}
	// };

	$filterHandicapLightButton.onclick = () => {
		const filterExpression = ["==", ["get", "belysningInne"], "Ja"];
		map.setFilter(CONSTS.LAYER, filterExpression);
		// updateToiletList(filterExpression);
	};

	$filterHandicapRampButton.onclick = () => {
		const filterExpression = ["==", ["get", "rampe"], "Ja"];
		map.setFilter(CONSTS.LAYER, filterExpression);
		// updateToiletList(filterExpression);
	};

	$resetFiltersButton.onclick = () => {
		map.setFilter(CONSTS.LAYER, null);
		// updateToiletList();
	};
};

map.on("load", async () => {
	await lastInnDataFraGeoJSON();
	installereEventer();
});

map.on("sourcedata", async (e) => {
	if (e.sourceId === CONSTS.SOURCE && e.isSourceLoaded) {
		await meny();
	}
});
