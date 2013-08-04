define(
  [ 'input/mouse' ],
  function( mouse ) {
    'use strict';

    var Input = {
      mousedown: function( event ) {
        mouse.start.x = event.pageX;
        mouse.start.y = event.pageY;
      },

      mousemove: function() {

      },

      mouseup: function() {

      }
    };

    return Input;
  }
);
