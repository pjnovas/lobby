
var expect = require('expect.js'),
  _ = require('underscore'),
  RoomManager = require('../lib'),
  Room = require('../lib/Room');

describe('RoomManager', function(){
  var roomManager = new RoomManager();

  it('should allow to create a room', function(){
    var emitted = false;
  
    roomManager.on('room:create', function(){
      emitted = true;
    });

    var room = roomManager.create({
      myprop: {
        hello: 'world'
      }
    });

    expect(emitted).to.be.equal(true);

    expect(room).to.be.a(Room);
    expect(room.id).to.be.greaterThan(0);
    expect(room.myprop).to.be.a('object');
    expect(room.myprop.hello).to.be.equal('world');
  });

  describe('Room', function(){
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
    });

  });

});