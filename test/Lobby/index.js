
var expect = require('expect.js')
  , _ = require('underscore')
  , Lobby = require('../../lib')
  , roomStatus = require('../../lib/roomStatus')
  , Room = require('../../lib/Room');

var InvalidRoomOrIdError = require('../../lib/errors/InvalidRoomOrId')

describe('Lobby', function(){
  var lobby = new Lobby(),
    lastRoom;

  it('should validate room Id on getById', function(){

    function validate(e) {
      expect(e).to.be.a(InvalidRoomOrIdError);
    }

    expect(function(){
      lobby.getById();
    }).to.throwError(validate);

    expect(function(){
      lobby.getById({});
    }).to.throwError(validate);

    expect(function(){
      lobby.getById([]);
    }).to.throwError(validate);

  });

  it('should allow to create a room', function(){
    var emitted = false;
  
    lobby.on('room:create', function(){
      emitted = true;
    });

    var room = lobby.create({
      myprop: {
        hello: 'world'
      }
    });

    expect(emitted).to.be.equal(true);

    expect(room).to.be.a(Room);
    expect(room.id).to.be.ok();
    expect(room.myprop).to.be.a('object');
    expect(room.myprop.hello).to.be.equal('world');

    lastRoom = room;
    room.removeAllListeners('room:create');
    lobby.removeAllListeners('room:create');
  });

  it('should allow to get a room by Id', function(){
    var room = lobby.getById(lastRoom.id);
    expect(room).to.be.equal(lastRoom);
  });

  it('should allow to get current rooms as an array', function(){
    var rooms = lobby.getRooms();
    
    expect(rooms).to.be.an('array');
    expect(rooms.length).to.be.equal(1);
    expect(rooms[0].seats.total).to.be.a('number');
    expect(rooms[0].seats.taken).to.be.a('number');
  });

  it('should allow to destroy a room', function(){
    var emitted = false;
  
    lobby.on('room:destroy', function(){
      emitted = true;
    });

    var room = lobby.create({
      myprop: {
        hello: 'world'
      }
    });

    var rid = room.id;
    lobby.destroy(room);

    expect(emitted).to.be.equal(true);

    var found = lobby.getById(rid);
    expect(found).to.not.be.ok();

    room.removeAllListeners('room:destroy');
    lobby.removeAllListeners('room:destroy');
  });

  it('should allow to find or create a room queue with no options', function(){
    var emitted = false;
  
    lobby.on('room:create', function(){
      emitted = true;
    });

    var lenBefore = lobby.rooms.length;

    // 1. Run first Queue with user uid1 and no config
    var room = lobby.queue();
    room.join('uid1');

    // 2. Queue Room created with default config seats = 2
    //    and user uid1 has been joined
    expect(room.owner).to.be.equal('queue');
    expect(room.status).to.be.equal(roomStatus.WAITING);
    expect(room.users).to.have.property('uid1');
    var lenFirstAfter = lobby.rooms.length;
    expect(lenFirstAfter).to.be.equal(lenBefore + 1);

    room.destroy();
  });

  it('should allow to find or create a room queue', function(){
    var emitted = false;
  
    lobby.on('room:create', function(){
      emitted = true;
    });

    var lenBefore = lobby.rooms.length;

    // 1. Run first Queue with user uid1 and config seats = 3
    var room = lobby.queue({
      seats: 3
    });
    room.join('uid1');

    // 2. Queue Room created with config seats = 3
    //    and user uid1 has been joined
    expect(room.owner).to.be.equal('queue');
    expect(room.status).to.be.equal(roomStatus.WAITING);
    expect(room.users).to.have.property('uid1');
    var lenFirstAfter = lobby.rooms.length;
    expect(lenFirstAfter).to.be.equal(lenBefore + 1);

    var userJoined = false;
    room.on('user:join', function(){
      userJoined = true;
    });

    var roomFull = false;
    room.on('room:full', function(){
      roomFull = true;
    });

    // 3. Run another Queue with same config seats = 3
    var room2 = lobby.queue({
      seats: 3
    });
    room2.join('uid2');

    // 4. User gets joined to the first queue cause has the same config
    expect(roomFull).to.be.equal(false);
    expect(userJoined).to.be.equal(true);
    userJoined = false;
    expect(lobby.rooms.length).to.be.equal(lenFirstAfter);
    expect(room2.id).to.be.equal(room.id);

    // 5. Run another Queue but different config seats = 2
    var roomX = lobby.queue({
      seats: 2
    });
    roomX.join('uid3');

    // 6. New queue is created with only uid3 joined
    expect(roomX.id).to.not.be.equal(room.id);
    expect(lobby.rooms.length).to.be.equal(lenFirstAfter + 1);
    expect(roomX.users).to.have.property('uid3');
    expect(roomFull).to.be.equal(false);
    expect(userJoined).to.be.equal(false);

    // 7. Run another queue with config seats = 3 (first one)
    var room3 = lobby.queue({
      seats: 3
    });
    room3.join('uid4');

    // 8. First Queue join uid4 and fires full room event
    expect(lobby.rooms.length).to.be.equal(lenFirstAfter + 1);
    expect(room3.id).to.be.equal(room.id);
    expect(roomFull).to.be.equal(true);
    roomFull = false;
    expect(userJoined).to.be.equal(true);
    userJoined = false;
    expect(room.status).to.be.equal(roomStatus.FULL);

    // 9. Run a Queue with same config as first one: seats = 3
    var room1_2 = lobby.queue({
      seats: 3
    });
    room1_2.join('uid5');

    // 10. A new queue is created, since the last one was full
    expect(lobby.rooms.length).to.be.equal(lenFirstAfter + 2);
    expect(room1_2.id).to.not.be.equal(room.id);
    expect(room1_2.id).to.not.be.equal(roomX.id);
    expect(room1_2.users).to.have.property('uid5');
    expect(roomFull).to.be.equal(false);
    expect(userJoined).to.be.equal(false);
    
    room.removeAllListeners('user:join');
    room.removeAllListeners('room:full');
    lobby.removeAllListeners('room:create');
  });

  it('should expose all errors', function(){
    expect(Lobby.error.UserNotFound).to.be(require('../../lib/errors/UserNotFound'));
    expect(Lobby.error.RoomNotFound).to.be(require('../../lib/errors/RoomNotFound'));
    expect(Lobby.error.UserAlreadyInRoom).to.be(require('../../lib/errors/UserAlreadyInRoom'));
    expect(Lobby.error.InvalidUserOrId).to.be(require('../../lib/errors/InvalidUserOrId'));
    expect(Lobby.error.InvalidRoomOrId).to.be(require('../../lib/errors/InvalidRoomOrId'));
    expect(Lobby.error.RoomFull).to.be(require('../../lib/errors/RoomFull'));
    expect(Lobby.error.NotOwner).to.be(require('../../lib/errors/NotOwner'));
    expect(Lobby.error.RoomStatusNotFound).to.be(require('../../lib/errors/RoomStatusNotFound'));
    expect(Lobby.error.RoomStatusNotAllowed).to.be(require('../../lib/errors/RoomStatusNotAllowed'));
  });

  it('should allow to be destroyed', function(){
    var lobbyX = new Lobby();

    var room1 = lobbyX.create();
    var room2 = lobbyX.create();

    expect(lobbyX.rooms.length).to.be.equal(2);

    lobbyX.destroy();

    expect(lobbyX.rooms).to.not.be.ok();
  });

  require('./Room');

});