
var expect = require('expect.js');

var express = require('express')
  , socketIO = require('socket.io')
  , http = require('http')
  , path = require('path')
  , config = require('./config')
  , Lobby = require('../../lib');

var server;

describe('Events', function(){

  var io = createExpressApp();

  var lobby = new Lobby();

  lobby.events(io, {
    message: function(data, done){
      if (data.invalid){
        return done('error thrown');
      }

      done(null, {
        xdata: data
      });
    },
    other: function(data, done){
      done(null, data);
    }
  });

  require('./room')(lobby);
});

function createExpressApp(){
  var app = express();
  
  app.set('port', process.env.PORT || config.port);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);

  server = http.createServer(app);
  var io = socketIO.listen(server, { log: false });

  server.listen(app.get('port'));

  return io;
}