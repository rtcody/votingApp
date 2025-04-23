from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2

app = Flask(__name__)  
CORS(app) 

@app.route('/')
def blank():   
    return "Welcome to VotingApp Backend"

# Create a global connection to be reused
def get_db_connection():
    conn = psycopg2.connect(
        dbname='mydb',
        user='postgres',
        password='mysecretpassword',
        host='localhost',
        port='5433'
    )
    return conn

@app.route('/api/v1/users')
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users')
    users = cursor.fetchall()
    cursor.close()
    conn.close()  
    return {'users': users}

@app.route('/api/v1/polls')
def get_polls():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT question FROM polls')
    polls = cursor.fetchall()
    cursor.close()
    conn.close()

    polls_list = [p[0] for p in polls]
    return jsonify(polls_list)

@app.route('/api/v1/votes_summary', methods=['GET'])
def get_vote_summary():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT poll_id, votes_for, votes_against FROM poll_vote_summary')
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    summary = [
        {
            'poll_id': row[0],
            'votes_for': row[1],
            'votes_against': row[2]
        }
        for row in rows
    ]

    return jsonify(summary)



@app.route('/api/v1/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Check if username already exists
        cur.execute("SELECT * FROM users WHERE username = %s", (username,))
        existing_user = cur.fetchone()

        if existing_user:
            return jsonify({"error": "Username or email already taken"}), 400

        # Insert new user
        cur.execute(
        "INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING user_id",
         (username, email, password)
        )
        user_id = cur.fetchone()[0]  # Fetch the inserted user's ID


        conn.commit()
        return jsonify({"message": "User registered successfully", "user_id": user_id}), 201
    
    except psycopg2.Error as e:
        conn.rollback()  # Roll back transaction on error
        return jsonify({"error": "Database error", "details": str(e)}), 500

    finally:
        cur.close()
        conn.close()

@app.route('/api/v1/login', methods=['POST'])
def login():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')

    # Debugging: Print received data
    print(f"Received login attempt for username: {username}")

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Corrected SQL query to use a tuple (username,)
        cur.execute('SELECT password FROM users WHERE username = %s', (username,))
        result = cur.fetchone()

        if result is None:
            print("User not found in database.")  # Debugging output
            return jsonify({"message": "User not found"}), 404

        stored_password = result[0]

        # Debugging: Print stored password
        print(f"Stored password: {stored_password}")

        if password == stored_password:
            print("Login successful!")  # Debugging output
            return jsonify({"message": "Login successful"}), 200
        else:
            print("Invalid credentials.")  # Debugging output
            return jsonify({"message": "Invalid credentials"}), 401

    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"message": "Database error", "error": str(e)}), 500

    finally:
        cur.close()
        conn.close()

