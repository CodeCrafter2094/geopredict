-- GeoPredict Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    total_score DECIMAL(10, 2) DEFAULT 0,
    predictions_count INTEGER DEFAULT 0,
    avg_score DECIMAL(5, 2) DEFAULT 0
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL,
    country_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    expected_outcome TEXT NOT NULL,
    time_range TEXT NOT NULL CHECK (time_range IN ('1_month', '3_months', '6_months', '1_year')),
    category TEXT NOT NULL CHECK (category IN ('war', 'politics', 'economy', 'technology')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'evaluated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deadline TIMESTAMPTZ NOT NULL,
    is_flagged BOOLEAN DEFAULT FALSE
);

-- Prediction scores table
CREATE TABLE IF NOT EXISTS prediction_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL UNIQUE REFERENCES predictions(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    ai_reasoning TEXT,
    evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, prediction_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_flagged BOOLEAN DEFAULT FALSE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_country ON predictions(country_code);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_deadline ON predictions(deadline);
CREATE INDEX IF NOT EXISTS idx_prediction_scores_prediction ON prediction_scores(prediction_id);
CREATE INDEX IF NOT EXISTS idx_likes_prediction ON likes(prediction_id);
CREATE INDEX IF NOT EXISTS idx_comments_prediction ON comments(prediction_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
CREATE POLICY "Public profiles are viewable by everyone" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Predictions RLS policies
CREATE POLICY "Predictions are viewable by everyone" ON predictions
    FOR SELECT USING (true);

CREATE POLICY "Users can create predictions" ON predictions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions" ON predictions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions" ON predictions
    FOR DELETE USING (auth.uid() = user_id);

-- Prediction scores RLS policies
CREATE POLICY "Scores are viewable by everyone" ON prediction_scores
    FOR SELECT USING (true);

CREATE POLICY "Service can insert scores" ON prediction_scores
    FOR INSERT WITH CHECK (true);

-- Likes RLS policies
CREATE POLICY "Likes are viewable by everyone" ON likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like" ON likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike" ON likes
    FOR DELETE USING (auth.uid() = user_id);

-- Comments RLS policies
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Users can comment" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update user stats after prediction evaluation
CREATE OR REPLACE FUNCTION update_user_stats(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    total DECIMAL(10, 2);
    count INTEGER;
    avg DECIMAL(5, 2);
BEGIN
    SELECT 
        COALESCE(SUM(ps.score), 0),
        COUNT(ps.id),
        COALESCE(AVG(ps.score), 0)
    INTO total, count, avg
    FROM prediction_scores ps
    JOIN predictions p ON ps.prediction_id = p.id
    WHERE p.user_id = user_uuid;

    UPDATE users 
    SET total_score = total,
        predictions_count = count,
        avg_score = avg
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update user stats after score insertion
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_user_stats(
        (SELECT user_id FROM predictions WHERE id = NEW.prediction_id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_prediction_scored
    AFTER INSERT ON prediction_scores
    FOR EACH ROW EXECUTE FUNCTION trigger_update_user_stats();

-- Insert demo admin user (optional)
-- INSERT INTO users (id, username, email, role)
-- VALUES (
--     gen_random_uuid(),
--     'admin',
--     'admin@geopredict.com',
--     'admin'
-- );

-- Enable realtime for predictions
ALTER PUBLICATION supabase_realtime ADD TABLE predictions;
