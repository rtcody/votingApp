from flask import Flask, jsonify, request
import psycopg2

app = Flask(__name__)  

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

@app.route('/users')
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users')
    users = cursor.fetchall()
    cursor.close()
    conn.close()  
    return {'users': users}

@app.route('/polls')
def get_polls():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT question FROM polls')
    polls = cursor.fetchall()
    cursor.close()
    conn.close()

    polls_list = [p[0] for p in polls]
    return jsonify(polls_list)


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

    # Extract the poll prompt (question), created_by, and expires_at from the request
    question = data.get('question')
    created_by = data.get('created_by')
    expires_at = data.get('expires_at')

    if not question or not created_by:
        return jsonify({"message": "Question and created_by are required!"}), 400

    # Connect to the database
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Insert the new poll into the polls table
        cur.execute('''
            INSERT INTO polls (question, created_by, expires_at)
            VALUES (%s, %s, %s) RETURNING poll_id;
        ''', (question, created_by, expires_at))

        # Fetch the poll_id of the newly inserted poll
        poll_id = cur.fetchone()[0]

        # Commit the transaction
        conn.commit()

        # Respond with success message including the poll_id
        return jsonify({"message": "Poll created successfully!", "poll_id": poll_id}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"message": str(e)}), 500

    finally:
        cur.close()
        conn.close()



if __name__ == '__main__':
    app.run(debug=True)