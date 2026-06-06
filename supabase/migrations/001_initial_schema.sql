-- ============================================================
-- CESP Initial Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'fan', 'super_admin', 'team_admin', 'coach',
  'livestream_operator', 'photographer', 'volunteer'
);

CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE article_category AS ENUM ('match_report', 'news', 'interview', 'feature', 'gallery', 'announcement');
CREATE TYPE fixture_status AS ENUM ('scheduled', 'live', 'completed', 'postponed', 'cancelled');
CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE sponsor_tier AS ENUM ('platinum', 'gold', 'silver', 'bronze');
CREATE TYPE volunteer_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'fan',
  team_id UUID,
  fcm_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TEAMS
-- ============================================================

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  badge_url TEXT,
  home_colour TEXT NOT NULL DEFAULT '#E85D04',
  away_colour TEXT NOT NULL DEFAULT '#FFFFFF',
  founded_year INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ADD CONSTRAINT profiles_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- ============================================================
-- PLAYERS
-- ============================================================

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  position TEXT,
  jersey_number INTEGER,
  date_of_birth DATE,
  nationality TEXT,
  photo_url TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_team ON players(team_id);
CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FIXTURES
-- ============================================================

CREATE TABLE fixtures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  away_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  venue TEXT,
  match_date TIMESTAMPTZ NOT NULL,
  status fixture_status NOT NULL DEFAULT 'scheduled',
  round TEXT,
  season TEXT NOT NULL DEFAULT '2024/25',
  youtube_stream_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (home_team_id != away_team_id)
);

CREATE INDEX idx_fixtures_date ON fixtures(match_date);
CREATE INDEX idx_fixtures_status ON fixtures(status);
CREATE TRIGGER fixtures_updated_at
  BEFORE UPDATE ON fixtures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- MATCH SCORES
-- ============================================================

CREATE TABLE match_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fixture_id UUID NOT NULL UNIQUE REFERENCES fixtures(id) ON DELETE CASCADE,
  home_score INTEGER NOT NULL DEFAULT 0,
  away_score INTEGER NOT NULL DEFAULT 0,
  home_score_ht INTEGER,
  away_score_ht INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MATCH STATS (goal scorers, cards, etc.)
-- ============================================================

CREATE TABLE match_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'goal', 'own_goal', 'yellow_card', 'red_card', 'substitution'
  event_minute INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_match_stats_fixture ON match_stats(fixture_id);

-- ============================================================
-- PLAYER STATS (season stats)
-- ============================================================

CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season TEXT NOT NULL DEFAULT '2024/25',
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  appearances INTEGER NOT NULL DEFAULT 0,
  yellow_cards INTEGER NOT NULL DEFAULT 0,
  red_cards INTEGER NOT NULL DEFAULT 0,
  UNIQUE(player_id, season)
);

-- ============================================================
-- ARTICLES (news, match reports, features — created by photographers/journalists)
-- ============================================================

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  category article_category NOT NULL DEFAULT 'news',
  status article_status NOT NULL DEFAULT 'draft',
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  fixture_id UUID REFERENCES fixtures(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-set published_at when status changes to published
CREATE OR REPLACE FUNCTION handle_article_publish()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER article_publish_timestamp
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION handle_article_publish();

-- ============================================================
-- GALLERY
-- ============================================================

CREATE TABLE gallery_albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  fixture_id UUID REFERENCES fixtures(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER gallery_albums_updated_at
  BEFORE UPDATE ON gallery_albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gallery_photos_album ON gallery_photos(album_id, sort_order);

-- ============================================================
-- PRODUCTS (merch store)
-- ============================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in cents (JMD or USD)
  currency TEXT NOT NULL DEFAULT 'USD',
  images TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'apparel',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_payment_intent_id TEXT,
  shipping_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DONATIONS
-- ============================================================

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status donation_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  donor_name TEXT,
  message TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_user ON donations(user_id);

-- ============================================================
-- LIVE CHAT
-- ============================================================

CREATE TABLE live_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_live_chat_fixture ON live_chat(fixture_id, created_at);

-- ============================================================
-- STREAM VIEWERS (realtime presence)
-- ============================================================

CREATE TABLE stream_viewers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stream_viewers_fixture ON stream_viewers(fixture_id);

-- ============================================================
-- FORMATIONS
-- ============================================================

CREATE TABLE formations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  formation TEXT NOT NULL DEFAULT '4-4-2',
  lineup JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fixture_id, team_id)
);

CREATE TRIGGER formations_updated_at
  BEFORE UPDATE ON formations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL, -- 'match_start', 'goal', 'full_time', 'news', 'general'
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, sent_at DESC);

-- ============================================================
-- SPONSORS
-- ============================================================

CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  tier sponsor_tier NOT NULL DEFAULT 'bronze',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER sponsors_updated_at
  BEFORE UPDATE ON sponsors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VOLUNTEERS
-- ============================================================

CREATE TABLE volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  skills TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT,
  status volunteer_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER volunteers_updated_at
  BEFORE UPDATE ON volunteers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

-- Helper function: check user role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'team_admin')
  )
$$;

-- PROFILES
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (is_admin());

-- TEAMS (public read, admin write)
CREATE POLICY "teams_public_read" ON teams FOR SELECT USING (true);
CREATE POLICY "teams_admin_write" ON teams FOR ALL USING (is_admin());

-- PLAYERS (public read, admin write)
CREATE POLICY "players_public_read" ON players FOR SELECT USING (true);
CREATE POLICY "players_admin_write" ON players FOR ALL USING (is_admin());

