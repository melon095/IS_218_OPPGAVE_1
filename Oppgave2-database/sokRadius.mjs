import { hentTilfluktsromRadius } from "./supabasekobling.mjs";

export const installRadiusSok = (map) => {
    let selectMarker = null;
    let activePopup = null;

    const clearObjects = () => {
        if (map.getLayer("radius-resultat-layer")) {
            map.removeLayer("radius-resultat-layer");
        }
        
        if (map.getSource("radius-resultat-source")) {
            map.removeSource("radius-resultat-source");
        }

        if(map.getLayer("radius-circle-fill")) {
            map.removeLayer("radius-circle-fill");
        }

        if(map.getLayer("radius-circle-line")) {
            map.removeLayer("radius-circle-line");
        }

        if(map.getSource("radpos-source")) {
            map.removeSource("radpos-source");
        }

        const proxResultat = document.getElementById("tilflukts-prox-resultat");
        proxResultat.innerHTML = "<p>Trykk på kartet for å finne tilfluktsrom innen 1 km</p>";
    }

    map.on("click", async (pos) => {
        const proxResultat = document.getElementById("tilflukts-prox-resultat");
        const {lng, lat} = pos.lngLat;

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

        const posRadius = turf.circle([lng, lat], 1, {
            steps: 64,
            units: "kilometers",
        });

        if (map.getSource("radpos-source")) {
            map.getSource("radpos-source").setData(posRadius);
        }
        else {
            map.addSource("radpos-source", {
                type: "geojson",
                data: posRadius,
            });

            map.addLayer({
                id: "radius-circle-fill",
                type: "fill",
                source: "radpos-source",
                paint: {
                    "fill-color": "#395248",
                    "fill-opacity": 0.1
                },
            });

            map.addLayer({
                id: "radius-circle-line",
                type: "line",
                source: "radpos-source",
                paint: {
                    "line-color": "#cff0ff",
                    "line-width": 2,
                }
            });
        }

        proxResultat.innerHTML = `
            <p><strong>Det er ingen tilfluktsrom innen 1 km</strong><br/></p>
        `;
        const tilfluktsData = await hentTilfluktsromRadius(lng, lat, 1000);
        
        if (!tilfluktsData || tilfluktsData.length === 0) {
            proxResultat.innerHTML = `
                <strong>Ingen tilfluktsrom innen 1 km</strong>
            `
            activePopup = new maplibregl.Popup()
                .setLngLat([lng, lat])
                .setHTML("<strong>Ingen tilfluktsrom innen 1 km</strong>")
                .addTo(map);
            
            activePopup.on("close", () => {
                clearObjects();

                if(selectMarker) {
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
        }
        else {
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
                    "circle-color": "#ADD8E6",
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "white"
                },
            });
        }

        proxResultat.innerHTML = `
            <p><strong>Det er ${tilfluktsData.length} tilfluktsrom i nærheten</strong></p>
            <ul>
                ${tilfluktsData
                        .map((rad) => `
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

        activePopup = new maplibregl.Popup({ maxWidth: "300px"})
            .setLngLat([lng, lat])
            .setHTML(
                `<div class="scroll-popup">
                <strong>${features.length} tilfluktsrom innen 1 km</strong>
                    <ul>
                        ${tilfluktsData
                            .map((rad) => `
                                <li>
                                    Romnummer: ${rad.romnr},
                                    Plass: ${rad.plasser} mennesker,
                                    Adresse: ${rad.adresse}
                                </li>
                            `,
                        )
                        .join("")}
                    </ul>
                </div>`
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
};