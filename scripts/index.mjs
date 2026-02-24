import {
	BRANNSTASJON,
	brannstasjonStasjonstypeFilter,
	installBrannstasjonEventer,
	lastInnBrannstasjoner,
} from "./brannstasjon.mjs";

import {
	installTilfluktsromEventer,
	lastInnTilfluktsrom,
	TILFLUKTSROM,
	tilfluktsromKapasitetsFilter,
} from "./tilfluktsrom.mjs";

// ---------------------------------------------------------------------------
// Kart
// ---------------------------------------------------------------------------

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
	center: [10.75, 59.9],
	zoom: 6,
});

globalThis.map = map;

// ---------------------------------------------------------------------------
// Fylke – romlig filtrering (omtrentlig avgrensningsboks per fylke)
// Format: [minLon, minLat, maxLon, maxLat]
// ---------------------------------------------------------------------------

const FYLKER_BBOX = {
	Oslo: [10.3, 59.8, 11.0, 60.0],
	Akershus: [10.0, 59.3, 11.8, 60.4],
	Østfold: [10.1, 58.7, 12.1, 59.7],
	Buskerud: [8.4, 59.2, 10.6, 60.9],
	Vestfold: [9.4, 58.8, 10.7, 59.65],
	Telemark: [7.4, 58.5, 9.9, 60.1],
	Agder: [6.4, 57.8, 9.5, 59.2],
	Rogaland: [5.0, 57.9, 7.1, 59.8],
	Vestland: [4.4, 59.4, 7.9, 61.6],
	"Møre og Romsdal": [5.5, 61.6, 9.3, 63.1],
	Trøndelag: [9.9, 62.2, 15.6, 65.2],
	Innlandet: [9.8, 60.5, 13.0, 62.9],
	Nordland: [11.8, 64.9, 18.6, 68.4],
	Troms: [14.6, 68.0, 21.5, 70.6],
	Finnmark: [21.0, 69.3, 31.6, 71.3],
};

/**
 * Bygger et MapLibre `within`-filteruttrykk for et rektangulært fylkesomriss.
 * @param {string} fylke
 * @returns {Array|null}
 */
const fylkeBboxFilter = (fylke) => {
	if (!fylke || !FYLKER_BBOX[fylke]) return null;

	const [minLon, minLat, maxLon, maxLat] = FYLKER_BBOX[fylke];

	return [
		"within",
		{
			type: "Feature",
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[minLon, minLat],
						[maxLon, minLat],
						[maxLon, maxLat],
						[minLon, maxLat],
						[minLon, minLat],
					],
				],
			},
		},
	];
};

// ---------------------------------------------------------------------------
// Tilstand for aktive filtre
// ---------------------------------------------------------------------------

const filterState = {
	fylke: "",
	brannstasjonType: "", // "H" | "L" | ""
	tilfluktsromMinPlasser: "", // tall som streng
};

/**
 * Beregner og setter kombinert filter for brannstasjoner.
 */
const oppdaterBrannstasjonFilter = () => {
	const parts = [
		fylkeBboxFilter(filterState.fylke),
		brannstasjonStasjonstypeFilter(filterState.brannstasjonType),
	].filter(Boolean);

	map.setFilter(
		BRANNSTASJON.LAYER,
		parts.length === 0
			? null
			: parts.length === 1
				? parts[0]
				: ["all", ...parts],
	);
};

/**
 * Beregner og setter kombinert filter for tilfluktsrom.
 */
const oppdaterTilfluktsromFilter = () => {
	const parts = [
		fylkeBboxFilter(filterState.fylke),
		tilfluktsromKapasitetsFilter(filterState.tilfluktsromMinPlasser),
	].filter(Boolean);

	map.setFilter(
		TILFLUKTSROM.LAYER,
		parts.length === 0
			? null
			: parts.length === 1
				? parts[0]
				: ["all", ...parts],
	);
};

const oppdaterAlleFiltre = () => {
	oppdaterBrannstasjonFilter();
	oppdaterTilfluktsromFilter();
};

// ---------------------------------------------------------------------------
// Meny
// ---------------------------------------------------------------------------

