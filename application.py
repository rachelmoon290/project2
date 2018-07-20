import os, requests

from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit
from flask_session import Session
import json


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


# global variables
channel_list = ['general']
messages = {}
messagecounter = 0

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/getchannel")
def getchannel():
    global channel_list
    return json.dumps(channel_list)

@app.route("/getmessages")
def getmessages():
    global messages
    return json.dumps(messages)


@socketio.on("create channel")
def create_channel(data):
    global channel_list
    new_channel = data["channel"]

    if (new_channel == None):
        return;
    elif new_channel in channel_list:
        emit("already existing channel")
    elif (new_channel.strip() == ""):
        emit("invalid channel name")
    else:
        channel_list.append(new_channel)
        emit("channel updated", {"new_channel": new_channel}, broadcast=True)


@socketio.on("send message")
def send(data):
    global messages
    global messagecounter

    session["user_id"] = data["username"]
    timestamp = data["timestamp"]
    current_channel = data["channel"]
    message = data["message"]

    temp_dict = {
        'username': session["user_id"],
        'channel': current_channel,
        'timestamp': timestamp,
        'message': message
    }

    messages[messagecounter] = temp_dict
    messagecounter += 1

    emit("announce message", {"message": message, "user": session["user_id"], "channel": current_channel , "timestamp": timestamp}, broadcast=True)
