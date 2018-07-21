import os, requests

from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit
from flask_session import Session
import json

# Configure session to use filesystem
app = Flask(__name__)
socketio = SocketIO(app)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"

Session(app)

# set global variables

channel_list = ['general'] # channel list
channels_counter = {'general': 0} # dictionary to count number of messages in each channel, to store maximum 100 messages per channel

messages = {} # all the messages will be stored in this dictionary
message_id = 0 #serves as message primary key



# main page
@app.route("/")
def index():
    return render_template("index.html")


# send channel list information to client server
@app.route("/getchannel")
def getchannel():
    global channel_list
    return json.dumps(channel_list)

# send messages information to client server
@app.route("/getmessages")
def getmessages():
    global messages
    return json.dumps(messages)


# when user creates new channel
@socketio.on("create channel")
def create_channel(data):
    global channel_list
    global channels_counter

    new_channel = data["channel"]

    # if user cancels the prompt, return nothing
    if (new_channel == None):
        return;

    # if new channel name already exists in current channels list, re-prompt the user
    elif new_channel in channel_list:
        emit("already existing channel")

    # if new channel name is blank, re-prompt the user
    elif (new_channel.strip() == ""):
        emit("invalid channel name")

    # else add new channel name to global channel list variable, and let client server know
    else:
        channel_list.append(new_channel)
        channels_counter[new_channel] = 0
        emit("channel updated", broadcast=True)



# when user sends a message
@socketio.on("send message")
def send(data):
    global messages
    global message_id
    global channels_counter

    # retrieve message data from client server
    session["user_id"] = data["username"]
    timestamp = data["timestamp"]
    current_channel = data["channel"]
    message = data["message"]

    # create a temporary dictionary storing these data
    temp_dict = {
        'username': session["user_id"],
        'channel': current_channel,
        'timestamp': timestamp,
        'message': message
    }

    # put this information into global message dictionary
    messages[message_id] = temp_dict
    current_message_id = message_id
    message_id += 1

    # keep track of number of messages in the current channel
    channels_counter[current_channel] += 1

    # if this channel has reached maximum of 100 messages, delete the oldest message
    if (channels_counter[current_channel] > 100):
        for key in messages:
            if messages[key]["channel"] == current_channel:
                del messages[key]
                channels_counter[current_channel] -= 1
                break;

    # broadcast new message on the client server
    emit("announce message", {"message": message, "key": current_message_id, "user": session["user_id"], "channel": current_channel , "timestamp": timestamp}, broadcast=True)

# when user deletes message
@socketio.on("delete message")
def delete(data):
    global messages

    # delete message
    key = data["key"]
    del messages[int(key)]
    
    emit("deleted", {"key": key}, broadcast = True)
