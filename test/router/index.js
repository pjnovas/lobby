
var expect = require('expect.js');

var express = require('express')
  , http = require('http')
  , path = require('path')
  , config = require('./config')
  , Lobby = require('../../lib');

var server;

describe('Router', function(){

  after(function(done){
    server.close(done);
  });

  var app = createExpressApp();

  var lobby = new Lobby();
  lobby.router(app);
  
  require('./room');
});

function createExpressApp(){
  var app = express();
  
  app.set('port', process.env.PORT || config.port);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);

  server = http.createServer(app);

  server.listen(app.get('port'), function(){
    console.log('TEST Express server listening on port ' + app.get('port'));
  });

  return app;
}