const meny = () => {
	const audio = document.getElementById("bird-sounds");

	const $toggleBrannBtn = document.getElementById("toggle-brannstasjoner");
	const $toggleTilflBtn = document.getElementById("toggle-tilfluktsrom");
	const $toggleSoundBtn = document.getElementById("toggle-sound");

	const $fylkeSelect = document.getElementById("fylke-filter");
	const $resetFylkeBtn = document.getElementById("reset-fylke");

	const $stasjonstypeSelect = document.getElementById("stasjonstype-filter");
	const $resetBrannBtn = document.getElementById("reset-brann-filter");

	const $minPlasserInput = document.getElementById("min-plasser");
	const $resetTilflBtn = document.getElementById("reset-tifl-filter");

	// --- Fylkedropdown ---
	Object.keys(FYLKER_BBOX).forEach((fylke) => {
		const option = document.createElement("option");
		option.value = fylke;
		option.textContent = fylke;
		$fylkeSelect.appendChild(option);
	});

	$fylkeSelect.onchange = () => {
		filterState.fylke = $fylkeSelect.value;

		if (filterState.fylke) {
			const [minLon, minLat, maxLon, maxLat] = FYLKER_BBOX[filterState.fylke];
			map.fitBounds(
				[
					[minLon, minLat],
					[maxLon, maxLat],
				],
				{ padding: 40 },
			);
		}

		oppdaterAlleFiltre();
	};

	$resetFylkeBtn.onclick = () => {
		filterState.fylke = "";
		$fylkeSelect.value = "";
		oppdaterAlleFiltre();
	};

	// --- Stasjonstype-filter (brannstasjon) ---
	$stasjonstypeSelect.onchange = () => {
		filterState.brannstasjonType = $stasjonstypeSelect.value;
		oppdaterBrannstasjonFilter();
	};

	$resetBrannBtn.onclick = () => {
		filterState.brannstasjonType = "";
		$stasjonstypeSelect.value = "";
		oppdaterBrannstasjonFilter();
	};

	// --- Minimumskapasitet-filter (tilfluktsrom) ---
	$minPlasserInput.oninput = () => {
		filterState.tilfluktsromMinPlasser = $minPlasserInput.value;
		oppdaterTilfluktsromFilter();
	};

	$resetTilflBtn.onclick = () => {
		filterState.tilfluktsromMinPlasser = "";
		$minPlasserInput.value = "";
		oppdaterTilfluktsromFilter();
	};

	// --- Lag-synlighetsknapper ---
	const toggleLayer = (layerId, button, visLabel, skjulLabel) => {
		const vis = map.getLayoutProperty(layerId, "visibility");
		const nyVisibility = vis === "visible" ? "none" : "visible";
		map.setLayoutProperty(layerId, "visibility", nyVisibility);
		button.textContent = nyVisibility === "visible" ? skjulLabel : visLabel;
	};

	$toggleBrannBtn.onclick = () =>
		toggleLayer(
			BRANNSTASJON.LAYER,
			$toggleBrannBtn,
			"Vis Brannstasjoner (B)",
			"Skjul Brannstasjoner (B)",
		);

	$toggleTilflBtn.onclick = () =>
		toggleLayer(
			TILFLUKTSROM.LAYER,
			$toggleTilflBtn,
			"Vis Tilfluktsrom (T)",
			"Skjul Tilfluktsrom (T)",
		);

	// --- Lyd ---
	const onToggleSound = () => {
		if (audio.paused) {
			audio.play();
			$toggleSoundBtn.textContent = "Skru av lyd (M)";
		} else {
			audio.pause();
			$toggleSoundBtn.textContent = "Skru på lyd (M)";
		}
	};
	$toggleSoundBtn.onclick = onToggleSound;

	// --- Tastatursnarveler ---
	document.onkeydown = (e) => {
		switch (e.key.toLowerCase()) {
			case "b":
				$toggleBrannBtn.click();
				break;
			case "t":
				$toggleTilflBtn.click();
				break;
			case "m":
				onToggleSound();
				break;
		}
	};
};

// ---------------------------------------------------------------------------
// Oppstart
// ---------------------------------------------------------------------------

map.on("load", async () => {
	await Promise.all([lastInnBrannstasjoner(map), lastInnTilfluktsrom(map)]);

	installBrannstasjonEventer(map);
	installTilfluktsromEventer(map);

	meny();
});
