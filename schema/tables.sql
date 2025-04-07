-- Create users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create polls table
CREATE TABLE polls (
    poll_id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    created_by INT NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create votes table to track user votes as 'agree' (1) or 'disagree' (0)
CREATE TABLE votes (
    vote_id SERIAL PRIMARY KEY,
    poll_id INT NOT NULL,
    user_id INT NOT NULL,
    vote INT NOT NULL,  -- 1 for agree, 0 for disagree
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES polls(poll_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT unique_vote UNIQUE(poll_id, user_id)  -- Ensures a user can vote only once per poll
);

-- Insert dummy users
INSERT INTO users (username, email, password)
VALUES
    ('alice', 'alice@example.com', 'password123'),
    ('bob', 'bob@example.com', 'password456'),
    ('charlie', 'charlie@example.com', 'password789');

-- Insert dummy polls
INSERT INTO polls (question, created_by)
VALUES
    ('Do you agree with the new policy?', 1),  -- Alice created the poll
    ('Should we extend the deadline?', 2);    -- Bob created the poll

-- Insert dummy votes for the first poll (Do you agree with the new policy?)
INSERT INTO votes (poll_id, user_id, vote)
VALUES
    (1, 1, 1),  -- Alice agrees
    (1, 2, 0),  -- Bob disagrees
    (1, 3, 1);  -- Charlie agrees

-- Insert dummy votes for the second poll (Should we extend the deadline?)
INSERT INTO votes (poll_id, user_id, vote)
VALUES
    (2, 1, 0),  -- Alice disagrees
    (2, 2, 1),  -- Bob agrees
    (2, 3, 0);  -- Charlie disagrees
