
var expect = require('expect.js')
  , request = require('request')
  , config = require('./config')
  , baseURL = "http://" + config.host + ":" + config.port

request = request.defaults({ json: true });

describe('/rooms', function(){
  
  var uri = baseURL + '/rooms';

  function createRoom(rconfig, done){
    request.post({ uri: uri, body: rconfig }, function (error, response, body) {
      done(response.body.id);
    });
  }

  it('GET - should retrieve all current rooms', function(done){
    
    request.get(uri, function (error, response, body) {
      expect(error).to.not.be.ok();
      expect(response.statusCode).to.be.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.equal(0);
      done();     
    });

  });

  it('POST - should create a room, add the owner and retrieve it', function(done){
    
    var reqBody = {
      uid: 'uid1',
      config: {
        seats: 4
      }
    };

    request.post({ uri: uri, body: reqBody }, 
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

  it('PUT - should not be allowed', function(done){
    
    request.put(uri, function (error, response, body) {
      expect(error).to.not.be.ok();
      expect(response.statusCode).to.be.equal(405);
      
      expect(response.headers).to.have.property('allow');
      expect(response.headers['allow']).to.be.equal('GET,POST');

      done();
    });

  });

  it('DELETE - should not be allowed', function(done){
    
    request.del(uri, function (error, response, body) {
      expect(error).to.not.be.ok();
      expect(response.statusCode).to.be.equal(405);
      
      expect(response.headers).to.have.property('allow');
      expect(response.headers['allow']).to.be.equal('GET,POST');

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
      createRoom({
        uid: owner,
        config: {
          seats: seats
        }
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

    it('POST - should not be allowed', function(done){
    
      request.post(uri, function (error, response, body) {
        expect(error).to.not.be.ok();
        expect(response.statusCode).to.be.equal(405);
        
        expect(response.headers).to.have.property('allow');
        expect(response.headers['allow']).to.be.equal('GET,DELETE');

        done();
      });

    });

    it('PUT - should be able to update room properties');
    it('PUT - should be able to start a room ONLY by Owner if not a system or queue');

    it('PUT - should not be allowed', function(done){
    
      request.put(uri, function (error, response, body) {
        expect(error).to.not.be.ok();
        expect(response.statusCode).to.be.equal(405);
        
        expect(response.headers).to.have.property('allow');
        expect(response.headers['allow']).to.be.equal('GET,DELETE');

        done();
      });

    });

    describe('/users', function(){
      var usersUri;
      var uri = baseURL + '/rooms';
      var uid = 'uid2';

      before(function(done){
        createRoom({
          uid: owner,
          config: {
            seats: seats
          }
        },function(roomId){
          uri += '/' + roomId;
          usersUri = uri + '/users';
          done();
        });
      });


      it('POST - should join a user to the room', function(done){
        request.post({ uri: usersUri, body: { uid: uid } }, 
          function (error, response, body) {
            expect(error).to.not.be.ok();
            expect(response.statusCode).to.be.equal(204);
            done();
          });

      });

      it('POST - should 404 if no room is found', function(done){
        request.post({ uri: baseURI + '/rooms/555/users', body: { uid: uid } }, 
          function (error, response, body) {
            expect(error).to.not.be.ok();
            expect(response.statusCode).to.be.equal(404);
            done();
          });
      });

      it('POST - should 400 if user is not specify', function(done){
        request.post({ uri: usersUri, body: { } }, 
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
      request.post({ uri: uri, body: { uid: uid, config:{ seats: seats }} }, 
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
      request.post({ uri: uri, body: { uid: uid2, config:{ seats: seats }} }, 
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
