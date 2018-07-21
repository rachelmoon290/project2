document.addEventListener('DOMContentLoaded', () => {

    // if a new user, prompt the user to type in a username.
    if (!localStorage.getItem('username')) {
        var username = prompt("Please create a username to start chatting in ChatterBox!");
        // if user cancels the prompt, re-prompt them to enter username if they want to enter
        while (!username) {
            var username = prompt("You need to create a username to enter ChatterBox.");
        };
        localStorage.setItem('username', username);
    };

    // retrieve username information
    var username = localStorage.getItem('username');

    //if new user, take the user to general channel
    if(!localStorage.getItem('channel')) {
        localStorage.setItem('channel', 'general');
    };

    // take the user to last visited channel
    var current_channel = localStorage.getItem('channel');

    // set up channel lists and load current channel's messages
    get_channels();
    get_messages(current_channel);

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // When connected to socket.io
    socket.on('connect',() => {

        // when create channel button is clicked, prompt user to create a new channel
        document.querySelector("#create_channel").onclick = () => {
            var channel_name = prompt("Name your new channel!");
            socket.emit('create channel', {"channel": channel_name});
            return false;
        };

        // when user clicks a channel, retrieve its message log and store user's current channel information
        document.querySelectorAll('.channel_link').forEach(channel => {
            channel.onclick = () => {
                get_messages(channel.dataset.page);
                localStorage.setItem("channel", channel.dataset.page);
                return false;
            };
        });

        // when user clicks delete message button, delete the message
        document.querySelectorAll("button").forEach(del => {
            del.onclick = () => {
                var key = del.parentElement.dataset.key;
                socket.emit("delete message", {"key": key});
                return false;
            };
        });

        // whenever new message is added to the page, update new delete button onclick attributes
        var targetlist = document.querySelector("#messages");
        var observer = new MutationObserver(function() {
            document.querySelectorAll("button").forEach(del => {
                del.onclick = () => {
                    var key = del.parentElement.dataset.key;
                    socket.emit("delete message", {"key": key});
                    return false;
                };
            });
        });
        var configs = {childList: true};
        observer.observe(targetlist, configs);

    });

    // if new channel name exists, throw error
    socket.on('already existing channel', () => {
        var channel_name = prompt("Channel name already exists. Please enter a new channel name!");
        socket.emit('create channel', {"channel": channel_name});
    });

    // if new channel name is blank, throw error
    socket.on('invalid channel name', () => {
        var channel_name = prompt("You cannot name your channel with blank space. Please type a valid channel name!");
        socket.emit('create channel', {"channel": channel_name});
    });

    // if new channel addition is successful, update channel list information
    socket.on('channel updated', () => {
        document.location.reload();
    });


    // when user submits a message, send data to server
    document.querySelector("#new-message").onsubmit = () => {
        var message = document.querySelector("#message").value;
        var time = new Date();
        var localtime = time.toLocaleString();
        var channel = localStorage.getItem("channel");
        socket.emit('send message', {"message": message, "channel": channel, "username": username, "timestamp": localtime});
        return false;
    };

    // When a new message is announced, add the chat message onto the page
    socket.on('announce message', data => {

        // import new message only if new message's channel information is same as user's current channel
        if (data.channel == localStorage.getItem("channel")) {
            const li = document.createElement('li');
            li.setAttribute("data-key", `${data.key}`);
            li.innerHTML = `<span style = "font-size: 20px"><b> ${data.user} </b></span> <span style = "color: grey">(${data.timestamp})</span><b>:</b> <br> &nbsp;${data.message}`;
            document.querySelector('#messages').append(li);

            // if new message is current user's message, allow delete button to appear
            if (data.user == localStorage.getItem("username")) {
                var del = document.createElement("button");
                del.setAttribute("class", "delete");
                del.innerHTML = "Delete";
                li.append(del);
            };

            // if length of message in the chat exceeds 100, delete the oldest message
            if (document.querySelectorAll("#messages li").length > 100) {
                messages = document.querySelector("#messages");
                messages.removeChild(messages.firstChild);
            };

            // clear the message form input value
            document.querySelector("#message").value = '';
        };
    });

    // when message is successfully deleted, remove the message from the page
    socket.on("deleted", data => {
        document.querySelector(`[data-key = '${data.key}']`).remove();
    });
});


//function to get channel lists from server
function get_channels() {

    var channellist = document.querySelector("#channels");

    // delete old channel lists currently on the page
    while (channellist.firstChild) {
        channellist.removeChild(channellist.firstChild);
    };

    // make an ajax request to retrieve channel list information from server
    const request = new XMLHttpRequest();
    request.open('GET', '/getchannel');
    request.onload = () => {
        const channel_list = request.responseText;

        // update channel list tab
        JSON.parse(channel_list).forEach(channel => {
            const a = document.createElement('a');
            a.setAttribute("href", "");
            a.setAttribute("class", "channel_link");
            a.setAttribute("data-page", `${channel}`);
            a.innerHTML = channel;
            document.querySelector("#channels").append(a);
        });
    };
    request.send();
}

// function to retrieve message logs from a channel
function get_messages(channel_name) {

    // change message header with current channel name
    document.querySelector("#channelname").innerHTML = channel_name;

    // delete all messages currently on the chat page
    var messagelist = document.querySelector("#messages");
    while (messagelist.firstChild) {
        messagelist.removeChild(messagelist.firstChild);
    };

    // make ajax request to retrieve previous messages from server
    const request = new XMLHttpRequest();
    request.open('GET', '/getmessages');
    request.onload = () => {
        var messages = request.responseText;

        // retrieve only if there is any message saved in the server
        if (messages.length > 0) {
            messages = JSON.parse(messages);
            for (var key in messages) {

                // retrieve only the messages from this specific channel
                if (messages[key]["channel"] == channel_name) {
                    const li = document.createElement('li');
                    li.innerHTML = `<span style = "font-size: 20px"><b> ${messages[key]["username"]} </b></span> <span style = "color: grey">(${messages[key]["timestamp"]})</span><b>:</b> <br> &nbsp;${messages[key]["message"]}`;
                    li.setAttribute("data-key", `${key}`);
                    document.querySelector("#messages").append(li);

                    // if user's own message, attach delete button
                    if (messages[key]["username"] == localStorage.getItem("username")) {
                        var del = document.createElement("button");
                        del.setAttribute("class", "delete");
                        del.innerHTML = "Delete";
                        li.append(del);
                    };
                };
            };
        };
    };
    request.send();
}
