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
	brannstasjonType: "",
	tilfluktsromMinPlasser: "",
};

const oppdaterBrannstasjonFilter = () => {
	const parts = [
		fylkeFilter(filterState.fylkeGeometri),
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

const oppdaterTilfluktsromFilter = () => {
	const parts = [
		fylkeFilter(filterState.fylkeGeometri),
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

const meny = (fylkeGeometrier) => {
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

	$stasjonstypeSelect.onchange = () => {
		filterState.brannstasjonType = $stasjonstypeSelect.value;
		oppdaterBrannstasjonFilter();
	};

	$resetBrannBtn.onclick = () => {
		filterState.brannstasjonType = "";
		$stasjonstypeSelect.value = "";
		oppdaterBrannstasjonFilter();
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

map.on("load", async () => {
	const [fylkeGeometrier] = await Promise.all([
		hentFylker(),
		lastInnBrannstasjoner(map),
		lastInnTilfluktsrom(map),
	]);

	installBrannstasjonEventer(map);
	installTilfluktsromEventer(map);

	meny(fylkeGeometrier);
});
