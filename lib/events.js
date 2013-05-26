
var _ = require('underscore'),
  lobby,
  roomsIO;

var newRoomSocket = function(socket){

  socket.on('room:user:connect', function(data, ack){
    var roomName = 'r' + data.roomId;

    socket.set('rdata', {
      uid: data.userId,
      room: data.roomName
    });
    
    socket.join(roomName);
    socket.broadcast.to(roomName).emit('room:user:connect', { uid: data.userId });

    ack();
  });

  function userDisconnect(){
    socket.get('rdata', function(err, rdata){
      socket.broadcast.to(rdata.room).emit('room:user:disconnect', { uid: rdata.uid });
      socket.leave(rdata.room);
    });
  }

  socket.on('room:user:disconnect', userDisconnect);
  socket.on('disconnect', userDisconnect);
};

var onRoomCreated = function(room){

  room.on('user:join', function(user){
    roomsIO.in('r' + this.id).emit('room:user:join', { uid: user.id });
  });

  room.on('user:leave', function(userId){
    roomsIO.in('r' + this.id).emit('room:user:leave', { uid: userId });
  });

  room.on('room:full', function(){
    roomsIO.in('r' + this.id).emit('room:full');
  });
};

var onRoomDestroyed = function(room){
  roomsIO.in('r' + room.id).emit('room:destroy');
};

module.exports = function(io, _lobby){
  lobby = _lobby;
  roomsIO = io.of('/rooms');

  roomsIO.on('connection', newRoomSocket);

  lobby.on('room:create', onRoomCreated);
  lobby.on('room:destroy', onRoomDestroyed);
};