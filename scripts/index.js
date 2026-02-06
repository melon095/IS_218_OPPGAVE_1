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
	TOILET_DATASET_PATH: "/dataset/handikapp_toalett.geojson",
	TOILET_SOURCE: "handikapp_toalett_source",
	TOILET_LAYER: "handikapp_toalett_layer",
	TOILET_LAYER_COLOR: "#FFC0CB",
    CHURCH_DATASET_PATH: "/dataset/kirker.geojson",
    CHURCH_SOURCE: "church_source",
    CHURCH_LAYER: "church_layer",
    CHURCH_LAYER_COLOR: "#d09206",
};

let toiletData = null,
	currentFilter = null;

const lastInnDataFraGeoJSON = async () => {
	try {
		toiletData = await fetch(CONSTS.TOILET_DATASET_PATH).then((res) => res.json());

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

        const churchData = await fetch(CONSTS.CHURCH_DATASET_PATH).then((res) => res.json());

        map.addSource(CONSTS.CHURCH_SOURCE, {
            type: "geojson",
            data: churchData,
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
                    "#d09206", // < 10
                    10,
                    "#c4c244", // 10-50
                    50,
                    "#ae4f75", // > 50
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

	} catch (error) {
		console.error("Feil under lasting av data fra GeoJSON:", error);
	}
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
	const $menu = document.getElementById("menu"),
        $toiletSection = document.getElementById("toilet-section"),
		$menu$toilets = $menu.querySelector("#toilets ul"),
		$filterHandicapLightButton = document.getElementById(
			"filter-handicap-lighting",
		),
		$filterHandicapRampButton = document.getElementById("filter-handicap-ramp"),
		$resetFiltersButton = document.getElementById("reset-filters"),
        $toggleToiletsButton = document.getElementById("toggle-toilets"),
        $toggleChurchesButton = document.getElementById("toggle-churches");

	const updateToiletList = () => {
		const features = currentFilter
			? toiletData.features.filter(currentFilter)
			: toiletData.features;

		$menu$toilets.innerHTML = "";

		features.forEach((feat, idx) => {
			const li = document.createElement("li");
			li.textContent = `Toalett ${idx + 1}`;
			li.dataset.coordinates = JSON.stringify(feat.geometry.coordinates);
			$menu$toilets.appendChild(li);
		});
	};

	$menu$toilets.onclick = (e) => {
		if (e.target && e.target.nodeName === "LI") {
			const coordinates = JSON.parse(e.target.dataset.coordinates);
			map.flyTo({ center: coordinates, zoom: 18 });
		}
	};

	$filterHandicapLightButton.onclick = () => {
		const filterExpression = ["==", ["get", "belysningInne"], "Ja"];
		currentFilter = (feat) => feat.properties.belysningInne === "Ja";
		map.setFilter(CONSTS.TOILET_LAYER, filterExpression);
		updateToiletList();
	};

	$filterHandicapRampButton.onclick = () => {
		const filterExpression = ["==", ["get", "rampe"], "Ja"];
		currentFilter = (feat) => feat.properties.rampe === "Ja";
		map.setFilter(CONSTS.TOILET_LAYER, filterExpression);
		updateToiletList();
	};

	$resetFiltersButton.onclick = () => {
		currentFilter = null;
		map.setFilter(CONSTS.TOILET_LAYER, null);
		updateToiletList();
	};

    
    const onToggleToilets = () => {
        const visibility = map.getLayoutProperty(CONSTS.TOILET_LAYER, "visibility");
        map.setLayoutProperty(
            CONSTS.TOILET_LAYER,
            "visibility",
            visibility === "visible" ? "none" : "visible"
        );

        const clustersVisibility = map.getLayoutProperty("clusters", "visibility");
        map.setLayoutProperty(
            "clusters",
            "visibility",
            clustersVisibility === "visible" ? "none" : "visible"
        );

        if (visibility === "visible") {
            $toggleToiletsButton.textContent = "Vis Toaletter";
            $toiletSection.classList.add("hidden");
        } else {
            $toggleToiletsButton.textContent = "Skjul Toaletter";
            $toiletSection.classList.remove("hidden");
        }
    }
    
    const onToggleChurches = () => {
        const visibility = map.getLayoutProperty(CONSTS.CHURCH_LAYER, "visibility");
        map.setLayoutProperty(
            CONSTS.CHURCH_LAYER,
            "visibility",
            visibility === "visible" ? "none" : "visible"
        );

        const clustersVisibility = map.getLayoutProperty("church-clusters", "visibility");
        map.setLayoutProperty(
            "church-clusters",
            "visibility",
            clustersVisibility === "visible" ? "none" : "visible"
        );

        if (visibility === "visible") {
            $toggleChurchesButton.textContent = "Vis Kirker";
        } else {
            $toggleChurchesButton.textContent = "Skjul Kirker";
        }
    }

    
    $toggleToiletsButton.onclick = onToggleToilets;
    $toggleChurchesButton.onclick = onToggleChurches;

	updateToiletList();
    onToggleToilets();
    onToggleChurches();
};

map.on("load", async () => {
	await lastInnDataFraGeoJSON();
	installereEventer();
});

let loadedMeny = false;
map.on("sourcedata", async (e) => {
	if (loadedMeny) return;

	if (e.sourceId === CONSTS.TOILET_SOURCE && e.isSourceLoaded) {
		loadedMeny = true;
		await meny();
	}
});

const audio = document.getElementById("bird-sounds");
audio.play();