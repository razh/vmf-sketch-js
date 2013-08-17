define([
  'jquery',
  'config',
  'math/geometry',
  'models/editor',
  'models/rect',
  'input/mouse'
], function( $, Config, Geometry, Editor, Rect, Mouse ) {
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
    var mouse = new Mouse();

    // Grab properties of the editorView.
    var editor   = editorView.model,
        level    = editorView.collection,
        element  = editorView.el,
        $element = editorView.$el;

    // Collection of selected objects.
    var selection = editor.get( 'selection' ),
        history   = editor.get( 'history' );

    function pointDistanceToGridLine( x, y ) {
      var gridSpacing = Config.grid;

      return {
        x: Geometry.distanceToGridLine( x, gridSpacing ),
        y: Geometry.distanceToGridLine( y, gridSpacing )
      };
    }

    /**
     * Takes coordinates amd returns a point that is snapped to the grid,
     * if within snapping radius.
     */
    function snapToGridLine( x, y ) {
      var d = pointDistanceToGridLine( x, y );

      if ( Math.abs( d.x ) < Config.snap ) {
        x += d.x;
      }

      if ( Math.abs( d.y ) < Config.snap ) {
        y += d.y;
      }

      return {
        x: x,
        y: y
      };
    }

    /**
     * Calculate relative position of MouseEvent on element.
     */
    function mousePosition( event ) {
      return {
        x: event.pageX - element.offsetLeft,
        y: event.pageY - element.offsetTop
      };
    }

    function cursorDirection() {
      if ( !selection.size() ) {
        return;
      }

      // Check if we're on a corner or an edge.
      mouse.direction = selection.at(0).handler( mouse.end.x, mouse.end.y, Config.resizeLength );

      if ( mouse.direction ) {
        $element.css( 'cursor', cursors[ mouse.direction ] );
      } else {
        $element.css( 'cursor', 'default' );
      }
    }

    /**
     * Returns if the event matches the key combination for the command?
     *
     * Example command structure: {
     *   which: 65, // A.
     *   ctrl: true,
     *   shift: false,
     *   alt: true
     * };
     *
     * This refers to CTRL+ALT+A. Note that ctrl, shift, and alt keys are
     * optional.
     */
    function keyCommand( event, command ) {
      // Handle single-key commands.
      if ( typeof command === 'number' ) {
        return command === event.which;
      }

      if ( typeof command === 'object' ) {
        // Set undefined values to false.
        command.ctrl  = typeof command.ctrl  === 'undefined' ? false : command.ctrl;
        command.shift = typeof command.shift === 'undefined' ? false : command.shift;
        command.alt   = typeof command.alt   === 'undefined' ? false : command.alt;

        // Exit if the current KeyEvent does not correspond to the command defintion.
        if ( command.ctrl  !== event.ctrlKey  ) { return false; }
        if ( command.shift !== event.shiftKey ) { return false; }
        if ( command.alt   !== event.altKey   ) { return false; }

        return command.which === event.which;
      }
    }

    // Various LevelView input states.

    /**
     * DefaultState
     * ============
     * mousedown: Set selection to all objects at mouse position.
     *   -> SELECT: If there's a rect at mouse position.
     *   -> DRAW: If we've clicked on empty space.
     */
    var DefaultState = {
      mousedown: function() {
        editor.select( level.hit( mouse.end.x, mouse.end.y ) );

        // Enter select state only if we've selected something.
        if ( selection.size() ) {
          editor.set( 'state', State.SELECT );
          history.begin( selection.models );
        } else {
          if ( Config.snapping ) {
            mouse.start = snapToGridLine( mouse.start.x, mouse.start.y );
          }

          history.begin( level );
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
        if ( Config.snapping ) {
          mouse.end = snapToGridLine( mouse.end.x, mouse.end.y );
        }
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

        history.end();
        editor.set( 'state', State.DEFAULT );
      }
    };

    /**
     * SelectState
     * ===========
     * mousedown: If we're not currently hovering over a resize handler,
     *   select all objects at mouse position.
     *   -> DRAW: If the resulting selection is empty.
     *   -> TRANSFORM: Only if the mouse is already hovering over a resize
     *         handler. Only the first object in the selection will be
     *         transformed.
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
          editor.select( level.hit( mouse.end.x, mouse.end.y ) );
          if ( !selection.size() ) {
            history.begin( level );
            editor.set( 'state', State.DRAW );
          } else {
            history.begin( selection.models );
          }
        } else {
          editor.selectFirst();
          editor.set( 'state', State.TRANSFORM );
          history.begin( selection.at(0) );
        }
      },

      mousemove: function() {
        if ( !mouse.down ) {
          cursorDirection();
          return;
        }

        var dx = mouse.end.x - mouse.start.x,
            dy = mouse.end.y - mouse.start.y;

        var offsets = editor.get( 'offsets' );

        // Translate each selected object by the distance moved.
        selection.each(function( object, index ) {
          object.set({
            x: offsets[ index ].x + dx,
            y: offsets[ index ].y + dy
          });

          // The minimum distance to snap to the nearest rect/grid-line.
          // Expressed in x and y components.
          if ( Config.snapping ) {
            // Snap to nearest grid-line.
            var min = object.distanceToGridLine( Config.grid );

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

            // If another rect/grid-line is within snapping distance,
            // snap to nearest edge.
            if ( Math.abs( min.x ) < Config.snap ) {
              object.set( 'x', object.get( 'x' ) + min.x );
            }

            if ( Math.abs( min.y ) < Config.snap ) {
              object.set( 'y', object.get( 'y' ) + min.y );
            }
          }
        });

        editor.trigger( 'change' );
      },

      mouseup: function() {
        history.end();
        // We're only going to be transforming the very first object.
        editor.selectFirst();
        editor.set( 'state', State.TRANSFORM );
      }
    };

    /**
     * TransformState
     * ==============
     * mousedown: If we're not currently hovering over a resize handler,
     *   select all objects at mouse position.
     *   -> DRAW: If the resulting selection is empty.
     *   -> SELECT: If the selection contains at least one shape.
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
          editor.select( level.hit( mouse.end.x, mouse.end.y ) );
          // If nothing, start drawing.
          if ( !selection.size() ) {
            history.begin( level );
            editor.set( 'state', State.DRAW );
          } else {
            history.begin( selection.models );
            editor.set( 'state', State.SELECT );
          }
        } else {
          history.begin( selection.at(0) );
        }
      },

      mousemove: function() {
        // If not mouse down, check direction.
        if ( !mouse.down ) {
          cursorDirection();
        } else {
          if ( Config.snapping ) {
            mouse.end = snapToGridLine( mouse.end.x, mouse.end.y );
          }

          // Transform along edge.
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
        editor.set( 'offsets', [ Geometry.position( selection.at(0) ) ] );
        history.end();

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
      cursors: cursors,

      mousedown: function( event ) {
        mouse.down = true;

        mouse.start = mousePosition( event );
        // Copy values.
        mouse.end.x = mouse.start.x;
        mouse.end.y = mouse.start.y;

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
      },

      keydown: function( event ) {
        if ( keyCommand( event, Config.commands.undo ) ) {
          editor.clearSelection();
          editor.get( 'history' ).undo();
        }

        if ( keyCommand( event, Config.commands.redo ) ) {
          editor.clearSelection();
          editor.get( 'history' ).redo();
        }

        if ( keyCommand( event, Config.commands.exit ) ) {
          editor.clearSelection();
          editor.set( 'state', State.DEFAULT );
        }
      }
    };
  };

  return EditorViewInput;
});
