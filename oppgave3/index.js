import {
	BEFOLKNING,
	befolkningMinFilter,
	beregnBoks,
	byggFilter,
	fylkeFilter,
	hentFylker,
	installBefolkningEventer,
	installRadiusSok,
	installTilfluktsromEventer,
	lastInnBefolkning,
	lastInnTilfluktsrom,
	TILFLUKTSROM,
	tilfluktsromKapasitetsFilter,
} from "../felles-skripter/index.js";

const filterState = {
	fylkeNavn: "",
	fylkeGeometri: null,
	tilfluktsromMinPlasser: "",
	befolkningMinPop: "",
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
