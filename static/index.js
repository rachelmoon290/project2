document.addEventListener('DOMContentLoaded', () => {

  //when a new user visits the site, prompt the user to type in a username.
  if (!localStorage.getItem('username')) {
    var username = prompt("Please create a username to start chatting in ChatterBox!");
    localStorage.setItem('username', username);
  };
  var username = localStorage.getItem('username');


  if(!localStorage.getItem('channel')) {
    localStorage.setItem('channel', 'general');
  };
  var current_channel = localStorage.getItem('channel');

  // set up channel lists and load current channel's messages
  get_channels();
  get_messages(current_channel);

  // Connect to websocket
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  // When connected,
  socket.on('connect',() => {

    document.querySelectorAll('.channel_link').forEach(channel => {
      channel.onclick = () => {
        document.querySelectorAll('.channel_link').setAttribute("class", "channel_link");
        channel.setAttribute("class", "active");
        get_messages(channel.dataset.page);
        localStorage.setItem("channel", channel.dataset.page);

        return false;
      };
    });


    document.querySelector("#create_channel").onclick = () => {
      var channel_name = prompt("Name your new channel!");
        socket.emit('create channel', {"channel": channel_name});
        return false;
          };
        });

  socket.on('already existing channel', () => {
    var channel_name = prompt("Channel name already exists. Please enter a new channel name!");
    socket.emit('create channel', {"channel": channel_name});
  });

  socket.on('invalid channel name', () => {
    var channel_name = prompt("You cannot name your channel with blank space. Please type a valid channel name!");
    socket.emit('create channel', {"channel": channel_name});
  });


  socket.on('channel updated', data => {
    var new_channel = data.new_channel;
    const a = document.createElement('a');
    a.setAttribute("href", "");
    a.setAttribute("class", "channel_link")
    a.setAttribute("data-page", `${new_channel}`);
    a.innerHTML = new_channel;
    document.querySelector("#channels").append(a);
    });


      // submit messages
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
    if (data.channel == localStorage.getItem("channel")) {
      const li = document.createElement('li');
      li.innerHTML = `<span style = "font-size: 20px"><b> ${data.user} </b></span> <span style = "color: grey">(${data.timestamp})</span><b>:</b> <br> &nbsp;${data.message}`;
      document.querySelector('#messages').append(li);
      document.querySelector("#message").value = '';
    };
  });
});


//function to set up channel lists
function get_channels() {
  const request = new XMLHttpRequest();
  request.open('GET', '/getchannel');
  request.onload = () => {
    const channel_list = request.responseText;
    JSON.parse(channel_list).forEach(channel => {
      const a = document.createElement('a');
      a.setAttribute("href", "");
      a.setAttribute("class", "channel_link")
      a.setAttribute("data-page", `${channel}`);
      a.innerHTML = channel;
      document.querySelector("#channels").append(a);
    });
  };
  request.send();
}

function get_messages(channel_name) {
  document.querySelectorAll(".channel_link").forEach(link => {
    if (link.dataset.page == channel_name) {
      link.setAttribute("class", "active");
    };
  })
  const request = new XMLHttpRequest();
  request.open('GET', '/getmessages');
  request.onload = () => {
    var messages = request.responseText;
    if (messages.length > 0) {
      messages = JSON.parse(messages);
      for (var message in messages) {
        if (message["channel"] == channel_name) {
          const li = document.createElement('li');
          li.innerHTML = `<span style = "font-size: 20px"><b> ${message.username} </b></span> <span style = "color: grey">(${message.time})</span><b>:</b> <br> &nbsp;${message.message}`;
          document.querySelector("#messages").append(li);
        };
      };
    };
  };
  request.send();
}
