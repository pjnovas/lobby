
var expect = require('expect.js'),
  _ = require('underscore'),
  RoomFactory = require('../../lib'),
  roomStatus = require('../../lib/roomStatus')
  Room = require('../../lib/Room');

describe('RoomFactory', function(){
  var roomFactory = new RoomFactory(),
    lastRoom;

  it('should allow to create a room', function(){
    var emitted = false;
  
    roomFactory.on('room:create', function(){
      emitted = true;
    });

    var room = roomFactory.create({
      myprop: {
        hello: 'world'
      }
    });

    expect(emitted).to.be.equal(true);

    expect(room).to.be.a(Room);
    expect(room.id).to.be.greaterThan(0);
    expect(room.myprop).to.be.a('object');
    expect(room.myprop.hello).to.be.equal('world');

    lastRoom = room;
    room.removeAllListeners('room:create');
  });

  it('should allow to get a room by Id', function(){
    var room = roomFactory.getById(lastRoom.id);
    expect(room).to.be.equal(lastRoom);
  });

  it('should allow to destroy a room', function(){
    var emitted = false;
  
    roomFactory.on('room:destroy', function(){
      emitted = true;
    });

    var room = roomFactory.create({
      myprop: {
        hello: 'world'
      }
    });

    var rid = room.id;
    roomFactory.destroy(room);

    expect(emitted).to.be.equal(true);

    var found = roomFactory.getById(rid);
    expect(found).to.not.be.ok();

    room.removeAllListeners('room:destroy');
  });

  it('should allow to find or create a room queue', function(){
    var emitted = false;
  
    roomFactory.on('room:create', function(){
      emitted = true;
    });

    var lenBefore = roomFactory.rooms.length;

    // 1. Run first Queue with user uid1 and config seats = 3
    var room = roomFactory.queue('uid1', {
      seats: 3
    });

    // 2. Queue Room created with config seats = 3
    //    and user uid1 has been joined
    expect(room.owner).to.be.equal('queue');
    expect(room.status).to.be.equal(roomStatus.WAITING);
    expect(room.users).to.have.property('uid1');
    var lenFirstAfter = roomFactory.rooms.length;
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
    var room2 = roomFactory.queue('uid2', {
      seats: 3
    });    

    // 4. User gets joined to the first queue cause has the same config
    expect(roomFull).to.be.equal(false);
    expect(userJoined).to.be.equal(true);
    userJoined = false;
    expect(roomFactory.rooms.length).to.be.equal(lenFirstAfter);
    expect(room2.id).to.be.equal(room.id);

    // 5. Run another Queue but different config seats = 2
    var roomX = roomFactory.queue('uid3', {
      seats: 2
    });

    // 6. New queue is created with only uid3 joined
    expect(roomX.id).to.not.be.equal(room.id);
    expect(roomFactory.rooms.length).to.be.equal(lenFirstAfter + 1);
    expect(roomX.users).to.have.property('uid3');
    expect(roomFull).to.be.equal(false);
    expect(userJoined).to.be.equal(false);

    // 7. Run another queue with config seats = 3 (first one)
    var room3 = roomFactory.queue('uid4', {
      seats: 3
    });

    // 8. First Queue join uid4 and fires full room event
    expect(roomFactory.rooms.length).to.be.equal(lenFirstAfter + 1);
    expect(room3.id).to.be.equal(room.id);
    expect(roomFull).to.be.equal(true);
    roomFull = false;
    expect(userJoined).to.be.equal(true);
    userJoined = false;
    expect(room.status).to.be.equal(roomStatus.READY);

    // 9. Run a Queue with same config as first one: seats = 3
    var room1_2 = roomFactory.queue('uid5', {
      seats: 3
    });

    // 10. A new queue is created, since the last one was full (READY)
    expect(roomFactory.rooms.length).to.be.equal(lenFirstAfter + 2);
    expect(room1_2.id).to.not.be.equal(room.id);
    expect(room1_2.id).to.not.be.equal(roomX.id);
    expect(room1_2.users).to.have.property('uid5');
    expect(roomFull).to.be.equal(false);
    expect(userJoined).to.be.equal(false);
    

    room.removeAllListeners('user:join');
    room.removeAllListeners('room:full');
  });

  require('./Room');

});