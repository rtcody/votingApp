from flask import Flask, jsonify

app = Flask(__name__)  

@app.route('/')
def blank():   
    return "Welcome to VotingApp Backend"

if __name__ == '__main__':
    app.run(debug=True)
