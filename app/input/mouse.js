define(function() {
  'use strict';

  function Mouse() {
    this.start = {
      x: Number.NaN,
      y: Number.NaN
    };

    this.end = {
      x: Number.NaN,
      y: Number.NaN
    };

    this.down = false;
    this.direction = null;
  }

  return Mouse;
});
