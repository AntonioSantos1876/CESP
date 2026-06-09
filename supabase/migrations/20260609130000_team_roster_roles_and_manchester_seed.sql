ALTER TABLE players
ADD COLUMN IF NOT EXISTS leadership_role TEXT,
ADD COLUMN IF NOT EXISTS is_starter BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'players_leadership_role_check'
  ) THEN
    ALTER TABLE players
    ADD CONSTRAINT players_leadership_role_check
    CHECK (leadership_role IS NULL OR leadership_role IN ('captain', 'vice_captain'));
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION validate_player_roster_metadata()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  captain_count INTEGER;
  vice_captain_count INTEGER;
  starter_count INTEGER;
BEGIN
  IF NEW.is_active = FALSE THEN
    NEW.is_starter := FALSE;
  END IF;

  IF NEW.leadership_role = 'captain' THEN
    SELECT COUNT(*)
    INTO captain_count
    FROM players
    WHERE team_id = NEW.team_id
      AND leadership_role = 'captain'
      AND id IS DISTINCT FROM NEW.id;

    IF captain_count >= 1 THEN
      RAISE EXCEPTION 'Each team can only have one captain';
    END IF;
  END IF;

  IF NEW.leadership_role = 'vice_captain' THEN
    SELECT COUNT(*)
    INTO vice_captain_count
    FROM players
    WHERE team_id = NEW.team_id
      AND leadership_role = 'vice_captain'
      AND id IS DISTINCT FROM NEW.id;

    IF vice_captain_count >= 3 THEN
      RAISE EXCEPTION 'Each team can only have up to three vice captains';
    END IF;
  END IF;

  IF NEW.is_starter THEN
    SELECT COUNT(*)
    INTO starter_count
    FROM players
    WHERE team_id = NEW.team_id
      AND is_starter = TRUE
      AND id IS DISTINCT FROM NEW.id;

    IF starter_count >= 11 THEN
      RAISE EXCEPTION 'Each team can only have up to 11 starters';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS players_validate_roster_metadata ON players;

CREATE TRIGGER players_validate_roster_metadata
  BEFORE INSERT OR UPDATE OF team_id, is_active, is_starter, leadership_role
  ON players
  FOR EACH ROW
  EXECUTE FUNCTION validate_player_roster_metadata();

WITH manchester_team AS (
  SELECT id
  FROM teams
  WHERE LOWER(name) = LOWER('Manchester High School')
  LIMIT 1
)
UPDATE players
SET
  leadership_role = NULL,
  is_starter = FALSE,
  updated_at = NOW()
FROM manchester_team
WHERE players.team_id = manchester_team.id;

WITH manchester_team AS (
  SELECT id
  FROM teams
  WHERE LOWER(name) = LOWER('Manchester High School')
  LIMIT 1
),
roster(full_name, jersey_number, position, leadership_role, is_starter, sort_order) AS (
  VALUES
    ('J. Ward', 51, 'GK', 'vice_captain', TRUE, 1),
    ('K. Elliot', 1, 'GK', NULL, FALSE, 2),
    ('D. Myers', 3, 'CB', NULL, TRUE, 3),
    ('J. Morgan', 4, 'RB / RWB', NULL, TRUE, 4),
    ('J. White', 5, 'CB / CDM', NULL, TRUE, 5),
    ('D. Bartley', 6, 'CB', NULL, TRUE, 6),
    ('J. Gordon', 7, 'LW / LWB / ST', NULL, TRUE, 7),
    ('J. Forbes', 8, 'RWB / CB', 'vice_captain', TRUE, 8),
    ('J. Mckenzie', 9, 'LWB / LW', NULL, TRUE, 9),
    ('S. Reynolds', 10, 'CF / ST', 'captain', TRUE, 10),
    ('B. Brown', 11, 'CM', NULL, TRUE, 11),
    ('D. Reid', 12, 'CDM / CM', NULL, FALSE, 12),
    ('A. Smith', 13, 'ST', NULL, FALSE, 13),
    ('A. Richards', 14, 'CM / CAM', NULL, FALSE, 14),
    ('L. Peachus', 15, 'LB / LWB', NULL, TRUE, 15),
    ('T. Reid', 15, 'LWB / LW', NULL, FALSE, 16),
    ('M. Morrison', 16, 'RB / RWB', NULL, FALSE, 17),
    ('M. Reid', 17, 'CAM / RW', 'vice_captain', FALSE, 18),
    ('J. Gray', 18, 'CM / CAM', NULL, FALSE, 19),
    ('K. Smith', 19, 'CM / CAM', NULL, FALSE, 20),
    ('D. Walker', 20, 'CM / RWB', NULL, FALSE, 21),
    ('N. Young', 21, 'RWB / RW', NULL, FALSE, 22),
    ('M. Smith', 22, 'LW / LWB', NULL, FALSE, 23),
    ('A. Smith', 23, 'CDM / CB', NULL, FALSE, 24),
    ('A. Witter', 2, 'CM', NULL, FALSE, 25)
)
UPDATE players AS existing
SET
  position = roster.position,
  leadership_role = roster.leadership_role,
  is_starter = roster.is_starter,
  is_active = TRUE,
  updated_at = NOW()
