// numtel:pg
// MIT License, ben@latenightsketches.com
// lib/LivePg.js
var Future = Npm.require('fibers/future');

pg = Npm.require('pg');
LivePg = Npm.require('pg-live-select');
var SelectHandle = Npm.require('pg-live-select/lib/SelectHandle');

// Convert the LivePg.SelectHandle object into a cursor
SelectHandle.prototype._publishCursor = function(sub) {
  var self = this;
  var fut = new Future;

  sub.onStop(function(){
    self.stop();
  });

  // Send reset message (for code pushes)
  sub._session.send({
    msg: 'added',
    collection: sub._name,
    id: sub._subscriptionId,
    fields: { reset: true }
  });

  // Send aggregation of differences
  self.on('update', function(diff, rows){
    sub._session.send({
      msg: 'added',
      collection: sub._name,
      id: sub._subscriptionId,
      fields: { diff: diff }
    });

    if(sub._ready === false){
      fut['return']();
    }
  });

  // Fail on error
  self.on('error', function(error){
    if(!fut.isResolved()) {
      fut['throw'](error);
    }
  });

  return fut.wait()
}
