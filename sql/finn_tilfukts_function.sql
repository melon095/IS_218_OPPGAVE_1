CREATE OR REPLACE FUNCTION finn_tilfluktsrom(
  lng double precision,
  lat double precision,
  radius double precision
)
RETURNS SETOF tilfluktsrom
AS $$
  SELECT *
  FROM tilfluktsrom
  WHERE ST_DWithin(
    posisjon::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius
  );
$$ LANGUAGE sql;