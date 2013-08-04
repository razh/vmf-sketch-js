define(function() {
  'use strict';

  // Global unique id.
  var uid = 0;

  return {
    nextUid: function() {
      // Return and increment.
      return uid++;
    }
  };
});
