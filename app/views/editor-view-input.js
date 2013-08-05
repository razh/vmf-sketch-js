define(
  [ 'config',
    'models/editor-state',
    'models/rect',
    'input/mouse' ],
  function( Config, State, Rect, Mouse ) {
    'use strict';

    /**
     * Input helper class for EditorView.
     */
    var EditorViewInput = function( element, editor, level ) {
      var mouse = new Mouse();

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
      var DefaultState = {
        mousedown: function() {
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

              editor.set( 'state', State.SELECT );
              return;
            }
          }

          // Otherwise, start drawing.
          editor.set( 'state', State.DRAW );
        }
      };

      var DrawState = {
        mousemove: function() {
          editor.trigger( 'change' );
        },

        mouseup: function() {
          var x = mouse.start.x,
              y = mouse.start.y,
              width  = mouse.end.x - x,
              height = mouse.end.y - y;

          level.add(new Rect({
            x: x,
            y: y,
            width: width,
            height: height
          }));

          editor.set( 'state', State.DEFAULT );
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
          editor.set( 'state', State.DEFAULT );
        }
      };

      var states = [];

      states[ State.DEFAULT ] = DefaultState;
      states[ State.DRAW    ] = DrawState;
      states[ State.SELECT  ] = SelectState;

      // Helper function for accessing a specific event in each state.
      function handleState( eventName ) {
        var stateHandler = states[ editor.get( 'state' ) ],
            eventHandler;

        // Call the eventHandler function if it exists.
        if ( stateHandler && ( eventHandler = stateHandler[ eventName ] ) ) {
          eventHandler();
        }
      }

      // Input handlers.
      return {
        mouse: mouse,

        mousedown: function( event ) {
          mouse.down = true;

          mouse.start = position( event );
          mouse.end = mouse.start;

          handleState( 'mousedown' );
        },

        mousemove: function( event ) {
          mouse.end = position( event );

          handleState( 'mousemove' );
        },

        mouseup: function() {
          mouse.down = false;

          handleState( 'mouseup' );

          mouse.start.x = Number.NaN;
          mouse.start.y = Number.NaN;

          mouse.end.x = Number.NaN;
          mouse.end.y = Number.NaN;
        }
      };
    };

    return EditorViewInput;
  }
);
