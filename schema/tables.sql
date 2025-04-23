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

CREATE TABLE poll_vote_summary (
    poll_id INT PRIMARY KEY,
    votes_for INT DEFAULT 0,
    votes_against INT DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(poll_id)
);

-- Insert dummy users
INSERT INTO users (username, email, password) VALUES
('john_doe', 'john.doe@example.com', 'password123'),
('jane_smith', 'jane.smith@example.com', 'password456'),
('alice_jones', 'alice.jones@example.com', 'password789'),
('bob_white', 'bob.white@example.com', 'password000'),
('carol_green', 'carol.green@example.com', 'password111');

-- Insert dummy polls
INSERT INTO polls (question, created_by, expires_at) VALUES
('Should we have more flexible working hours?', 1, '2025-06-30 23:59:59'),
('Is climate change a real threat?', 2, '2025-07-15 23:59:59'),
('Should we switch to renewable energy?', 3, '2025-08-01 23:59:59'),
('Is social media harmful to mental health?', 4, '2025-07-01 23:59:59'),
('Should remote work be the new norm?', 5, '2025-09-01 23:59:59');

-- Insert dummy votes
INSERT INTO votes (poll_id, user_id, vote) VALUES
(1, 1, 1),  -- John votes 'agree' on poll 1
(1, 2, 0),  -- Jane votes 'disagree' on poll 1
(2, 2, 1),  -- Jane votes 'agree' on poll 2
(2, 3, 1),  -- Alice votes 'agree' on poll 2
(3, 3, 0),  -- Alice votes 'disagree' on poll 3
(3, 4, 1),  -- Bob votes 'agree' on poll 3
(4, 4, 1),  -- Bob votes 'agree' on poll 4
(4, 5, 0),  -- Carol votes 'disagree' on poll 4
(5, 5, 1),  -- Carol votes 'agree' on poll 5
(5, 1, 0);  -- John votes 'disagree' on poll 5

-- Insert dummy poll vote summaries
INSERT INTO poll_vote_summary (poll_id, votes_for, votes_against) VALUES
(1, 1, 1),  -- Poll 1: 1 agree, 1 disagree
(2, 2, 0),  -- Poll 2: 2 agree, 0 disagree
(3, 1, 1),  -- Poll 3: 1 agree, 1 disagree
(4, 1, 1),  -- Poll 4: 1 agree, 1 disagree
(5, 1, 1);  -- Poll 5: 1 agree, 1 disagree
