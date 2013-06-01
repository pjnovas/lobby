
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

  it('should have a method router', function(){
    expect(lobby.router).to.be.a('function');
  });

  var app = createExpressApp();

  var lobby = new Lobby();

  it('should throw an error if no function is specify for requests', function(){
    expect(function(){
      lobby.router(app);
    }).to.throwError('expected a function as second parameter of Lobby.router()');
  });

  lobby.router(app, function(req, res, next){
    req.roomUser = {
      id: req.get('user')
    };

    next();
  });
  
  require('./room');
});

function createExpressApp(){
  var app = express();
  
  app.set('port', process.env.PORT || config.port);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);

  server = http.createServer(app);

  server.listen(app.get('port'));

  return app;
}