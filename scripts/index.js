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
	center: [8.003155, 58.16365],
	zoom: 15,
});
globalThis.map = map;

const CONSTS = {
	ALARM_DATASET_PATH: "dataset/brannalarm_sentral.geojson",
	ALARM_SOURCE: "alarm_source",
	ALARM_LAYER: "alarm_layer",
	CLUSTER_LAYER: "alarm_clusters",
	CLUSTER_COUNT_LAYER: "alarm_cluster_count",
	ALARM_COLOR: "#395248",
};

const lastInnDataFraGeoJSON = async () => {
	try {
		const alarmData = await fetch(CONSTS.ALARM_DATASET_PATH).then((res) =>
			res.json(),
		);
		map.addSource(CONSTS.ALARM_SOURCE, {
			type: "geojson",
			data: alarmData,
			cluster: true,
		});

		map.addLayer({
			id: CONSTS.ALARM_LAYER,
			source: CONSTS.ALARM_SOURCE,
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
			source: CONSTS.ALARM_SOURCE,
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
			source: CONSTS.ALARM_SOURCE,
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

	map.on("click", CONSTS.ALARM_LAYER, (e) => {
		const coordinates = e.features[0].geometry.coordinates.slice();
		const { navn, lokalisering, opphav, datauttaksdato } =
			e.features[0].properties;

		const html = `<strong>Bygningsnavn:</strong> ${navn || "Ukjent"}<br/>
                    <strong>Lokalisering:</strong> ${lokalisering || "Ukjent"}
                    <strong>Opphav:</strong> ${opphav || "Ukjent"}<br/>
                    <strong>Uttaksdato:</strong> ${datauttaksdato || "Ukjent"}`;

		new maplibregl.Popup({ className: "popup" })
			.setLngLat(coordinates)
			.setHTML(html)
			.addTo(map);
	});
	
	map.on("mouseenter", CONSTS.ALARM_LAYER, () => {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseleave", CONSTS.ALARM_LAYER, () => {
		map.getCanvas().style.cursor = "";
	});
};

const meny = async () => {
	const audio = document.getElementById("bird-sounds");

	const 
		$toggleAlarmButton = document.getElementById("toggle-alarm"),
		$toggleSoundButton = document.getElementById("toggle-sound");

		const onToggleAlarm = () => {
			const visibility = map.getLayoutProperty(CONSTS.ALARM_LAYER, "visibility");

			map.setLayoutProperty(
				CONSTS.ALARM_LAYER,
				"visibility",
				visibility === "visible" ? "none" : "visible"
			);

			map.setLayoutProperty(
				CONSTS.CLUSTER_LAYER,
				"visibility",
				visibility === "visible" ? "none" : "visible"
			);

			map.setLayoutProperty(
				CONSTS.CLUSTER_COUNT_LAYER,
				"visibility",
				visibility === "visible" ? "none" : "visible"
			);

			if (visibility === "visible") {
				$toggleAlarmButton.textContent = "Vis Alarm-sentraler (K)";
			} else {
				$toggleAlarmButton.textContent = "Skjul Alarm-sentraler (K)";
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

	$toggleAlarmButton.onclick = onToggleAlarm;
	$toggleSoundButton.onclick = onToggleSound;

	document.onkeydown = (e) => {
		switch (e.key.toLowerCase()) {
			case "k":
				onToggleAlarm();
				break;
			case "m":
				onToggleSound();
				break;
		}
	};
	onToggleAlarm();
};

map.on("load", async () => {
	await lastInnDataFraGeoJSON();
	installereEventer();
});

map.on("load", async () => {
	await lastInnDataFraGeoJSON();
	installereEventer();
	await meny();
});