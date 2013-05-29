
var expect = require('expect.js'),
  _ = require('underscore'),
  RoomManager = require('../../lib'),
  roomStatus = require('../../lib/roomStatus')
  Room = require('../../lib/Room');

describe('Room', function(){
  var roomManager = new RoomManager();

  var seats = 5;
  var room = roomManager.create({
    seats: seats
  });

  it('should allow to join a user', function(){
    var idx = 0,
      joinCalls = 0,
      fullCalled = false;

    expect(room.freeSeats()).to.be(seats);

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
      expect(room.freeSeats()).to.be(seats - idx);
    });

    expect(fullCalled).to.be.ok();

    expect(room.freeSeats()).to.be(0);
    expect(joinCalls).to.be.equal(seats);
    expect(room.isFull()).to.be.ok();
    expect(room.isEmpty()).to.not.be.ok();

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

  it('should fire an start event after the room is full and auto-start');/*, function(){
    var idx = 0,
      joinCalls = 0,
      fullCalled = false,
      startCalls = false;

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
*/
  it('should allow to be destroyed', function(){
    var emitted = false;

    roomManager.on('room:destroy', function(){
      emitted = true;
    });

    var rid = room.id;
    room.destroy();

    expect(emitted).to.be.equal(true);

    var found = roomManager.getById(rid);
    expect(found).to.not.be.ok();

    roomManager.removeAllListeners('room:destroy');
  });

});