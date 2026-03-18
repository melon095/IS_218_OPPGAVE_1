const suppebaseUrl = "https://deobegwgsvlzqzpidpqq.supabase.co";
const suppebaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlb2JlZ3dnc3ZsenF6cGlkcHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDUzMTYsImV4cCI6MjA4Mzg4MTMxNn0.1m9ZUGROVeLy9vKZdMyY9iUVdHv39H8xtvkqgp3zQKQ";

export const supabase = window.supabase.createClient(suppebaseUrl, suppebaseKey);

export const hentTilfluktsromRadius = async (lng, lat, radius) => {
    const {data, error} = await supabase.rpc(
        "finn_tilfluktsrom",
        {lng, lat, radius}
    );

    if (error) {
        console.error(error);
        return[];
    }

    return data;
};
