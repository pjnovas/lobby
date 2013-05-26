
var expect = require('expect.js');

var express = require('express')
  , socketIO = require('socket.io')
  , http = require('http')
  , path = require('path')
  , config = require('./config')
  , RoomFactory = require('../../lib');

var server;

describe('Events', function(){

  var io = createExpressApp();

  var roomFactory = new RoomFactory();
  roomFactory.events(io);

  require('./room')(roomFactory);
});

function createExpressApp(){
  var app = express();
  
  app.set('port', process.env.PORT || config.port);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);

  server = http.createServer(app);
  var io = socketIO.listen(server);

  io.set('log level', 1);

  server.listen(app.get('port'), function(){
    console.log('TEST Express server listening on port ' + app.get('port'));
  });

  return io;
}