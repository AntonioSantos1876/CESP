UPDATE teams
SET
  short_name = values_table.short_name,
  home_colour = values_table.home_colour,
  away_colour = values_table.away_colour,
  description = values_table.description
FROM (
  VALUES
    ('Denbigh High School', 'DHS', '#31c4cb', '#f4f7f8', 'White and aqua kit inspired by the Denbigh jersey.'),
    ('Excelsior High School', 'EHS', '#0e6b40', '#f3bf1d', 'Green and gold kit inspired by the Excelsior jersey.'),
    ('Glenmuir High School', 'GHS', '#cf2027', '#f3f4f6', 'Red and white kit inspired by the Glenmuir jersey.'),
    ('Kingston College', 'KC', '#6b35b8', '#f4f3ff', 'Purple and white placeholder branding until the jersey art is uploaded.'),
    ('Manchester High School', 'MHS', '#2f1a17', '#efc22b', 'Brown and gold kit inspired by the Manchester jersey.'),
    ('Mona High School', 'MON', '#b92a22', '#e8b51f', 'Red and gold kit inspired by the Mona jersey.'),
    ('Munro College', 'MUN', '#1b46c7', '#efc22b', 'Blue and gold kit inspired by the Munro jersey.'),
    ('Vere Technical High School', 'VTHS', '#228454', '#f6f7f7', 'Green and white kit inspired by the Vere Technical jersey.')
) AS values_table(name, short_name, home_colour, away_colour, description)
WHERE LOWER(teams.name) = LOWER(values_table.name);

INSERT INTO teams (name, short_name, home_colour, away_colour, description)
SELECT values_table.name, values_table.short_name, values_table.home_colour, values_table.away_colour, values_table.description
FROM (
  VALUES
    ('Denbigh High School', 'DHS', '#31c4cb', '#f4f7f8', 'White and aqua kit inspired by the Denbigh jersey.'),
    ('Excelsior High School', 'EHS', '#0e6b40', '#f3bf1d', 'Green and gold kit inspired by the Excelsior jersey.'),
    ('Glenmuir High School', 'GHS', '#cf2027', '#f3f4f6', 'Red and white kit inspired by the Glenmuir jersey.'),
    ('Kingston College', 'KC', '#6b35b8', '#f4f3ff', 'Purple and white placeholder branding until the jersey art is uploaded.'),
    ('Manchester High School', 'MHS', '#2f1a17', '#efc22b', 'Brown and gold kit inspired by the Manchester jersey.'),
    ('Mona High School', 'MON', '#b92a22', '#e8b51f', 'Red and gold kit inspired by the Mona jersey.'),
    ('Munro College', 'MUN', '#1b46c7', '#efc22b', 'Blue and gold kit inspired by the Munro jersey.'),
    ('Vere Technical High School', 'VTHS', '#228454', '#f6f7f7', 'Green and white kit inspired by the Vere Technical jersey.')
) AS values_table(name, short_name, home_colour, away_colour, description)
WHERE NOT EXISTS (
  SELECT 1
  FROM teams
  WHERE LOWER(teams.name) = LOWER(values_table.name)
);
