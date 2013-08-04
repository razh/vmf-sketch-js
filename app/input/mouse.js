define(function() {
  'use strict';

  // Mouse state container.
  var Mouse = {
    start: {
      x: null,
      y: null
    },

    end: {
      x: null,
      y: null
    },

    down: false
  };

  return Mouse;
});
