export const SUPABASE = {
	API_KEY: "sb_publishable__M6fyGnAyEymqPV0JAj9TA_pvdG3Tx8",
	BASE_URL: "https://deobegwgsvlzqzpidpqq.supabase.co",
	SCHEMA: "public",
	TABLE: "tilfluktsrom",
};

export const client = window.supabase.createClient(
	SUPABASE.BASE_URL,
	SUPABASE.API_KEY,
);

const behaviour = async (func, args = {}) => {
	const { data, error } = await client.rpc(func, args);

	if (error) {
		console.error(error);
		return [];
	}

	return data;
};

export const hentTilfluktsromRadius = async (lng, lat, radius) =>
	await behaviour("finn_tilfluktsrom", { lng, lat, radius });

export const hentTilfluktsromData = async () =>
	await behaviour("alle_tilfluktsrom");

export const hentBefolkingsData = async () =>
	await behaviour("alle_befolkningsdata");

export const konverterResponseTilGeoJSON = (response = [], filterFn) => ({
	type: "FeatureCollection",
	features: response.map(filterFn),
});
// 	return { type: "FeatureCollection", features };
// response.map((data) => ({
// 	type: feature,
// }));

//     {

// 		const features = raw.map((plass) => {
// 			const { posisjon, romnr, plasser, adresse } = plass;

// 			return {
// 				type: "Feature",
// 				geometry: { type: "Point", coordinates: posisjon.coordinates },
// 				properties: { romnr, plasser, adresse },
// 			};
// 		});
// };