FROM manchester_team, roster
WHERE existing.team_id = manchester_team.id
  AND existing.full_name = roster.full_name
  AND COALESCE(existing.jersey_number, -1) = roster.jersey_number;

WITH manchester_team AS (
  SELECT id
  FROM teams
  WHERE LOWER(name) = LOWER('Manchester High School')
  LIMIT 1
),
roster(full_name, jersey_number, position, leadership_role, is_starter, sort_order) AS (
  VALUES
    ('J. Ward', 51, 'GK', 'vice_captain', TRUE, 1),
    ('K. Elliot', 1, 'GK', NULL, FALSE, 2),
    ('D. Myers', 3, 'CB', NULL, TRUE, 3),
    ('J. Morgan', 4, 'RB / RWB', NULL, TRUE, 4),
    ('J. White', 5, 'CB / CDM', NULL, TRUE, 5),
    ('D. Bartley', 6, 'CB', NULL, TRUE, 6),
    ('J. Gordon', 7, 'LW / LWB / ST', NULL, TRUE, 7),
    ('J. Forbes', 8, 'RWB / CB', 'vice_captain', TRUE, 8),
    ('J. Mckenzie', 9, 'LWB / LW', NULL, TRUE, 9),
    ('S. Reynolds', 10, 'CF / ST', 'captain', TRUE, 10),
    ('B. Brown', 11, 'CM', NULL, TRUE, 11),
    ('D. Reid', 12, 'CDM / CM', NULL, FALSE, 12),
    ('A. Smith', 13, 'ST', NULL, FALSE, 13),
    ('A. Richards', 14, 'CM / CAM', NULL, FALSE, 14),
    ('L. Peachus', 15, 'LB / LWB', NULL, TRUE, 15),
    ('T. Reid', 15, 'LWB / LW', NULL, FALSE, 16),
    ('M. Morrison', 16, 'RB / RWB', NULL, FALSE, 17),
    ('M. Reid', 17, 'CAM / RW', 'vice_captain', FALSE, 18),
    ('J. Gray', 18, 'CM / CAM', NULL, FALSE, 19),
    ('K. Smith', 19, 'CM / CAM', NULL, FALSE, 20),
    ('D. Walker', 20, 'CM / RWB', NULL, FALSE, 21),
    ('N. Young', 21, 'RWB / RW', NULL, FALSE, 22),
    ('M. Smith', 22, 'LW / LWB', NULL, FALSE, 23),
    ('A. Smith', 23, 'CDM / CB', NULL, FALSE, 24),
    ('A. Witter', 2, 'CM', NULL, FALSE, 25)
)
INSERT INTO players (team_id, full_name, jersey_number, position, leadership_role, is_starter, is_active)
SELECT
  manchester_team.id,
  roster.full_name,
  roster.jersey_number,
  roster.position,
  roster.leadership_role,
  roster.is_starter,
  TRUE
FROM manchester_team
CROSS JOIN roster
WHERE NOT EXISTS (
  SELECT 1
  FROM players existing
  WHERE existing.team_id = manchester_team.id
    AND existing.full_name = roster.full_name
    AND COALESCE(existing.jersey_number, -1) = roster.jersey_number
);

WITH manchester_team AS (
  SELECT id
  FROM teams
  WHERE LOWER(name) = LOWER('Manchester High School')
  LIMIT 1
)
UPDATE players
SET leadership_role = 'captain',
    updated_at = NOW()
FROM manchester_team
WHERE players.team_id = manchester_team.id
  AND players.full_name = 'S. Reynolds'
  AND players.jersey_number = 10;

WITH manchester_team AS (
  SELECT id
  FROM teams
  WHERE LOWER(name) = LOWER('Manchester High School')
  LIMIT 1
)
UPDATE players
SET leadership_role = 'vice_captain',
    updated_at = NOW()
FROM manchester_team
WHERE players.team_id = manchester_team.id
  AND (
    (players.full_name = 'J. Ward' AND players.jersey_number = 51)
    OR (players.full_name = 'J. Forbes' AND players.jersey_number = 8)
    OR (players.full_name = 'M. Reid' AND players.jersey_number = 17)
  );

WITH manchester_team AS (
  SELECT id
  FROM teams
  WHERE LOWER(name) = LOWER('Manchester High School')
  LIMIT 1
)
UPDATE players
SET is_starter = TRUE,
    updated_at = NOW()
FROM manchester_team
WHERE players.team_id = manchester_team.id
  AND (
    (players.full_name = 'J. Ward' AND players.jersey_number = 51)
    OR (players.full_name = 'D. Myers' AND players.jersey_number = 3)
    OR (players.full_name = 'J. Morgan' AND players.jersey_number = 4)
    OR (players.full_name = 'J. White' AND players.jersey_number = 5)
    OR (players.full_name = 'D. Bartley' AND players.jersey_number = 6)
    OR (players.full_name = 'J. Gordon' AND players.jersey_number = 7)
    OR (players.full_name = 'J. Forbes' AND players.jersey_number = 8)
    OR (players.full_name = 'J. Mckenzie' AND players.jersey_number = 9)
    OR (players.full_name = 'S. Reynolds' AND players.jersey_number = 10)
    OR (players.full_name = 'B. Brown' AND players.jersey_number = 11)
    OR (players.full_name = 'L. Peachus' AND players.jersey_number = 15)
  );
