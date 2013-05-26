
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
        expect(data.uid).to.be.equal(uid2);
        fireJoin = true;
      });

      client_uid1.on('room:user:connect',function(data){
        expect(data.uid).to.be.equal(uid2);
        fireConnect = true;
      });

      client_uid1.on('connect',function(data){

        client_uid1.emit('room:user:connect', {
          userId: uid1,
          roomId: room.id
        }, function(){

          room.join(uid2);

          var client_uid2 = io.connect(socketURL, options);

          client_uid2.on('connect',function(data){

            client_uid2.emit('room:user:connect', {
              userId: uid2,
              roomId: room.id
            }, function(){

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
        expect(data.uid).to.be.equal(uid2);
        fireLeave = true;
      });

      client_uid1.on('room:user:disconnect',function(data){
        expect(data.uid).to.be.equal(uid2);
        fireDisconnect = true;
      });

      client_uid1.on('connect',function(data){
        
        client_uid1.emit('room:user:connect', {
          userId: uid1,
          roomId: room.id
        }, function(){

          room.join(uid2);

          var client_uid2 = io.connect(socketURL, options);

          client_uid2.on('connect',function(data){

            client_uid2.emit('room:user:connect', {
              userId: uid2,
              roomId: room.id
            }, function(){

              setTimeout(function(){

                client_uid2.disconnect();
                room.leave(uid2);
                
                setTimeout(function(){

                  expect(fireDisconnect).to.be.equal(true);
                  expect(fireLeave).to.be.equal(true);

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

      client_uid1.on('connect',function(data){
        
        client_uid1.emit('room:user:connect', {
          userId: uid1,
          roomId: room.id
        }, function(){

          room.join(uid2);
          room.join(uid3);

          setTimeout(function(){

            expect(fireFull).to.be.equal(true);
            done(); 

          }, 50);

        });

      });

    });

  });

};
