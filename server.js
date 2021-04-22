const express = require("express");
const http = require("http");
const app = express();
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const server = http.createServer(app);
const io = socketio(server);

//Set static folder

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    // to a single client
    socket.emit(
      "message",
      formatMessage("Chat2Chat Bot", "Welcome to Chatboard")
    );

    // This emit to all users except the user that's connecting  (broadcast.emit)
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage("Chat2Chat Bot", user.username + " has joined the chat")
      );

    //Send Users and room info

    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage

  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      // This emit to all users
      io.to(user.room).emit(
        "message",
        formatMessage("Chat2Chat Bot", user.username + " has left the chat")
      );

      //Send Users and room info

      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

let port = process.env.PORT || 3000 ;

server.listen(port, () => {
  console.log("Server is listening ");
});
