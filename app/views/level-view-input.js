define(
  [ 'config',
    'models/rect',
    'input/mouse' ],
  function( Config, Rect, Mouse ) {
    'use strict';

    var State = {
      NONE: 0,
      DRAW: 1,
      SELECT: 2
    };

    var LevelViewInput = function( element, level ) {
      var mouse = new Mouse(),
          state = State.NONE;

      // Array of selected objects.
      var selected = [];
      // Offsets of selected objects.
      var offsets = [];

      /**
       * Calculate relative position of MouseEvent on element.
       */
      function position( event ) {
        return {
          x: event.pageX - element.offsetLeft,
          y: event.pageY - element.offsetTop
        };
      }

      // Various LevelView input states.
      var NoneState = {
        mousedown: function() {
          state = State.DRAW;

          // Hit test for rects.
          var rect;
          for ( var i = 0, l = level.size(); i < l; i++ ) {
            rect = level.get(i);

            if ( rect.contains( mouse.end.x, mouse.end.y ) ) {
              selected = [ rect ];
              offsets = [{
                x: rect.get( 'x' ),
                y: rect.get( 'y' )
              }];

              state = State.SELECT;
              break;
            }
          }
        }
      };

      var DrawState = {
        mouseup: function() {
          var x = mouse.start.x,
              y = mouse.start.y,
              width  = mouse.end.x - x,
              height = mouse.end.y - y;

          level.add( new Rect( x, y, width, height ) );
          state = State.NONE;
        }
      };

      var SelectState = {
        mousemove: function() {
          var min = {
            x: Number.POSITIVE_INFINITY,
            y: Number.POSITIVE_INFINITY
          };

          var dx = mouse.end.x - mouse.start.x,
              dy = mouse.end.y - mouse.start.y;

          selected.forEach(function( object, index ) {
            object.set( 'x', offsets[ index ].x + dx );
            object.set( 'y', offsets[ index ].y + dy );

            // Find the closest rectangle.
            level.each(function( rect ) {
              if ( object.id === rect.id ) {
                return;
              }

              var d = object.distanceTo( rect );

              if ( Math.abs( d.x ) < Math.abs( min.x ) ) {
                min.x = d.x;
              }

              if ( Math.abs( d.y ) < Math.abs( min.y ) ) {
                min.y = d.y;
              }
            });

            // If within snapping distance, snap to nearest edge.
            if ( Math.abs( min.x ) < Config.snap ) {
              object.set( 'x', object.get( 'x' ) + min.x );
            }

            if ( Math.abs( min.y ) < Config.snap ) {
              object.set( 'y', object.get( 'y' ) + min.y );
            }
          });

          level.trigger( 'change' );
        },

        mouseup: function() {
          selected = [];
          offsets = [];
          state = State.NONE;
        }
      };

      // Input handlers.
      return {
        mousedown: function( event ) {
          mouse.down = true;

          mouse.start = position( event );
          mouse.end = mouse.start;

          switch ( state ) {
            case State.NONE:
              NoneState.mousedown();
              break;
          };
        },

        mousemove: function( event ) {
          mouse.end = position( event );

          switch ( state ) {
            case State.SELECT:
              SelectState.mousemove();
              break;
          }
        },

        mouseup: function() {
          mouse.down = false;

          mouse.start.x = Number.NaN;
          mouse.start.y = Number.NaN;

          mouse.end.x = Number.NaN;
          mouse.end.y = Number.NaN;

          switch ( state ) {
            case State.DRAW:
              DrawState.mouseup();
              break;

            case State.SELECT:
              SelectState.mouseup();
              break;
          }
        }
      };
    };

    return LevelViewInput;
  }
);
