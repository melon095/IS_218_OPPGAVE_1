import { hentTilfluktsromRadius } from "./supabasekobling.mjs";

export const installRadiusSok = (map) => {
    let selectMarker = null;

    map.on("click", async (pos) => {
        const proxResultat = document.getElementById("tilflukts-prox-resultat");
        const {lng, lat} = pos.lngLat;

        if (selectMarker) {
            selectMarker.remove();
        }

        const remMarker = document.createElement("div");
        remMarker.style.width = "0px";
        remMarker.style.height = "0px";

        selectMarker = new maplibregl.Marker({ element: remMarker })
            .setLngLat([lng, lat])
            .addTo(map);
        
        proxResultat.innerHTML = `
            <p><strong>Det er ingen tilfluktsrom innen 1 km</strong><br/>
        `;


        const tilfluktsData = await hentTilfluktsromRadius(lng, lat, 1000);
        
        if (!tilfluktsData || tilfluktsData.length === 0) {
            new maplibregl.Popup()
                .setLngLat([lng, lat])
                .setHTML("<strong>Ingen tilfluktsrom innen 1 km</strong>")
                .addTo(map);
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
        new maplibregl.Popup({ maxWidth: "300px"})
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
    });
};