var _ = require('underscore')
  , Lobby = require('./index.js');

module.exports = function(app, lobby, ext){

  /* ROOMS */
  app.get('/rooms', type('rooms', 'fetch'), ext, list);
  app.post('/rooms', type('rooms', 'create'), ext, create, addUser, sendRoom);

  /* ROOM QUEUES */
  app.post('/rooms/queues', type('queues', 'create'), ext, createQueue);

  /* ROOM */
  app.get('/rooms/:roomId', type('room', 'fetch'), ext, getRoom, sendRoom);
  app.put('/rooms/:roomId', type('room', 'update'), ext, getRoom, updateRoom, sendRoom);
  app.del('/rooms/:roomId', type('room', 'remove'), ext, getRoom, remove);

  /* CHANGE ROOM STATUS */
  //app.put('/rooms/:roomId/status/:status', updateStatus);

  /* ROOM USERS */
  app.post('/rooms/:roomId/users', type('users', 'join'), ext, getRoom, addUser, sendOK);

  app.del('/rooms/:roomId/users/:userId', type('users', 'leave'), ext, getRoom, removeUser);

  function type(_resource, _action){
    return function(req, res, next){
      req.roomCall = {
        resource: _resource,
        action: _action
      }
      next();
    };
  }

  function list(req, res){
    res.send(lobby.getRooms());
  }

  function getRoom(req, res, next){
    var found = lobby.getById(req.params['roomId']);
    if (found){
      req.room = found;
      next();
    }
    else {
      res.send(404);
    }
  }

  function updateRoom(req, res, next){
    try {
      if (req.room.owner === req.roomUser.id) {
        req.room.update(req.body);
        next();
      }
      else {
        throw new Lobby.error.NotOwner('Only the owner can update a room');
      }
    } catch(e) {
      if (e.httpCode){
        res.send(e.httpCode, { error: e.message});
      }
    }
  }

  function sendRoom(req, res){
    res.send(req.room.toJSON());
  }

  function remove(req, res){
    lobby.removeRoom(req.room.id);
    res.send(204);
  }

  function create(req, res, next){
    _.extend(req.body || {}, {
      owner: req.roomUser.id
    });

    var newRoom = lobby.create(req.body);
    req.room = newRoom;

    next();
  }

  function addUser(req, res, next){
    try {
      req.room.join(req.roomUser.id);
      next();
    } catch(e) {
      if (e.httpCode){
        res.send(e.httpCode, { error: e.message});
      }
    }
  }

  function sendOK(req, res){
    res.send(204);
  }

  function removeUser(req, res){
    var uId = req.params['userId'];
    
    try {
      req.room.leave(uId);
      res.send(204);
    } catch(e) {
      if (e.httpCode){
        res.send(e.httpCode, { error: e.message});
      }
    }
  }

  function createQueue(req, res){
    var room = lobby.queue(req.body);
    room.join(req.roomUser.id);
    res.send(room.toJSON());
  }

};