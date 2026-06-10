-- Allow NULL team IDs so knockout fixtures can exist before teams are assigned
ALTER TABLE fixtures ALTER COLUMN home_team_id DROP NOT NULL;
ALTER TABLE fixtures ALTER COLUMN away_team_id DROP NOT NULL;

-- Add knockout_round column to track which stage a fixture belongs to
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS knockout_round TEXT
  CHECK (knockout_round IN ('semi_1', 'semi_2', 'third_place', 'final'));

-- Seed the four knockout-stage fixtures with TBA teams
-- round values match normalizeRound() logic in the bracket view:
--   'semi' → semifinal, 'third' → third, 'final' → final
INSERT INTO fixtures (home_team_id, away_team_id, status, round, knockout_round, match_date, season)
VALUES
  (NULL, NULL, 'scheduled', 'Semi-Final 1',  'semi_1',      '2026-08-15 14:00:00+00', '2025/26'),
  (NULL, NULL, 'scheduled', 'Semi-Final 2',  'semi_2',      '2026-08-15 16:00:00+00', '2025/26'),
  (NULL, NULL, 'scheduled', 'Third Place',   'third_place', '2026-08-22 14:00:00+00', '2025/26'),
  (NULL, NULL, 'scheduled', 'Final',         'final',       '2026-08-22 16:00:00+00', '2025/26');
