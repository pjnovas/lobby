
var expect = require('expect.js')
  , io = require('socket.io-client')
  , config = require('./config')
  , socketURL = "http://" + config.host + ":" + config.port

var options ={
  transports: ['websocket'],
  'force new connection': true
};

module.exports = function(lobby){

  describe('Namespace /rooms', function(){

    before(function(){
      socketURL += "/rooms";
    });

    it('should emit when a user joins a room and connects to it', function(done){
      var 
        uid1 = 'uid1',
        uid2 = 'uid2',
        fireConnect = false,
        fireJoin = false;

      var room = lobby.create({
        seats: 3
      });

      room.join(uid1);

      var client_uid1 = io.connect(socketURL, options);
      
      client_uid1.on('room:user:join',function(data){
        expect(data.id).to.be.equal(uid2);
        fireJoin = true;
      });

      client_uid1.on('room:user:connect',function(data){
        expect(data.id).to.be.equal(uid2);
        fireConnect = true;
      });

      client_uid1.on('connect',function(data){

        client_uid1.emit('room:user:connect', {
          userId: uid1,
          roomId: room.id
        }, function(err){
          expect(err).to.not.be.ok();

          room.join(uid2);

          var client_uid2 = io.connect(socketURL, options);

          client_uid2.on('connect',function(data){

            client_uid2.emit('room:user:connect', {
              userId: uid2,
              roomId: room.id
            }, function(err){
              expect(err).to.not.be.ok();

              setTimeout(function(){
                expect(fireConnect).to.be.equal(true);
                expect(fireJoin).to.be.equal(true);

                client_uid1.disconnect();
                client_uid2.disconnect();
                room.clear();
                done(); 

              }, 50);
            });
          });
        });

      });

    });

    it('should emit when a user leaves a room and disconnects from it', function(done){
      var 
        uid1 = 'uid1',
        uid2 = 'uid2',
        fireDisconnect = false,
        fireLeave = false;

      var room = lobby.create({
        seats: 3
      });

      room.join(uid1);

      var client_uid1 = io.connect(socketURL, options);
      
      client_uid1.on('room:user:leave',function(data){
        expect(data.id).to.be.equal(uid2);
        fireLeave = true;
      });

      client_uid1.on('room:user:disconnect',function(data){
        expect(data.id).to.be.equal(uid2);
        fireDisconnect = true;
      });

      client_uid1.on('connect',function(data){
        
        client_uid1.emit('room:user:connect', {
          userId: uid1,
          roomId: room.id
        }, function(err){
          expect(err).to.not.be.ok();

          room.join(uid2);

          var client_uid2 = io.connect(socketURL, options);

          client_uid2.on('connect',function(data){

            client_uid2.emit('room:user:connect', {
              userId: uid2,
              roomId: room.id
            }, function(err){
              expect(err).to.not.be.ok();

              setTimeout(function(){

                client_uid2.disconnect();
                room.leave(uid2);
                
                setTimeout(function(){

                  expect(fireDisconnect).to.be.equal(true);
                  expect(fireLeave).to.be.equal(true);

                  client_uid1.disconnect();
                  client_uid2.disconnect();
                  room.clear();
                  done();

                }, 50);

              }, 50);
            });
          });
        });

      });

    });

    it('should emit when a room is full', function(done){
      var 
        uid1 = 'uid1',
        uid2 = 'uid2',
        uid3 = 'uid3',
        fireFull = false;

      var room = lobby.create({
        seats: 3
      });

      room.join(uid1);

      var client_uid1 = io.connect(socketURL, options);
      
      client_uid1.on('room:full',function(data){
        fireFull = true;
      });

      client_uid1.on('connect',function(err, data){
        expect(err).to.not.be.ok();

        client_uid1.emit('room:user:connect', {
          userId: uid1,
          roomId: room.id
        }, function(err){
          expect(err).to.not.be.ok();

          room.join(uid2);
          room.join(uid3);

          setTimeout(function(){

            expect(fireFull).to.be.equal(true);
            client_uid1.disconnect();
            done();

          }, 50);

        });

      });

    });

    it('should emit when a room is updated', function(done){
      var 
        uid1 = 'uid1',
        fireUpdate = 0;

      var room = lobby.create({
        seats: 3,
        custom: 1
      });

      room.join(uid1);

      var client_uid1 = io.connect(socketURL, options);
      
      client_uid1.on('room:update',function(){
        fireUpdate++;
      });

      function connectUser(client, uid, done){
        client.on('connect',function(err, data){
          expect(err).to.not.be.ok();

          client.emit('room:user:connect', {
            userId: uid,
            roomId: room.id
          }, done);
        });
      }

      connectUser(client_uid1, uid1, function(){

        expect(fireUpdate).to.be.equal(0);
        room.update({
          custom: 2
        });

        setTimeout(function(){

          expect(room.custom).to.be.equal(2);
          expect(fireUpdate).to.be.equal(1);
          
          client_uid1.disconnect();
          
          room.clear();
          done(); 

        }, 50);
      });

    });

    it('should emit when a room is ready', function(done){
      var 
        uid1 = 'uid1',
        uid2 = 'uid2',
        uid3 = 'uid3',
        fireReady = 0,
        fireStart = 0;

      var room = lobby.create({
        seats: 3
      });

      room.join(uid1);

      var client_uid1 = io.connect(socketURL, options);
      var client_uid2;
      var client_uid3;
      
      client_uid1.on('room:ready',function(){
        fireReady++;
      });

      client_uid1.on('room:start',function(){
        fireStart++;
      });

      function connectUser(client, uid, done){
        client.on('connect',function(err, data){
          expect(err).to.not.be.ok();

          client.emit('room:user:connect', {
            userId: uid,
            roomId: room.id
          }, done);
        });
      }

      connectUser(client_uid1, uid1, function(){

        room.join(uid2);
        room.join(uid3);

        expect(fireReady).to.be.equal(0);

        client_uid2 = io.connect(socketURL, options);
        connectUser(client_uid2, uid2, function(){
          
          expect(fireReady).to.be.equal(0);

          client_uid3 = io.connect(socketURL, options);
          connectUser(client_uid3, uid3, function(){

            setTimeout(function(){

              expect(fireReady).to.be.equal(1);
              expect(fireStart).to.be.equal(0);
              
              client_uid1.disconnect();
              client_uid2.disconnect();
              client_uid3.disconnect();
              
              room.clear();
              done(); 

            }, 50);
          });
        });
      });

    });

    it('should emit when a room is destroyed', function(done){
      var 
        uid1 = 'uid1',
        fireDestroy = false;

      var room = lobby.create({
        seats: 3
      });

      room.join(uid1);

      var client_uid1 = io.connect(socketURL, options);
      
      client_uid1.on('room:destroy',function(data){
        fireDestroy = true;
      });

      client_uid1.on('connect',function(data){
        
        client_uid1.emit('room:user:connect', {
          userId: uid1,
          roomId: room.id
        }, function(err){
          expect(err).to.not.be.ok();

          room.destroy();

          setTimeout(function(){

            expect(fireDestroy).to.be.equal(true);

            client_uid1.disconnect();
            room.clear();
            done(); 
            
          }, 50);

        });

      });

    });

    it('should throw an error if the room is not found on join', function(done){
      var 
        uid1 = 'uid1',
        fakeRoomId = 'xxxxx';

      var client_uid1 = io.connect(socketURL, options);

      client_uid1.on('connect',function(data){
        
        client_uid1.emit('room:user:connect', {
          userId: uid1,
          roomId: fakeRoomId
        }, function(err, users){

          expect(err).to.be.ok();
          expect(err.code).to.be.equal('RoomNotFound');

          client_uid1.disconnect();
          done();
        });

      });

    });

    it('should throw an error if the user is not joined on the room', function(done){
      var 
        uid1 = 'uid1';

      var room = lobby.create({
        seats: 3
      });

      var client_uid1 = io.connect(socketURL, options);

      client_uid1.on('connect',function(data){
        
        client_uid1.emit('room:user:connect', {
          userId: uid1,
          roomId: room.id
        }, function(err, users){

          expect(err).to.be.ok();
          expect(err.code).to.be.equal('UserNotFound');

          client_uid1.disconnect();
          done();
        });

      });

    });

    it('should emit start when a room is full and startOnFull is true', function(done){
      var 
        uid1 = 'uid1',
        uid2 = 'uid2',
        uid3 = 'uid3',
        fireStart = false;

      var room = lobby.create({
        seats: 3,
        startOnFull: true
      });

      room.join(uid1);

      var client_uid1 = io.connect(socketURL, options);
      
      client_uid1.on('room:start',function(data){
        fireStart = true;
      });

      client_uid1.on('connect',function(data){
        
        client_uid1.emit('room:user:connect', {
          userId: uid1,
          roomId: room.id
        }, function(err){
          expect(err).to.not.be.ok();

          room.join(uid2);
          room.join(uid3);

          setTimeout(function(){

            expect(fireStart).to.be.equal(true);

            client_uid1.disconnect();
            done(); 

          }, 50);

        });

      });

    });

    it('should emit start when a room is full and startOnReady is true', function(done){
      var 
        uid1 = 'uid1',
        uid2 = 'uid2',
        uid3 = 'uid3',
        fireReady = 0,
        fireStart = 0;

      var room = lobby.create({
        seats: 3,
        startOnReady: true
      });

      room.join(uid1);

      var client_uid1 = io.connect(socketURL, options);
      var client_uid2;
      var client_uid3;
      
      client_uid1.on('room:ready',function(){
        fireReady++;
      });

      client_uid1.on('room:start',function(){
        fireStart++;
      });

      function connectUser(client, uid, done){
        client.on('connect',function(err, data){
          expect(err).to.not.be.ok();

          client.emit('room:user:connect', {
            userId: uid,
            roomId: room.id
          }, done);
        });
      }

      connectUser(client_uid1, uid1, function(){

        room.join(uid2);
        room.join(uid3);

        client_uid2 = io.connect(socketURL, options);
        connectUser(client_uid2, uid2, function(){
  
          client_uid3 = io.connect(socketURL, options);
          connectUser(client_uid3, uid3, function(){

            setTimeout(function(){

              expect(fireReady).to.be.equal(1);
              expect(fireStart).to.be.equal(1);
              
              client_uid1.disconnect();
              client_uid2.disconnect();
              client_uid3.disconnect();
              room.clear();
              done(); 

            }, 50);
          });
        });
      });

    });

    it('should allow to use custom events', function(done){
      var 
        uid1 = 'uid1',
        uid2 = 'uid2',
        uid3 = 'uid3',
        fireCustomUid1 = 0,
        fireCustomUid2 = 0,
        fireCustomUid3 = 0,
        message = 'hello custom events!';

      var room = lobby.create({
        seats: 3
      });

      room.join(uid1);
      room.join(uid2);
      room.join(uid3);

      var client_uid1 = io.connect(socketURL, options);
      var client_uid2;
      var client_uid3;

      function connectUser(client, uid, done){
        client.on('connect',function(err, data){
          expect(err).to.not.be.ok();

          client.emit('room:user:connect', {
            userId: uid,
            roomId: room.id
          }, done);
        });
      }

      connectUser(client_uid1, uid1, function(){

        client_uid2 = io.connect(socketURL, options);
        connectUser(client_uid2, uid2, function(){
  
          client_uid3 = io.connect(socketURL, options);
          connectUser(client_uid3, uid3, function(){

            client_uid1.on('custom:message', function(data){
              fireCustomUid1++;
              expect(data).to.be.an('object');
              expect(data.xdata.uid).to.be.equal('uid2');
              expect(data.xdata.message).to.be.equal(message);
            });

            client_uid2.on('custom:message', function(data){
              fireCustomUid2++;
            });

            client_uid3.on('custom:message', function(data){
              fireCustomUid3++;
              expect(data).to.be.an('object');
              expect(data.xdata.uid).to.be.equal('uid2');
              expect(data.xdata.message).to.be.equal(message);
            });

            client_uid2.emit('custom:message', {
              uid: uid2,
              message: message
            }, function(err){
              expect(err).to.not.be.ok();

              setTimeout(function(){

                expect(fireCustomUid1).to.be.equal(1);
                expect(fireCustomUid2).to.be.equal(0);
                expect(fireCustomUid3).to.be.equal(1);
                
                client_uid2.emit('custom:message', {
                  invalid: true
                }, function(err){
                  expect(err).to.be.equal('error thrown');

                  setTimeout(function(){                  

                    expect(fireCustomUid1).to.be.equal(1);
                    expect(fireCustomUid2).to.be.equal(0);
                    expect(fireCustomUid3).to.be.equal(1);

                    client_uid1.disconnect();
                    client_uid2.disconnect();
                    client_uid3.disconnect();

                    room.clear();
                    done(); 
                  }, 50);
                });
                
              }, 50);

            });
          });
        });
      });

    });

    it('should auto remove a user when it get disconnected', function(done){
      var 
        uid1 = 'uid12',
        uid2 = 'uid22',
        fireDisconnect = false,
        fireLeave = false;

      var room = lobby.create({
        seats: 3
      });

      room.join(uid1);

      var client_uid1 = io.connect(socketURL, options);
      
      client_uid1.on('room:user:leave',function(data){
        expect(data.id).to.be.equal(uid2);
        fireLeave = true;
      });

      client_uid1.on('room:user:disconnect',function(data){
        expect(data.id).to.be.equal(uid2);
        fireDisconnect = true;
      });

      client_uid1.on('connect',function(data){
        
        client_uid1.emit('room:user:connect', {
          userId: uid1,
          roomId: room.id
        }, function(err){
          expect(err).to.not.be.ok();

          room.join(uid2);

          var client_uid2 = io.connect(socketURL, options);

          client_uid2.on('connect',function(data){

            client_uid2.emit('room:user:connect', {
              userId: uid2,
              roomId: room.id
            }, function(err){
              expect(err).to.not.be.ok();

              client_uid2.disconnect();

              setTimeout(function(){

                expect(fireDisconnect).to.be.equal(true);
                expect(fireLeave).to.be.equal(true);

                client_uid1.disconnect();
                room.clear();
                done();

              }, 600);
            });
          });
        });

      });

    });

  });

  
};
