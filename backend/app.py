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
def users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users')
    users = cursor.fetchall()
    cursor.close()
    conn.close()  # Close the connection after use
    return {'users': users}

if __name__ == '__main__':
    app.run(debug=True)