const BASE_URL = "https://deobegwgsvlzqzpidpqq.supabase.co";
const API_KEY = "sb_publishable__M6fyGnAyEymqPV0JAj9TA_pvdG3Tx8";

export const client = window.supabase.createClient(BASE_URL, API_KEY);

const behaviour = async (func, args = {}) => {
	const { data, error } = await client.rpc(func, args);

	if (error) {
		console.error(error);

		return [];
	}

	return data;
};

export const hentBrannstasjonsData = async () =>
	await behaviour("alle_brannstasjoner");

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
