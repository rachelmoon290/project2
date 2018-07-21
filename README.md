# Project 2
The ChatterBox single-page web application allows the user to create a username, create new channels, and send messages in the channel. The user can delete his/her own previous messages.

## index.js
This javascript takes care of running the client-server, such as saving localstorage information (cache), dynamically updating new chat messages/channels on the page, and sending user input information to the backend server.

## style.css
The stylesheet specifies styles for index.html.

## index.html
This single-page application relies on this file for a basic layout of the page.

## application.py
This backend server is run using flask and socket.io. It stores and manages all the message and channel information using global variables, storing up to maximum 100 messages per channel. It communicates with client server through Socket.io emit and on functions to save new information and send previously stored information.