-- FIXTURES (public read, admin write)
CREATE POLICY "fixtures_public_read" ON fixtures FOR SELECT USING (true);
CREATE POLICY "fixtures_admin_write" ON fixtures FOR ALL USING (is_admin());

-- MATCH SCORES (public read, live operator/admin write)
CREATE POLICY "match_scores_public_read" ON match_scores FOR SELECT USING (true);
CREATE POLICY "match_scores_operator_write" ON match_scores FOR ALL USING (
  auth_user_role() IN ('super_admin', 'team_admin', 'livestream_operator')
);

-- MATCH STATS (public read, admin write)
CREATE POLICY "match_stats_public_read" ON match_stats FOR SELECT USING (true);
CREATE POLICY "match_stats_admin_write" ON match_stats FOR ALL USING (is_admin());

-- PLAYER STATS (public read, admin write)
CREATE POLICY "player_stats_public_read" ON player_stats FOR SELECT USING (true);
CREATE POLICY "player_stats_admin_write" ON player_stats FOR ALL USING (is_admin());

-- ARTICLES (published articles public; drafts only to author/admin)
CREATE POLICY "articles_published_read" ON articles FOR SELECT
  USING (status = 'published' OR author_id = auth.uid() OR is_admin());
CREATE POLICY "articles_author_insert" ON articles FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND auth_user_role() IN ('super_admin', 'team_admin', 'photographer')
  );
CREATE POLICY "articles_author_update" ON articles FOR UPDATE
  USING (author_id = auth.uid() OR is_admin());
CREATE POLICY "articles_admin_delete" ON articles FOR DELETE USING (is_admin());

-- GALLERY ALBUMS (published public; drafts to author/admin)
CREATE POLICY "gallery_albums_published_read" ON gallery_albums FOR SELECT
  USING (is_published OR author_id = auth.uid() OR is_admin());
CREATE POLICY "gallery_albums_author_insert" ON gallery_albums FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND auth_user_role() IN ('super_admin', 'team_admin', 'photographer')
  );
CREATE POLICY "gallery_albums_author_update" ON gallery_albums FOR UPDATE
  USING (author_id = auth.uid() OR is_admin());
CREATE POLICY "gallery_albums_admin_delete" ON gallery_albums FOR DELETE USING (is_admin());

-- GALLERY PHOTOS (same as albums)
CREATE POLICY "gallery_photos_public_read" ON gallery_photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM gallery_albums WHERE id = album_id AND (is_published OR is_admin()))
);
CREATE POLICY "gallery_photos_author_write" ON gallery_photos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM gallery_albums ga
    WHERE ga.id = album_id AND (ga.author_id = auth.uid() OR is_admin())
  )
);

-- PRODUCTS (public read, admin write)
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active OR is_admin());
CREATE POLICY "products_admin_write" ON products FOR ALL USING (is_admin());

-- ORDERS (own orders only)
CREATE POLICY "orders_own_read" ON orders FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "orders_own_insert" ON orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders_admin_update" ON orders FOR UPDATE USING (is_admin());

-- ORDER ITEMS
CREATE POLICY "order_items_read" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND (user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);

-- DONATIONS (public can see non-anonymous; own always)
CREATE POLICY "donations_read" ON donations FOR SELECT USING (
  NOT is_anonymous OR user_id = auth.uid() OR is_admin()
);
CREATE POLICY "donations_insert" ON donations FOR INSERT WITH CHECK (true);
CREATE POLICY "donations_admin_update" ON donations FOR UPDATE USING (is_admin());

-- LIVE CHAT (authenticated users)
CREATE POLICY "live_chat_read" ON live_chat FOR SELECT USING (true);
CREATE POLICY "live_chat_insert" ON live_chat FOR INSERT WITH CHECK (
  auth.uid() = user_id AND auth.uid() IS NOT NULL
);
CREATE POLICY "live_chat_admin_delete" ON live_chat FOR DELETE USING (is_admin());

-- STREAM VIEWERS
CREATE POLICY "stream_viewers_all" ON stream_viewers FOR ALL USING (true);

-- FORMATIONS (public read, admin write)
CREATE POLICY "formations_public_read" ON formations FOR SELECT USING (true);
CREATE POLICY "formations_admin_write" ON formations FOR ALL USING (
  auth_user_role() IN ('super_admin', 'team_admin', 'coach')
);

-- NOTIFICATIONS (own notifications)
CREATE POLICY "notifications_own" ON notifications FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "notifications_own_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "notifications_admin_insert" ON notifications FOR INSERT
  WITH CHECK (is_admin());

-- SPONSORS (public read, admin write)
CREATE POLICY "sponsors_public_read" ON sponsors FOR SELECT USING (is_active OR is_admin());
CREATE POLICY "sponsors_admin_write" ON sponsors FOR ALL USING (is_admin());

-- VOLUNTEERS (own + admin)
CREATE POLICY "volunteers_own_read" ON volunteers FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "volunteers_own_insert" ON volunteers FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "volunteers_admin_update" ON volunteers FOR UPDATE USING (is_admin());

-- ============================================================
-- REALTIME (enable for live match updates)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE match_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE live_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE stream_viewers;
ALTER PUBLICATION supabase_realtime ADD TABLE fixtures;

-- ============================================================
-- SUPER ADMIN SEED
-- After running this migration, go to Supabase Auth > Users,
-- create the user clarendonelitecup@gmail.com manually,
-- then run the following to elevate to super_admin:
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'clarendonelitecup@gmail.com';
-- ============================================================
