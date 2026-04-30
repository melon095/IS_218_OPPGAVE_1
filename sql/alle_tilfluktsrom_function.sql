CREATE OR REPLACE FUNCTION alle_tilfluktsrom()
RETURNS SETOF tilfluktsrom
AS $$
BEGIN
    RETURN QUERY
        SELECT *
        FROM tilfluktsrom;
END
$$ LANGUAGE plpgsql;
