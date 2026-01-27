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

map.on('load', () => {
    map.addSource('kirkebygg', {
        type: 'geojson',
        data: '/Datasett/kirkebygg.geojson' 
    });

    map.addLayer({
        id: 'kirkebygg-layer',
        type: 'circle',
        source: 'kirkebygg',
        paint: {
            'circle-radius': 5,
            'circle-color': '#ec680a'
        }
    });
});
