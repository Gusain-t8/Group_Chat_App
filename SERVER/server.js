import express from 'express';
const app = express();
import { createServer } from 'http';
const httpServer = createServer();
const PORT = 5000;
import { nanoid } from "nanoid";
import { Server } from 'socket.io';
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

let users = [];
let rooms = [];

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.emit("me", socket.id);
    users.push(socket.id);

    socket.broadcast.emit("updateUsers", users);

    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected.`);
        users = users.filter((user) => user !== socket.id);
        console.log(users);
        socket.broadcast.emit("updateUsers", users);
        socket.disconnect();

    });

    //emit makes a call but broadcast you tell all availabel sockets about the user 

    socket.emit("getAllUsers", users);
    console.log(users);
    

     // Rooms
  socket.on("create_room", () => {
    const room = {
        id: nanoid(7),
        chat: [],
      };
    socket.join(room);
    socket.emit("get_room", room);
    console.log("Room created: " + room.id);
    rooms.push(room);

    socket.broadcast.emit("updateRooms", rooms);
  });

  socket.on("join_room", (room) => {
    socket.join(room.id);
    console.log(`user ${socket.id} joined room: ${room.id}`);
    
  });
  socket.emit("getAllRooms",rooms);
  socket.broadcast.emit("updateRooms", rooms);

  socket.on("message", payLoad => {
     console.log(`Message from ${socket.id} : ${payLoad.message}`);
     rooms.map((room) => { 
      if (room.id === payLoad.room) {
        room.chat.push({ message: payLoad.message, writer: payLoad.socketId});
        payLoad.chat = room.chat;
      }
      });
      io.to(payLoad.room).emit("chat", payLoad); //who or which room we want to send message 

    });


});
httpServer.listen(PORT,() => {
    console.log(`Server listening on port ${PORT}`);
});


