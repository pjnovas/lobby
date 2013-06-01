
var expect = require('expect.js')
  , request = require('request')
  , config = require('./config')
  , baseURL = "http://" + config.host + ":" + config.port

request = request.defaults({ json: true });

describe('/rooms', function(){
  
  var uri = baseURL + '/rooms';

  function createRoom(uid, rconfig, done){
    request.post({ uri: uri, headers: { user: uid }, body: rconfig }, function (error, response, body) {
      done(response.body.id);
    });
  }

  it('GET - should retrieve all current rooms', function(done){
    
    createRoom('uid1', { seats: 15, custom: 2.5 }, function(rid){

      request.get(uri, function (error, response, body) {
        expect(error).to.not.be.ok();
        expect(response.statusCode).to.be.equal(200);
        
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.be.equal(1);

        var room = response.body[0];

        expect(room.id).to.be.equal(rid);
        expect(room.seats.total).to.be.equal(15);
        expect(room.seats.taken).to.be.equal(1);
        expect(room.custom).to.be.equal(2.5);

        done();     
      });
    });
  });

  it('POST - should create a room, add the owner and retrieve it', function(done){
    
    var uid = 'uid1';
    var reqBody = {
      seats: 4
    };

    request.post({ uri: uri, headers: { user: uid }, body: reqBody }, 
      function (error, response, body) {
        expect(error).to.not.be.ok();
        expect(response.statusCode).to.be.equal(200);
        
        expect(response.body).to.be.an('object');
        
        var room = response.body;

        expect(room).to.have.property('id');
        expect(room.owner).to.be.equal('uid1');
        expect(room.seats.total).to.be.equal(4);
        expect(room.seats.taken).to.be.equal(1);

        expect(room.users[0].id).to.be.equal('uid1');

        done();
      });

  });

  describe('/:roomId', function(){
  
    var baseURI = baseURL + '/rooms',
      uri = baseURL + '/rooms',
      seats = 5,
      owner = 'uid1',
      roomId;

    before(function(done){
      createRoom(owner, {
        seats: seats,
        my: 'property'
      },function(rId){
        roomId = rId;
        uri += '/' + roomId;
        done();
      });
    });

    it('GET - should retrieve a room', function(done){
      
      request.get(uri, function (error, response, body) {
        expect(error).to.not.be.ok();
        expect(response.statusCode).to.be.equal(200);

        expect(response.body).to.be.an('object');
        expect(response.body.id).to.be.equal(roomId);
        expect(response.body.my).to.be.equal('property');
        done();     
      });

    });

    it('GET - should retrieve a NOT FOUND', function(done){
      
      request.get(baseURI + '/555', function (error, response, body) {
        expect(error).to.not.be.ok();
        expect(response.statusCode).to.be.equal(404);
        done();     
      });

    });

    it('PUT - should be able to update room properties', function(done){

      request.put({ uri: uri, headers: { user: owner }, body: {
        id: 'newId', //should not be replaced
        my: 'new-property'
      }}, function (error, response, body) {
        expect(error).to.not.be.ok();
        expect(response.statusCode).to.be.equal(200);

        expect(response.body).to.be.an('object');
        expect(response.body.id).to.not.be.equal('newId');
        expect(response.body.id).to.be.equal(roomId);
        expect(response.body.my).to.be.equal('new-property');
        done();     
      });
    });

    it('PUT - should NOT be allowed to update room properties other than the owner', function(done){

      request.put({ uri: uri, headers: { user: 'uidXX' }, body: {
        id: 'newId', //should not be replaced
        my: 'new-property'
      }}, function (error, response, body) {
        expect(error).to.not.be.ok();
        expect(response.statusCode).to.be.equal(403);

        done();     
      });
    });

    it('DELETE - should remove a room', function(done){
      
      request.del(uri, function (error, response, body) {
        expect(error).to.not.be.ok();
        expect(response.statusCode).to.be.equal(204);
        done();     
      });
    
    });

    it('DELETE - should retrieve a NOT FOUND', function(done){
      
      request.del(baseURI + '/555', function (error, response, body) {
        expect(error).to.not.be.ok();
        expect(response.statusCode).to.be.equal(404);
        done();     
      });

    });

    describe('/users', function(){
      var usersUri;
      var uri = baseURL + '/rooms';
      var uid = 'uid2';

      before(function(done){
        createRoom(owner, {
          seats: seats
        },function(roomId){
          uri += '/' + roomId;
          usersUri = uri + '/users';
          done();
        });
      });


      it('POST - should join a user to the room', function(done){
        request.post({ uri: usersUri, headers: { user: uid }}, 
          function (error, response, body) {
            expect(error).to.not.be.ok();
            expect(response.statusCode).to.be.equal(204);
            done();
          });
      });

      it('POST - should 404 if no room is found', function(done){
        request.post({ uri: baseURI + '/rooms/555/users', headers: { user: uid }}, 
          function (error, response, body) {
            expect(error).to.not.be.ok();
            expect(response.statusCode).to.be.equal(404);
            done();
          });
      });

      it('POST - should 400 if user is not specify', function(done){
        request.post({ uri: usersUri }, 
          function (error, response, body) {
            expect(error).to.not.be.ok();
            expect(response.statusCode).to.be.equal(400);
            done();
          });
      });

      describe('/:userId', function(){
        
        it('DELETE - should remove a user from the room', function(done){
          request.del(usersUri + '/' + uid, function (error, response, body) {
            expect(error).to.not.be.ok();
            expect(response.statusCode).to.be.equal(204);

            done();
          });

        });

        it('DELETE - should return 404 if no room is found', function(done){
      
          request.del(baseURI + '/rooms/555/users' + '/' + uid, function (error, response, body) {
            expect(error).to.not.be.ok();
            expect(response.statusCode).to.be.equal(404);

            done();
          });

        });

        it('DELETE - should return 404 if user is not in the room', function(done){
      
          request.del(usersUri + '/uid555', function (error, response, body) {
            expect(error).to.not.be.ok();
            expect(response.statusCode).to.be.equal(404);

            done();
          });

        });

      });

    });

  });

  describe('/queues', function(){

    var uri = baseURL + '/rooms/queues',
      seats = 3,
      uid = 'uid5',
      uid2 = 'uid6',
      lastRoomId;

    it('POST - should return a room queue with the user joined', function(done){
      request.post({ uri: uri, headers: { user: uid }, body: { seats: seats } }, 
        function (error, response, body) {
          expect(error).to.not.be.ok();
          expect(response.statusCode).to.be.equal(200);

          expect(response.body).to.be.an('object');
        
          var room = response.body;

          expect(room.owner).to.be.equal('queue');
          expect(room.seats.total).to.be.equal(3);
          expect(room.seats.taken).to.be.equal(1);

          expect(room.users[0].id).to.be.equal(uid);
          lastRoomId = room.id;

          done();
        });
    });

    it('POST - should return the previous room queue with the new user joined', function(done){
      request.post({ uri: uri, headers: { user: uid2 }, body: { seats: seats } }, 
        function (error, response, body) {
          expect(error).to.not.be.ok();
          expect(response.statusCode).to.be.equal(200);

          expect(response.body).to.be.an('object');
        
          var room = response.body;

          expect(room.id).to.be.equal(lastRoomId);
          expect(room.owner).to.be.equal('queue');
          expect(room.seats.total).to.be.equal(3);
          expect(room.seats.taken).to.be.equal(2);

          expect(room.users[0].id).to.be.equal(uid);
          expect(room.users[1].id).to.be.equal(uid2);

          done();
        });
    });

  });

});
