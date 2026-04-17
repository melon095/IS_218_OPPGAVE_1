import { hentTilfluktsromRadius } from "./supabasekobling.mjs";

export const installRadiusSok = (map) => {
	const MIN_RADIUS_M = 100;
	const MAX_RADIUS_M = 10000;
	const DEFAULT_RADIUS_M = 1000;

	const radiusInput = document.getElementById("radius-input");

	let selectMarker = null;
	let activePopup = null;

	const formatRadius = (radius) => {
		if (radius >= 1000) {
			const km = radius / 1000;
			const kmTekst = Number.isInteger(km) ? String(km) : km.toFixed(1);
			return `${kmTekst} km`;
		}

		return `${radius} m`;
	};

	const validerRadius = (value) => {
		const parsed = Number(value);

		if (!Number.isFinite(parsed)) {
			return {
				gyldig: false,
				melding: "Radius må være et tall mellom 100 m og 10 km.",
			};
		}

		if (parsed < MIN_RADIUS_M || parsed > MAX_RADIUS_M) {
			return {
				gyldig: false,
				melding: "Radius må være mellom 100 m og 10 km.",
			};
		}

		return { gyldig: true, radius: Math.round(parsed) };
	};

	const clearObjects = () => {
		if (map.getLayer("radius-resultat-layer")) {
			map.removeLayer("radius-resultat-layer");
		}

		if (map.getSource("radius-resultat-source")) {
			map.removeSource("radius-resultat-source");
		}

		if (map.getLayer("radius-circle-fill")) {
			map.removeLayer("radius-circle-fill");
		}

		if (map.getLayer("radius-circle-line")) {
			map.removeLayer("radius-circle-line");
		}

		if (map.getSource("radpos-source")) {
			map.removeSource("radpos-source");
		}

		const proxResultat = document.getElementById("tilflukts-prox-resultat");
		proxResultat.innerHTML = `<p>Trykk på kartet for å finne tilfluktsrom innen ${formatRadius(DEFAULT_RADIUS_M)}</p>`;
	};

	map.on("click", async (pos) => {
		const proxResultat = document.getElementById("tilflukts-prox-resultat");
		const radiusValidering = validerRadius(radiusInput?.value);

		if (!radiusValidering.gyldig) {
			proxResultat.innerHTML = `<p><strong>${radiusValidering.melding}</strong></p>`;
			if (radiusInput) {
				radiusInput.setCustomValidity(radiusValidering.melding);
				radiusInput.reportValidity();
			}
			return;
		}

		radiusInput.setCustomValidity("");
		radiusInput.value = String(radiusValidering.radius);

		const radius = radiusValidering.radius;
		const radiusText = formatRadius(radius);
		const { lng, lat } = pos.lngLat;

		if (activePopup) {
			activePopup.remove();
			activePopup = null;
		}

		clearObjects();

		if (selectMarker) {
			selectMarker.remove();
		}

		const remMarker = document.createElement("div");
		remMarker.style.width = "0px";
		remMarker.style.height = "0px";

		selectMarker = new maplibregl.Marker({ element: remMarker })
			.setLngLat([lng, lat])
			.addTo(map);

		const posRadius = turf.circle([lng, lat], radius, {
			steps: 64,
			units: "metres",
		});

		if (map.getSource("radpos-source")) {
			map.getSource("radpos-source").setData(posRadius);
		} else {
			map.addSource("radpos-source", {
				type: "geojson",
				data: posRadius,
			});

			map.addLayer({
				id: "radius-circle-fill",
				type: "fill",
				source: "radpos-source",
				paint: {
					"fill-color": "#0d5cab",
					"fill-opacity": 0.16,
				},
			});

			map.addLayer({
				id: "radius-circle-line",
				type: "line",
				source: "radpos-source",
				paint: {
					"line-color": "#0a4380",
					"line-width": 2.5,
				},
			});
		}

		proxResultat.innerHTML = `<p><strong>Søker etter tilfluktsrom innen ${radiusText}...</strong></p>`;
		const tilfluktsData = await hentTilfluktsromRadius(lng, lat, radius);

		if (!tilfluktsData || tilfluktsData.length === 0) {
			proxResultat.innerHTML = `
                <strong>Ingen tilfluktsrom innen ${radiusText}</strong>
            `;
			activePopup = new maplibregl.Popup()
				.setLngLat([lng, lat])
				.setHTML(`<strong>Ingen tilfluktsrom innen ${radiusText}</strong>`)
				.addTo(map);

			activePopup.on("close", () => {
				clearObjects();

				if (selectMarker) {
					selectMarker.remove();
					selectMarker = null;
				}

				activePopup = null;
			});
			return;
		}

		const features = tilfluktsData.map((rad) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: rad.posisjon.coordinates,
			},
			properties: {
				romnr: rad.romnr,
				plasser: rad.plasser,
				adresse: rad.adresse,
			},
		}));

		if (map.getSource("radius-resultat-source")) {
			map.getSource("radius-resultat-source").setData({
				type: "FeatureCollection",
				features,
			});
		} else {
			map.addSource("radius-resultat-source", {
				type: "geojson",
				data: {
					type: "FeatureCollection",
					features,
				},
			});

			map.addLayer({
				id: "radius-resultat-layer",
				type: "circle",
				source: "radius-resultat-source",
				paint: {
					"circle-radius": 9,
					"circle-color": "#0d5cab",
					"circle-stroke-width": 2,
					"circle-stroke-color": "#ffffff",
				},
			});
		}

		proxResultat.innerHTML = `
            <p><strong>Det er ${tilfluktsData.length} tilfluktsrom i nærheten</strong></p>
            <ul>
                ${tilfluktsData
									.map(
										(rad) => `
                                <li>
                                    Romnummer: ${rad.romnr},
                                    Plass: ${rad.plasser} mennesker,
                                    Adresse: ${rad.adresse}
                                </li>
                            `,
									)
									.join("")}
            </ul>
        `;

		activePopup = new maplibregl.Popup({ maxWidth: "300px" })
			.setLngLat([lng, lat])
			.setHTML(
				`<div class="scroll-popup">
                <strong>${features.length} tilfluktsrom innen ${radiusText}</strong>
                    <ul>
                        ${tilfluktsData
													.map(
														(rad) => `
                                <li>
                                    Romnummer: ${rad.romnr},
                                    Plass: ${rad.plasser} mennesker,
                                    Adresse: ${rad.adresse}
                                </li>
                            `,
													)
													.join("")}
                    </ul>
                </div>`,
			)
			.addTo(map);

		activePopup.on("close", () => {
			clearObjects();

			if (selectMarker) {
				selectMarker.remove();
				selectMarker = null;
			}
		});
	});

	const radiusValueUpdate = () => {
		if (!validerRadius(radiusInput.value).gyldig) {
			radiusInput.setCustomValidity(
				"Radius må være et tall mellom 100 m og 10 km.",
			);
			radiusInput.reportValidity();
		} else {
			radiusInput.setCustomValidity("");
		}

		document.getElementById("radius-value").textContent = formatRadius(
			radiusInput.value || DEFAULT_RADIUS_M,
		);
	};

	radiusInput.addEventListener("input", radiusValueUpdate);
	radiusInput.addEventListener("change", radiusValueUpdate);
};
