import {
	BEFOLKNING,
	befolkningMinFilter,
	installBefolkningEventer,
	lastInnBefolkning,
} from "../felles-skripter/befolkning.mjs";
import {
	installTilfluktsromEventer,
	lastInnTilfluktsrom,
	TILFLUKTSROM,
	tilfluktsromKapasitetsFilter,
} from "../felles-skripter/tilfluktsrom.mjs";
import { installRadiusSok } from "./sokRadius.mjs";

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

const beregnBoks = (geometry) => {
	const lons = [];
	const lats = [];

	const collect = (coords) => {
		if (typeof coords[0] === "number") {
			lons.push(coords[0]);
			lats.push(coords[1]);
		} else {
			coords.forEach(collect);
		}
	};

	collect(geometry.coordinates);

	return [
		Math.min(...lons),
		Math.min(...lats),
		Math.max(...lons),
		Math.max(...lats),
	];
};

const fylkeFilter = (geometri) => {
	if (!geometri) return null;

	return ["within", { type: "Feature", geometry: geometri }];
};

const KOMMUNEINFO_BASE = "https://api.kartverket.no/kommuneinfo/v1";

const hentFylker = async () => {
	try {
		const liste = await fetch(`${KOMMUNEINFO_BASE}/fylker`).then((res) => {
			if (!res.ok) throw new Error(`Fylkeliste: HTTP ${res.status}`);
			return res.json();
		});

		const oppslag = await Promise.all(
			liste.map(async ({ fylkesnavn, fylkesnummer }) => {
				const detaljer = await fetch(
					`${KOMMUNEINFO_BASE}/fylker/${fylkesnummer}?utkoordsys=4326&filtrer=avgrensningsboks`,
				).then((res) => {
					if (!res.ok)
						throw new Error(`Fylke ${fylkesnavn}: HTTP ${res.status}`);
					return res.json();
				});
				return { namn: fylkesnavn, geometri: detaljer.avgrensningsboks };
			}),
		);

		return Object.fromEntries(
			oppslag.map(({ namn, geometri }) => [namn, geometri]),
		);
	} catch (err) {
		console.error("Kunne ikke hente fylkegrenser fra Kartverket:", err);
		return {};
	}
};

const filterState = {
	fylkeNavn: "",
	fylkeGeometri: null,
	tilfluktsromMinPlasser: "",
	befolkningMinPop: "",
};

const byggFilter = (parts) => {
	if (parts.length === 0) return null;
	if (parts.length === 1) return parts[0];

	return ["all", ...parts];
};

const oppdaterTilfluktsromFilter = () => {
	const parts = [
		fylkeFilter(filterState.fylkeGeometri),
		tilfluktsromKapasitetsFilter(filterState.tilfluktsromMinPlasser),
	].filter(Boolean);

	const filter = byggFilter(parts);

	map.setFilter(TILFLUKTSROM.LAYER, filter);
};

const oppdaterBefolkningFilter = () => {
	const filter = byggFilter([
		befolkningMinFilter(filterState.befolkningMinPop),
	]);

	map.setFilter(BEFOLKNING.LAYER, filter);
	map.setFilter(BEFOLKNING.LAYER_OUTLINE, filter);
};

const oppdaterAlleFiltre = () => {
	oppdaterTilfluktsromFilter();
	oppdaterBefolkningFilter();
};

