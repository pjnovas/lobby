var _ = require('underscore');

module.exports = function(app, lobby){
  
  /* ROOMS */
  app.get('/rooms', list);
  app.post('/rooms', create, addUser, sendRoom);

  app.put('/rooms', notAllowed.bind('GET,POST'));
  app.del('/rooms', notAllowed.bind('GET,POST'));

  /* ROOM QUEUES */
  app.post('/rooms/queues', createQueue);
  //app.post('/rooms/queues/:roomId');

  /* ROOM */
  app.get('/rooms/:roomId', getRoom, sendRoom);
  app.del('/rooms/:roomId', getRoom, remove);

  app.post('/rooms/:roomId', notAllowed.bind('GET,DELETE'));
  app.put('/rooms/:roomId', notAllowed.bind('GET,DELETE'));

  /* ROOM USERS */
  app.post('/rooms/:roomId/users', getRoom, addUser, sendOK);
  app.del('/rooms/:roomId/users/:userId', getRoom, removeUser);
  //app.get('/rooms/:roomId/users');

  function list(req, res){
    res.send([]);
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

  function sendRoom(req, res){
    res.send(req.room.toJSON());
  }

  function remove(req, res){
    lobby.removeRoom(req.room.id);
    res.send(204);
  }

  function create(req, res, next){
    _.extend(req.body.config || {}, {
      owner: req.body.uid
    });

    var newRoom = lobby.create(req.body.config);
    req.room = newRoom;

    next();
  }

  function addUser(req, res, next){
    req.room.join(req.body.uid);
    next();
  }

  function sendOK(req, res){
    res.send(204);
  }

  function removeUser(req, res){
    var uId = req.params['userId'];
    
    try {
      req.room.leave(uId);
      res.send(204);
    }catch(e){
      if (e.httpCode){
        res.send(e.httpCode, { error: e.message});
      }
    }
  }

  function createQueue(req, res){
    var room = lobby.queue(req.body.uid, req.body.config);
    res.send(room.toJSON());
  }

  function notAllowed(req, res){
    res.set('allow', this);
    res.status(405).send();
  }

};