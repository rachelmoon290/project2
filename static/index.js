document.addEventListener('DOMContentLoaded', () => {

  //when a new user visits the site, prompt the user to type in a username.
  if (!localStorage.getItem('username')) {
    var username = prompt("Please create a username to start chatting in ChatterBox!");
    localStorage.setItem('username', username);

  };
  var username = localStorage.getItem('username');

 if (localStorage.getItem('messages')) {
    var messagelog = JSON.parse(localStorage.getItem('messages'));
    messagelog.forEach(message => {
      const li = document.createElement('li');
      li.innerHTML = `<span style = "font-size: 20px"><b> ${message.username} </b></span> <span style = "color: grey">(${message.time})</span><b>:</b> <br> &nbsp;${message.message}`;
      document.querySelector("#messages").append(li);
    });
  };

  // Connect to websocket
  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  // When connected, configure buttons
  socket.on('connect', () => {

      // Each button should emit a "submit vote" event
      document.querySelector("#new-message").onsubmit = () => {
          var message = document.querySelector("#message").value;

          socket.emit('send message', {'message': message, 'username': username});
          return false;
        };
      });

  // When a new vote is announced, add to the unordered list
  socket.on('announce message', data => {
      var time = new Date();
      var localtime = time.toLocaleString();
      const li = document.createElement('li');
      li.innerHTML = `<span style = "font-size: 20px"><b> ${username} </b></span> <span style = "color: grey">(${localtime})</span><b>:</b> <br> &nbsp;${data.message}`;
      document.querySelector('#messages').append(li);
      storeMessages(username, localtime, data.message);
      document.querySelector("#message").value = '';
  });

  function storeMessages(username, time, message) {
    var messagelog = JSON.parse(localStorage.getItem("messages")) || [];
    messagelog.push({"username": username, "time": time, "message": message});
    localStorage.setItem('messages', JSON.stringify(messagelog));
  }



});