const meny = (fylkeGeometrier) => {
	const audio = document.getElementById("bird-sounds");
	const mapRegion = document.getElementById("map");

	const $toggleTilflBtn = document.getElementById("toggle-tilfluktsrom");
	const $toggleBefolkningBtn = document.getElementById("toggle-befolkning");
	const $toggleSoundBtn = document.getElementById("toggle-sound");

	const $fylkeSelect = document.getElementById("fylke-filter");
	const $resetFylkeBtn = document.getElementById("reset-fylke");

	const $minPlasserInput = document.getElementById("min-plasser");
	const $resetTilflBtn = document.getElementById("reset-tifl-filter");

	const $minBefolkningInput = document.getElementById("min-befolkning");
	const $resetBefolkningBtn = document.getElementById("reset-bef-filter");

	const sorterteNavn = Object.keys(fylkeGeometrier).sort();
	if (sorterteNavn.length === 0) {
		const opt = document.createElement("option");
		opt.disabled = true;
		opt.textContent = "Kunne ikke laste fylker";
		$fylkeSelect.appendChild(opt);
	} else {
		sorterteNavn.forEach((navn) => {
			const option = document.createElement("option");
			option.value = navn;
			option.textContent = navn;
			$fylkeSelect.appendChild(option);
		});
	}

	$fylkeSelect.onchange = () => {
		const valgtNavn = $fylkeSelect.value;
		filterState.fylkeNavn = valgtNavn;
		filterState.fylkeGeometri = valgtNavn
			? (fylkeGeometrier[valgtNavn] ?? null)
			: null;

		if (filterState.fylkeGeometri) {
			const [minLon, minLat, maxLon, maxLat] = beregnBoks(
				filterState.fylkeGeometri,
			);
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
		filterState.fylkeNavn = "";
		filterState.fylkeGeometri = null;
		$fylkeSelect.value = "";
		oppdaterAlleFiltre();
	};

	$minPlasserInput.oninput = () => {
		filterState.tilfluktsromMinPlasser = $minPlasserInput.value;
		oppdaterTilfluktsromFilter();
	};

	$resetTilflBtn.onclick = () => {
		filterState.tilfluktsromMinPlasser = "";
		$minPlasserInput.value = "";
		oppdaterTilfluktsromFilter();
	};

	$minBefolkningInput.oninput = () => {
		filterState.befolkningMinPop = $minBefolkningInput.value;
		oppdaterBefolkningFilter();
	};

	$resetBefolkningBtn.onclick = () => {
		filterState.befolkningMinPop = "";
		$minBefolkningInput.value = "";
		oppdaterBefolkningFilter();
	};

	const setPressedState = (button, isVisible) => {
		button.setAttribute("aria-pressed", String(isVisible));
	};

	const toggleLayer = (layerId, button, visLabel, skjulLabel) => {
		const vis = map.getLayoutProperty(layerId, "visibility");
		const nyVisibility = vis === "visible" ? "none" : "visible";

		map.setLayoutProperty(layerId, "visibility", nyVisibility);
		setPressedState(button, nyVisibility === "visible");
		button.textContent = nyVisibility === "visible" ? skjulLabel : visLabel;
	};

	const toggleBefolkningLayers = () => {
		const vis = map.getLayoutProperty(BEFOLKNING.LAYER, "visibility");
		const nyVisibility = vis === "visible" ? "none" : "visible";

		map.setLayoutProperty(BEFOLKNING.LAYER, "visibility", nyVisibility);
		map.setLayoutProperty(BEFOLKNING.LAYER_OUTLINE, "visibility", nyVisibility);
		setPressedState($toggleBefolkningBtn, nyVisibility === "visible");
		$toggleBefolkningBtn.textContent =
			nyVisibility === "visible"
				? "Skjul Befolkning (P)"
				: "Vis Befolkning (P)";
	};

	$toggleTilflBtn.onclick = () =>
		toggleLayer(
			TILFLUKTSROM.LAYER,
			$toggleTilflBtn,
			"Vis Tilfluktsrom (T)",
			"Skjul Tilfluktsrom (T)",
		);

	$toggleBefolkningBtn.onclick = toggleBefolkningLayers;

	const onToggleSound = () => {
		if (audio.paused) {
			audio.play();
			setPressedState($toggleSoundBtn, true);
			$toggleSoundBtn.textContent = "Skru av lyd (M)";
		} else {
			audio.pause();
			setPressedState($toggleSoundBtn, false);
			$toggleSoundBtn.textContent = "Skru på lyd (M)";
		}
	};
	$toggleSoundBtn.onclick = onToggleSound;

	const erFokusIInput = () => {
		const active = document.activeElement;
		if (!active) return false;

		return (
			active instanceof HTMLInputElement ||
			active instanceof HTMLTextAreaElement ||
			active instanceof HTMLSelectElement ||
			active.isContentEditable
		);
	};

	document.onkeydown = (e) => {
		if (erFokusIInput()) return;

		switch (e.key.toLowerCase()) {
			case "t":
				$toggleTilflBtn.click();
				break;
			case "p":
				toggleBefolkningLayers();
				break;
			case "m":
				onToggleSound();
				break;
		}
	};

	mapRegion.setAttribute("aria-busy", "false");
};

map.on("load", async () => {
	const [fylkeGeometrier] = await Promise.all([
		hentFylker(),
		lastInnBefolkning(map),
		lastInnTilfluktsrom(map),
	]);

	map.moveLayer(BEFOLKNING.LAYER, TILFLUKTSROM.LAYER);
	map.moveLayer(BEFOLKNING.LAYER_OUTLINE, TILFLUKTSROM.LAYER);

	installBefolkningEventer(map);
	installTilfluktsromEventer(map);
	installRadiusSok(map);

	meny(fylkeGeometrier);
});
