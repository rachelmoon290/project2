import os, requests

from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit
from flask_session import Session


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


# list of all channels
channel_list = ['general']

@app.route("/")
def index():
    return render_template("index.html")


@socketio.on("send message")
def send(data):
    message = data["message"]
    session["user_id"] = data["username"]
    emit("announce message", {"message": message, "user": session["user_id"]}, broadcast=True)
