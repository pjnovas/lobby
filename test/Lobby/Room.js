
var expect = require('expect.js')
  , _ = require('underscore')
  , RoomManager = require('../../lib')
  , roomStatus = require('../../lib/roomStatus')
  , Room = require('../../lib/Room');

var UserNotFoundError = require('../../lib/errors/UserNotFound')
  , UserAlreadyInRoomError = require('../../lib/errors/UserAlreadyInRoom')
  , InvalidUserOrIdError = require('../../lib/errors/InvalidUserOrId')
  , RoomFullError = require('../../lib/errors/RoomFull')
  , NotOwnerError = require('../../lib/errors/NotOwner');

describe('Room', function(){
  var roomManager = new RoomManager();

  var seats = 5;
  var room = roomManager.create({
    seats: seats
  });

  it('should validate user when joins or leaves a room', function(){

    function validate(e) {
      expect(e).to.be.a(InvalidUserOrIdError);
    }

    expect(function(){
      room.join();
    }).to.throwError(validate);

    expect(function(){
      room.join({});
    }).to.throwError(validate);

    expect(function(){
      room.join({ id: {} });
    }).to.throwError(validate);

    expect(function(){
      room.join({ id: [] });
    }).to.throwError(validate);

    expect(function(){
      room.leave();
    }).to.throwError(validate);

    expect(function(){
      room.leave({});
    }).to.throwError(validate);

    expect(function(){
      room.leave({ id: {} });
    }).to.throwError(validate);

    expect(function(){
      room.leave({ id: [] });
    }).to.throwError(validate);

  });

  it('should allow to join a user', function(){
    var idx = 0,
      joinCalls = 0,
      fullCalled = false;

    expect(room.freeSeats()).to.be(seats);
    expect(room.autoStart).to.be(false);

    room.on('user:join', function(){
      joinCalls++;
    });

    room.on('room:full', function(){
      expect(idx).to.be.equal(seats);
      fullCalled = true;
    });

    _.times(5, function(i){
      idx++;
      room.join(i+1);

      if (idx < seats){
        expect(function(){
          room.join(i+1);
        }).to.throwError(function (e) {
          expect(e).to.be.a(UserAlreadyInRoomError);
        });
      }

      expect(room.freeSeats()).to.be(seats - idx);
    });

    expect(fullCalled).to.be.ok();

    expect(room.freeSeats()).to.be(0);
    expect(joinCalls).to.be.equal(seats);
    expect(room.isFull()).to.be.ok();
    expect(room.isEmpty()).to.not.be.ok();

    expect(function(){
      room.join('uid15');
    }).to.throwError(function (e) {
      expect(e).to.be.a(RoomFullError);
    });

    room.removeAllListeners('user:join');
    room.removeAllListeners('room:full');
  });

  it('should allow to leave a user', function(){
    var idx = seats,
      leaveCalls = 0,
      emptyCalled = false;

    room.on('user:leave', function(){
      leaveCalls++;
    });

    room.on('room:empty', function(){
      expect(idx).to.be.equal(0);
      emptyCalled = true;
    });

    _.times(5, function(i){
      idx--;
      room.leave(i+1);

      if (idx > 0){
        expect(function(){
          room.leave(i+1);
        }).to.throwError(function (e) {
          expect(e).to.be.a(UserNotFoundError);
        });
      }

      expect(room.freeSeats()).to.be(seats - idx); 
    });

    expect(emptyCalled).to.be.ok();
    expect(room.freeSeats()).to.be(seats); 
    expect(leaveCalls).to.be.equal(seats);
    expect(room.isFull()).to.not.be.ok();
    expect(room.isEmpty()).to.be.ok();
    room.clear();

    room.removeAllListeners('user:leave');
    room.removeAllListeners('room:empty');
  });


  it('should allow to return a JSON representation of itself', function(){
    var idx = 0,
      leaveCalls = 0,
      emptyCalled = false;

    _.times(2, function(i){
      idx++;
      room.join(i+1);
    });

    var jsonRoom = room.toJSON();

    expect(jsonRoom).to.have.property('id');
    expect(jsonRoom.owner).to.be.equal('system');
    expect(jsonRoom.seats.total).to.be.equal(seats);
    expect(jsonRoom.seats.taken).to.be.equal(idx);
    
    expect(jsonRoom.users).to.be.an('array');
    expect(jsonRoom.users.length).to.be.equal(idx);

    expect(jsonRoom.users[0].id).to.be.equal(1);
    expect(jsonRoom.users[1].id).to.be.equal(2);

    room.clear();
  });

  it('should allow to be destroyed', function(){
    var emitted = false;

    room.on('room:destroy', function(){
      emitted = true;
    });

    var rid = room.id;
    room.destroy();

    expect(emitted).to.be.equal(true);

    var found = roomManager.getById(rid);
    expect(found).to.not.be.ok();
  });

  it('should self-destroy as default when the room is empty', function(){
    var emitted = false;

    var room = roomManager.create({
      seats: 2
    });

    room.on('room:destroy', function(){
      emitted = true;
    });

    room.join('uid1');
    room.join('uid2');

    room.leave('uid1');
    room.leave('uid2');

    expect(emitted).to.be.equal(true);

    var rid = room.id;
    var found = roomManager.getById(rid);
    expect(found).to.not.be.ok();
  });

  it('should NOT self-destroy if autoDestroy is disabled', function(){
    var emitted = false;

    var room = roomManager.create({
      seats: 2,
      autoDestroy: false
    });

    room.on('room:destroy', function(){
      emitted = true;
    });

    room.join('uid1');
    room.join('uid2');

    room.leave('uid1');
    room.leave('uid2');

    expect(emitted).to.be.equal(false);

    var rid = room.id;
    var found = roomManager.getById(rid);
    expect(found).to.be.ok();
    expect(found.id).to.be.equal(rid);
  });

  it('should fire an start event after the room is full and auto-start is true', function(){
    var idx = 0,
      joinCalls = 0,
      fullCalled = false,
      startCalls = false;

    var room = roomManager.create({
      seats: seats,
      autoStart: true
    });

    expect(room.freeSeats()).to.be(seats);

    room.on('user:join', function(){
      joinCalls++;
    });

    room.on('room:full', function(){
      expect(idx).to.be.equal(seats);
      fullCalled = true;
    });

    room.on('room:start', function(){
      expect(idx).to.be.equal(seats);
      startCalls = true;
    });

    _.times(5, function(i){
      idx++;
      room.join(i+1);
      expect(room.freeSeats()).to.be(seats - idx);
    });

    expect(fullCalled).to.be.ok();

    expect(room.freeSeats()).to.be(0);
    expect(joinCalls).to.be.equal(seats);
    expect(startCalls).to.be.equal(true);
    expect(room.isFull()).to.be.ok();
    expect(room.isEmpty()).to.not.be.ok();

    room.removeAllListeners('user:join');
    room.removeAllListeners('room:full');
    room.removeAllListeners('room:start');
  });

  it('should NOT fire an start event after the room is full by default', function(){
    var idx = 0,
      startCalls = false;

    var room = roomManager.create({
      seats: seats
    });

    room.on('room:start', function(){
      expect(idx).to.be.equal(seats);
      startCalls = true;
    });

    _.times(5, function(i){
      idx++;
      room.join(i+1);
    });

    expect(startCalls).to.be.equal(false);
    room.removeAllListeners('room:start');
  });

  it('should change the state to STARTED and fire start event when start() is called', function(){
    var idx = 0,
      startCalls = false;

    var room = roomManager.create({
      seats: seats
    });

    room.on('room:start', function(){
      expect(idx).to.be.equal(seats);
      startCalls = true;
    });

    _.times(5, function(i){
      idx++;
      room.join(i+1);
    });

    expect(startCalls).to.be.equal(false);

    room.start();
    expect(startCalls).to.be.equal(true);
    expect(room.status).to.be.equal(roomStatus.STARTED);
    room.removeAllListeners('room:start');
  });

  it('should only allow owner (if is specified) to run a room start when autostart is false', function(){
    var idx = 0,
      startCalls = false;

    var room = roomManager.create({
      seats: seats,
      owner: 'uid1'
    });

    room.on('room:start', function(){
      expect(idx).to.be.equal(seats);
      startCalls = true;
    });

    _.times(5, function(i){
      idx++;
      room.join(i+1);
    });

    expect(function(){
      room.start();
    }).to.throwError(function (e) {
      expect(e).to.be.a(NotOwnerError);
    });

    expect(startCalls).to.be.equal(false);
    expect(room.status).to.be.equal(roomStatus.READY);

    room.start('uid1');
    expect(startCalls).to.be.equal(true);
    expect(room.status).to.be.equal(roomStatus.STARTED);
    room.removeAllListeners('room:start');
  });

});