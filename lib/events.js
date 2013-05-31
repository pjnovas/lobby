
var _ = require('underscore')
  , roomStatus = require('./roomStatus')
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

  function checkReady(room){
    var foundDisconnected = false;

    for(var u in room.users){
      if (u !== "length" && 
        (!room.users[u]._state || room.users[u]._state === 'disconnnected')){
        
        foundDisconnected = true;
        break;
      }
    }

    if (!foundDisconnected){
      room.status = roomStatus.READY;
      roomsIO.in(room.id).emit('room:ready');

      if (room.startOnReady){
        room.start();      
      }
    }
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

    socket.set('rdata', {
      uid: data.userId,
      rid: data.roomId
    });

    room.users[data.userId]._state = 'connnected';

    socket.join(room.id);
    socket.broadcast.to(room.id).emit('room:user:connect', { id: data.userId });

    var users = room.toJSON().users;
    ack(null, users);

    if (room.status === roomStatus.FULL){
      checkReady(room);
    }
  };

  function userDisconnect(){
    socket.get('rdata', function(err, rdata){
      if (!rdata){
        return;
      }

      var rid = rdata.rid
        , uid = rdata.uid
        , room = lobby.getById(rid);

      if (room && room.has(uid)){
        room.users[uid]._state = 'disconnnected';
      }

      socket.broadcast.to(rid).emit('room:user:disconnect', { id: uid });
      socket.leave(rid);
    });
  }

  socket.on('room:user:connect', userConnect);
  socket.on('room:user:disconnect', userDisconnect);
  socket.on('disconnect', userDisconnect);
};

var onRoomCreated = function(room){

  room.on('user:join', function(user){
    roomsIO.in(this.id).emit('room:user:join', { id: user.id });
  });

  room.on('user:leave', function(userId){
    roomsIO.in(this.id).emit('room:user:leave', { id: userId });
  });

  room.on('room:full', function(){
    roomsIO.in(this.id).emit('room:full');
  });

  room.on('room:start', function(){
    roomsIO.in(this.id).emit('room:start');
  });

  room.on('room:destroy', function(){
    roomsIO.in(this.id).emit('room:destroy');
  });
};

module.exports = function(io, _lobby){
  lobby = _lobby;
  roomsIO = io.of('/rooms');

  roomsIO.on('connection', newRoomSocket);
  lobby.on('room:create', onRoomCreated);
};