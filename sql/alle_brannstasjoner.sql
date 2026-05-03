CREATE OR REPLACE FUNCTION alle_brannstasjoner()
RETURNS SETOF brannstasjoner
AS $$
BEGIN
    RETURN QUERY
        SELECT *
        FROM brannstasjoner;
END
$$ LANGUAGE plpgsql;