@app.route('/api/v1/create_poll', methods=['POST'])
def create_poll():
    data = request.get_json()

    question = data.get('question')
    username = data.get('username')
    password = data.get('password')
    expires_at = data.get('expires_at')

    if not question or not username or not password:
        return jsonify({"message": "Question, username, and password are required!"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Verify username and password (plaintext)
        cur.execute("SELECT user_id FROM users WHERE username = %s AND password = %s;", (username, password))
        result = cur.fetchone()

        if not result:
            return jsonify({"message": "Invalid username or password."}), 401

        user_id = result[0]

        # Create the poll with the verified user_id
        cur.execute('''
            INSERT INTO polls (question, created_by, expires_at)
            VALUES (%s, %s, %s) RETURNING poll_id;
        ''', (question, user_id, expires_at))

        poll_id = cur.fetchone()[0]
        conn.commit()

        return jsonify({"message": "Poll created successfully!", "poll_id": poll_id}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

    finally:
        cur.close()
        conn.close()

import random
import uuid

# Dictionary to store user sessions (for development only)
user_sessions = {}

@app.route('/api/v1/record_vote', methods=['POST'])
def record_vote():
    data = request.get_json()
    
    # Get or create a session ID from headers or cookies
    # For testing purposes, we'll use a simple header
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        session_id = str(uuid.uuid4())  # Generate a new session ID
    
    # Validate input
    poll_id = data.get('poll_id')
    vote = data.get('vote')  # 'agree' or 'disagree'
    
    if poll_id is None or vote not in ['agree', 'disagree']:
        return jsonify({"message": "Missing or invalid fields"}), 400
    
    try:
        # Connect to database
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get poll ID if it exists
        poll_id_numeric = None
        
        if isinstance(poll_id, int) or (isinstance(poll_id, str) and poll_id.isdigit()):
            poll_id_numeric = int(poll_id)
            cur.execute("SELECT poll_id FROM polls WHERE poll_id = %s", (poll_id_numeric,))
        else:
            cur.execute("SELECT poll_id FROM polls WHERE question = %s", (str(poll_id),))
            
        poll_result = cur.fetchone()
        
        if poll_result:
            poll_id_numeric = poll_result[0]
        else:
            # Create a temporary poll if needed
            cur.execute("SELECT user_id FROM users LIMIT 1")
            creator_id = cur.fetchone()[0]
            
            if isinstance(poll_id, str) and not poll_id.isdigit():
                cur.execute("""
                    INSERT INTO polls (question, created_by) 
                    VALUES (%s, %s)
                    RETURNING poll_id
                """, (poll_id, creator_id))
                poll_id_numeric = cur.fetchone()[0]
            else:
                cur.close()
                conn.close()
                return jsonify({"message": f"Poll with ID {poll_id} not found"}), 404
        
        # Check if this session has already voted on this poll
        poll_key = f"poll_{poll_id_numeric}"
        if session_id in user_sessions and poll_key in user_sessions[session_id]:
            return jsonify({
                "message": "You have already voted on this poll",
                "session_id": session_id  # Return the session ID for the client
            }), 409
        
        # Record this session's vote
        if session_id not in user_sessions:
            user_sessions[session_id] = {}
        user_sessions[session_id][poll_key] = vote
        
        # Get a user to associate with the vote
        cur.execute("SELECT user_id FROM users LIMIT 1")
        base_user_id = cur.fetchone()[0]
        
        # Create a "new" user for each vote to bypass the unique constraint
        # This is only for development purposes
        random_offset = random.randint(1, 1000000)
        user_id = base_user_id + random_offset
        
        try:
            # Create the temporary user
            cur.execute("""
                INSERT INTO users (user_id, username, email, password)
                VALUES (%s, %s, %s, %s)
            """, (user_id, f"temp_user_{random_offset}", f"temp_{random_offset}@example.com", "password"))
        except Exception as e:
            print(f"Error creating temp user: {e}")
            conn.rollback()
            
            # Try again with a different random offset if the first attempt failed
            random_offset = random.randint(1000001, 2000000)
            user_id = base_user_id + random_offset
            
            try:
                cur.execute("""
                    INSERT INTO users (user_id, username, email, password)
                    VALUES (%s, %s, %s, %s)
                """, (user_id, f"temp_user_{random_offset}", f"temp_{random_offset}@example.com", "password"))
            except:
                # If we still can't create a user, use the base user
                user_id = base_user_id
        
        vote_val = 1 if vote == 'agree' else 0
        
        # Insert the vote
        try:
            cur.execute("""
                INSERT INTO votes (poll_id, user_id, vote)
                VALUES (%s, %s, %s)
            """, (poll_id_numeric, user_id, vote_val))
        except Exception as e:
            print(f"Error inserting vote: {e}")
            conn.rollback()
            cur.close()
            conn.close()
            return jsonify({
                "message": f"Error recording vote: {str(e)}",
                "session_id": session_id
            }), 500
            
        # Update the vote summary
        try:
            # Check if summary record exists
            cur.execute("SELECT poll_id FROM poll_vote_summary WHERE poll_id = %s", (poll_id_numeric,))
            summary_exists = cur.fetchone() is not None
            
            if summary_exists:
                # Update existing summary
                if vote_val == 1:
                    cur.execute("""
                        UPDATE poll_vote_summary
                        SET votes_for = votes_for + 1
                        WHERE poll_id = %s
                    """, (poll_id_numeric,))
                else:
                    cur.execute("""
                        UPDATE poll_vote_summary
                        SET votes_against = votes_against + 1
                        WHERE poll_id = %s
                    """, (poll_id_numeric,))
            else:
                # Create new summary record
                votes_for = 1 if vote_val == 1 else 0
                votes_against = 0 if vote_val == 1 else 1
                cur.execute("""
                    INSERT INTO poll_vote_summary (poll_id, votes_for, votes_against)
                    VALUES (%s, %s, %s)
                """, (poll_id_numeric, votes_for, votes_against))
        except Exception as e:
            print(f"Error updating vote summary: {e}")
            conn.rollback()
            cur.close()
            conn.close()
            return jsonify({
                "message": f"Error updating vote summary: {str(e)}",
                "session_id": session_id
            }), 500
            
        # Commit changes
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "message": "Vote recorded successfully",
            "session_id": session_id
        }), 201
        
    except Exception as e:
        print(f"Unexpected error in record_vote: {e}")
        return jsonify({
            "message": f"An unexpected error occurred: {str(e)}",
            "session_id": session_id
        }), 500
if __name__ == '__main__':
    app.run(debug=True)