define(
  [ 'jquery',
    'config',
    'models/editor',
    'models/rect',
    'input/mouse' ],
  function( $, Config, Editor, Rect, Mouse ) {
    'use strict';

    // Grab the states enum.
    var State = Editor.State;

    var Corner = Rect.Corner,
        Edge   = Rect.Edge;

    // Cursor CSS for each direction.
    var cursors = [];

    cursors[ Corner.TOP_LEFT     ] = 'nw-resize';
    cursors[ Corner.TOP_RIGHT    ] = 'ne-resize';
    cursors[ Corner.BOTTOM_LEFT  ] = 'sw-resize';
    cursors[ Corner.BOTTOM_RIGHT ] = 'se-resize';

    cursors[ Edge.TOP    ] = 'n-resize';
    cursors[ Edge.RIGHT  ] = 'e-resize';
    cursors[ Edge.BOTTOM ] = 's-resize';
    cursors[ Edge.LEFT   ] = 'w-resize';

    /**
     * Input helper class for EditorView.
     */
    var EditorViewInput = function( editorView ) {
      var mouse    = new Mouse();

      var editor   = editorView.model,
          level    = editorView.collection,
          element  = editorView.el,
          $element = editorView.$el;

      // Array of selected objects.
      var selection = editor.get( 'selection' );
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

      // Resets the editor to the default state and clears the selection.
      function resetEditor() {
        selection.reset();
        offsets = [];
        editor.set( 'state', State.DEFAULT );
      }

      function selectFirst() {
        if ( selection.size() ) {
          selection.reset( selection.at(0) );
          offsets = [ offsets[0] ];
        }
      }

      function cursorDirection() {
        if ( !selection.size() ) {
          return;
        }

        // Check if we're on a corner or an edge.
        mouse.direction = selection.at(0).handler( mouse.end.x, mouse.end.y );

        if ( mouse.direction ) {
          $element.css( 'cursor', cursors[ mouse.direction ] );
        } else {
          $element.css( 'cursor', 'default' );
        }
      }

      // Various LevelView input states.

      /**
       * DefaultState
       * ============
       * mousedown:
       *   -> SELECT: If there's a rect underneath the mousedown.
       *   -> DRAW: If we've clicked on empty space.
       */
      var DefaultState = {
        mousedown: function() {
          selection.reset( level.hit( mouse.end.x, mouse.end.y ) );
          // Grab the original (x, y) position of each object.
          offsets = selection.map( position );

          // Enter select state only if we've selected something.
          if ( selection.size() ) {
            editor.set( 'state', State.SELECT );
          } else {
            editor.set( 'state', State.DRAW );
          }
        }
      };

      /**
       * DrawState
       * =========
       * mousemove: Draw a temporary rectangle.
       * mouseup: Add the temporary rectangle to the level.
       *   -> DEFAULT: On completion.
       */
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

      /**
       * SelectState
       * ===========
       * mousedown: If we're not currently hovering a resize handler, check if
       *   we're clicking empty space. If we are, empty the selection.
       *   -> TRANSFORM: Only if the mouse is already hovering over a resize
       *         handler. Only the first object in the selection is transformed.
       *
       * mousemove: If mouse is up, then check for a cursor direction update.
       *   Otherwise, translate the selected objects by the amount the mouse
       *   has moved. Snap if close to another rect.
       *
       * mouseup:
       *   -> TRANSFORM: Only the first selected object.
       */
      var SelectState = {
        mousedown: function() {
          if ( !mouse.direction ) {
            var hit = level.hit( mouse.end.x, mouse.end.y );
            if ( !hit.length ) {
              resetEditor();
            }
          } else {
            selectFirst();
            editor.set( 'state', State.TRANSFORM );
          }
        },

        mousemove: function() {
          if ( !mouse.down ) {
            cursorDirection();
            return;
          }

          var min = {
            x: Number.POSITIVE_INFINITY,
            y: Number.POSITIVE_INFINITY
          };

          var dx = mouse.end.x - mouse.start.x,
              dy = mouse.end.y - mouse.start.y;

          // Translate each selected object by the distance moved.
          selection.each(function( object, index ) {
            object.set( 'x', offsets[ index ].x + dx );
            object.set( 'y', offsets[ index ].y + dy );

            // Find the closest rectangle.
            level.each(function( rect ) {
              if ( object.cid === rect.cid ) {
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
          // We're only going to be transforming the very first object.
          selectFirst();
          editor.set( 'state', State.TRANSFORM );
        }
      };

      /**
       * TransformState
       * ==============
       * mousedown: If we're not hovering over a resize handler and we're NOT on
       *   top of a shape, then empty the selection. Stay in TRANSFORM mode if
       *   we are on a resize handler.
       *   -> SELECT: If we are on top of a shape(s).
       *
       * mousemove: Update cursor direction if mouse is not down. If mouse is
       *   down, then resize in the direction of the current resize handler.
       *
       * mouseup: Make sure the transformed shape has positive dimensions.
       *   -> SELECT: On completion.
       */
      var TransformState = {
        mousedown: function() {
          if ( !mouse.direction ) {
            var hit = level.hit( mouse.end.x, mouse.end.y );
            // If nothing, start drawing.
            if ( !hit.length ) {
              resetEditor();
              return;
            }

            selection.reset( hit );
            offsets = selection.map( position );
            editor.set( 'state', State.SELECT );
          }
        },

        mousemove: function() {
          // If not mouse down, check direction.
          if ( !mouse.down ) {
            cursorDirection();
          } else {
            if ( mouse.direction & Edge.LEFT ) {
              selection.at(0).left( mouse.end.x );
            }

            if ( mouse.direction & Edge.RIGHT ) {
              selection.at(0).right( mouse.end.x );
            }

            if ( mouse.direction & Edge.TOP ) {
              selection.at(0).top( mouse.end.y );
            }

            if ( mouse.direction & Edge.BOTTOM ) {
              selection.at(0).bottom( mouse.end.y );
            }
          }
        },

        mouseup: function() {
          // Make sure we still have positive dimensions.
          selection.at(0).positiveDimensions();
          offsets = [ position( selection.at(0) ) ];

          $element.css( 'cursor', 'default' );
          editor.set( 'state', State.SELECT );
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
