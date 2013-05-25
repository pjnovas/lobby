
var expect = require('expect.js');

var express = require('express')
  , http = require('http')
  , path = require('path')
  , config = require('./config')
  , RoomFactory = require('../../lib');

describe('Router', function(){

  var app = createExpressApp();

  var roomFactory = new RoomFactory();
  roomFactory.router(app);
  
  require('./room');
});

function createExpressApp(){
  var app = express();
  
  app.set('port', process.env.PORT || config.port);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);

  http.createServer(app).listen(app.get('port'), function(){
    console.log('TEST Express server listening on port ' + app.get('port'));
  });

  return app;
}