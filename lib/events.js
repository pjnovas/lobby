
var _ = require('underscore')
  , roomStatus = require('./roomStatus')
  , Lobby = require('./index.js')
  , lobby
  , customs
  , autoRemove
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
      room.ready();

      if (room.startOnReady){
        room.start();
      }
    } else if (room.status === roomStatus.READY){
      room.unReady();
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

    suscribeCustoms(socket);
  };

  function userDisconnect(){
    socket.get('rdata', function(err, rdata){
      if (!rdata){
        return;
      }

      var rid = rdata.rid
        , uid = rdata.uid
        , room = lobby.getById(rid);

      if (room){
        if (room.has(uid)){
          room.users[uid]._state = 'disconnnected';
        }
        checkReady(room);
      }

      socket.broadcast.to(rid).emit('room:user:disconnect', { id: uid });
      socket.leave(rid);

      setTimeout(function(){
        socket.get('rdata', function(err, rdata){
          var room = lobby.getById(rdata.rid);

          if (room && 
            room.users[rdata.uid] && 
            room.users[rdata.uid]._state === 'disconnnected'){
            
            room.leave(rdata.uid);
          }
        });
      }, autoRemove);
      
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

  room.on('room:update', function(){
    roomsIO.in(this.id).emit('room:update');
  });

  room.on('room:waiting', function(){
    roomsIO.in(this.id).emit('room:waiting');
  });

  room.on('room:full', function(){
    roomsIO.in(this.id).emit('room:full');
  });

  room.on('room:ready', function(){
    roomsIO.in(this.id).emit('room:ready');
  });

  room.on('room:start', function(){
    roomsIO.in(this.id).emit('room:start');
  });

  room.on('room:destroy', function(){
    roomsIO.in(this.id).emit('room:destroy');
  });
};

module.exports = function(io, _lobby, options){
  lobby = _lobby;
  customs = options.customs || {};
  autoRemove = options.autoRemove || 0;
  roomsIO = io.of('/rooms');

  roomsIO.on('connection', newRoomSocket);
  lobby.on('room:create', onRoomCreated);
};

function suscribeCustoms(socket){

  function attachCustom(rid, name){
    return function(data, ack){
      customs[name](data, function(err, newData){
        if (err) return ack(err);
        socket.broadcast.to(rid).emit('custom:' + name, newData);
        if (ack){
          ack();
        }
      });
    };
  }

  function appendEvents(err, rdata){
    var rid = rdata.rid;
    
    for (var c in customs){
      socket.on('custom:' + c, attachCustom(rid, c));
    }
  }

  socket.get('rdata', appendEvents);
}