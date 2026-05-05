import {
	BRANNSTASJON,
	beregnBoks,
	brannstasjonStasjonstypeFilter,
	byggFilter,
	fylkeFilter,
	hentFylker,
	installBrannstasjonEventer,
	installTilfluktsromEventer,
	lastInnBrannstasjoner,
	lastInnTilfluktsrom,
	map,
	TILFLUKTSROM,
	tilfluktsromKapasitetsFilter,
} from "../felles-skripter/index.js";

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

	const filter = byggFilter(parts);

	map.setFilter(BRANNSTASJON.LAYER, filter);
};

const oppdaterTilfluktsromFilter = () => {
	const parts = [
		fylkeFilter(filterState.fylkeGeometri),
		tilfluktsromKapasitetsFilter(filterState.tilfluktsromMinPlasser),
	].filter(Boolean);

	const filter = byggFilter(parts);

	map.setFilter(TILFLUKTSROM.LAYER, filter);
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
			setPressedState($toggleSoundBtn, true);
			$toggleSoundBtn.textContent = "Skru av lyd (M)";
		} else {
			audio.pause();
			setPressedState($toggleSoundBtn, false);
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
