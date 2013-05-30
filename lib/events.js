
var _ = require('underscore')
  , Lobby = require('./index.js')
  , lobby
  , roomsIO;

var newRoomSocket = function(socket){

  function getRoom(data){
    var room = lobby.getById(data.roomId);

    if (!room){
      throw new Lobby.error.RoomNotFound('Room not found');
    }

    if (!room.has(data.userId)){
      throw new Lobby.error.UserNotFound('User not joined to this room');
    }

    return room;
  }

  function userConnect(data, ack){
    var room;

    try {
      room = getRoom(data);
    }
    catch(e){
      return ack({
        code: e.code,
        message: e.message
      });
    }

    var roomName = 'r' + (data.roomId.toString());

    socket.set('rdata', {
      id: data.userId,
      room: data.roomName
    });
    
    socket.join(roomName);
    socket.broadcast.to(roomName).emit('room:user:connect', { id: data.userId });

    var users = room.toJSON().users;
    ack(null, users);
  };

  function userDisconnect(){
    socket.get('rdata', function(err, rdata){
      socket.broadcast.to(rdata.room).emit('room:user:disconnect', { id: rdata.id });
      socket.leave(rdata.room);
    });
  }

  socket.on('room:user:connect', userConnect);
  socket.on('room:user:disconnect', userDisconnect);
  socket.on('disconnect', userDisconnect);
};

var onRoomCreated = function(room){

  room.on('user:join', function(user){
    roomsIO.in('r' + this.id).emit('room:user:join', { id: user.id });
  });

  room.on('user:leave', function(userId){
    roomsIO.in('r' + this.id).emit('room:user:leave', { id: userId });
  });

  room.on('room:full', function(){
    roomsIO.in('r' + this.id).emit('room:full');
  });

  room.on('room:start', function(){
    roomsIO.in('r' + this.id).emit('room:start');
  });

  room.on('room:destroy', function(){
    roomsIO.in('r' + this.id).emit('room:destroy');
  });
};

module.exports = function(io, _lobby){
  lobby = _lobby;
  roomsIO = io.of('/rooms');

  roomsIO.on('connection', newRoomSocket);
  lobby.on('room:create', onRoomCreated);
};