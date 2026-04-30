CREATE OR REPLACE FUNCTION alle_befolkningsdata()
RETURNS SETOF befolkning
AS $$
BEGIN
    RETURN QUERY
        SELECT *
        FROM befolkning;
END
$$ LANGUAGE plpgsql;
