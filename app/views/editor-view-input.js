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
      function mousePosition( event ) {
        return {
          x: event.pageX - element.offsetLeft,
          y: event.pageY - element.offsetTop
        };
      }

      /**
       * Grab object coordinates.
       */
      function position( object ) {
        return {
          x: object.get( 'x' ),
          y: object.get( 'y' )
        };
      }

      // Various LevelView input states.
      var DefaultState = {
        mousedown: function() {
          selected = level.hit( mouse.end.x, mouse.end.y );
          // Grab the original (x, y) position of each object.
          offsets = selected.map( position );

          // Enter select state only if we've selected something.
          if ( selected.length ) {
            editor.set( 'state', State.SELECT );
          } else {
            editor.set( 'state', State.DRAW );
          }
        }
      };

      var DrawState = {
        mousemove: function() {
          // Draw temporary rect so we can see what we're drawing.
          editor.trigger( 'change' );
        },

        mouseup: function() {
          var x = mouse.start.x,
              y = mouse.start.y,
              width  = mouse.end.x - x,
              height = mouse.end.y - y;

          // Only add if width and height are nonzero.
          if ( width && height ) {
            level.add(new Rect({
              x: x,
              y: y,
              width:  width,
              height: height
            }));
          }

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

            // If another rect is within snapping distance, snap to nearest edge.
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
          editor.set( 'state', State.TRANSFORM );
        }
      };

      var TransformState = {
        mousedown: function() {
          // Check if we're on a corner or an edge.

          var hit = level.hit( mouse.end.x, mouse.end.y );
          // If nothing, start drawing.
          if ( !hit.length ) {
            selected = [];
            offsets = [];

            editor.set( 'state', State.DRAW );
            return;
          }

          selected = hit;
          offsets = selected.map( position );
          editor.set( 'state', State.SELECT );
        },

        mousemove: function() {
        }
      };

      var states = [];

      states[ State.DEFAULT   ] = DefaultState;
      states[ State.DRAW      ] = DrawState;
      states[ State.SELECT    ] = SelectState;
      states[ State.TRANSFORM ] = TransformState;

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

        selected: function() {
          return selected;
        },

        mousedown: function( event ) {
          mouse.down = true;

          mouse.start = mousePosition( event );
          mouse.end = mouse.start;

          handleState( 'mousedown' );
        },

        mousemove: function( event ) {
          mouse.end = mousePosition( event );

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
