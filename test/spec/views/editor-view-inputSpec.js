define(function( require ) {
  'use strict';

  /**
   * Test the various input states and transitions between them.
   */
  describe( 'EditorViewInput', function() {

    var $ = require( 'jquery' );

    var Editor      = require( 'models/editor' ),
        EditorView  = require( 'views/editor-view' ),
        Level       = require( 'collections/level' ),
        Rect        = require( 'models/rect' ),
        Config      = require( 'config' );

    var State = Editor.State;

    var $canvas, canvas, level, editor, editorView, mouse;

    // Initialize levels in editorView.
    beforeEach(function() {
      $canvas = $( '<canvas></canvas>' );
      canvas  = $canvas[0];

      // Two rectangles of width: 50 and height: 70.
      // Spaced 30 apart.
      level = new Level([
        new Rect({ x: 30, y: 30, width: 50, height: 70 }),
        new Rect({ x: 110, y: 30, width: 50, height: 70 })
      ]);

      editor = new Editor();

      editorView = new EditorView({
        el: canvas,
        model: editor,
        collection: level
      });

      mouse = editorView.input.mouse;

      // Turn off snapping.
      Config.snapping = false;
    });

    it( 'starts off in the default state', function() {
      expect( editor.get( 'state' ) ).toBe( State.DEFAULT );
    });

    describe( 'Draw state', function() {
      it( 'transitions to the draw state when clicking on empty space', function() {
        // Mouse down on empty spot.
        editorView.input.mousedown({
          pageX: 10,
          pageY: 20
        });

        expect( editorView.input.mouse.down ).toBe(true);
        expect( editorView.input.mouse.start ).toEqual({
          x: 10,
          y: 20
        });
        expect( editorView.input.mouse.end ).toEqual({
          x: 10,
          y: 20
        });

        expect( editor.get( 'state' ) ).toBe( State.DRAW );
      });

      it( 'draws a new rect and adds it to the level', function() {
        // Enter draw state.
        editorView.input.mousedown({
          pageX: 10,
          pageY: 20
        });

        expect( editor.get( 'state' ) ).toBe( State.DRAW );

        editorView.input.mousemove({
          pageX: 30,
          pageY: 40
        });

        editorView.input.mouseup();

        expect( editor.get( 'state' ) ).toBe( State.DEFAULT );

        expect( level.size() ).toBe(3);
        expect( level.at(2).get( 'x' ) ).toBe( 10 );
        expect( level.at(2).get( 'y' ) ).toBe( 20 );
        expect( level.at(2).get( 'width' ) ).toBe( 20 );
        expect( level.at(2).get( 'height' ) ).toBe( 20 );
      });
    });

    describe( 'Select state', function() {
      it( 'transitions to the select state when clicking on a rect', function() {
        editorView.input.mousedown({
          pageX: 40,
          pageY: 40
        });

        expect( editor.get( 'state' ) ).toBe( State.SELECT );
        expect( editor.get( 'selection' ).at(0) ).toEqual( level.at(0) );
        expect( editor.get( 'offsets' )[0] ).toEqual({
          x: 30,
          y: 30
        });
      });

      it( 'translates the rect on mousemove while in select state', function() {
        editorView.input.mousedown({
          pageX: 40,
          pageY: 40
        });

        editorView.input.mousemove({
          pageX: 50,
          pageY: 20
        });

        var selectedRect = editor.get( 'selection' ).at(0);
        expect( selectedRect.get( 'x' ) ).toBe( 40 );
        expect( selectedRect.get( 'y' ) ).toBe( 10 );
        expect( selectedRect.get( 'width' ) ).toBe( 50 );
        expect( selectedRect.get( 'height' ) ).toBe( 70 );
      });
    });


    describe( 'Transform state', function() {
      it( 'transitions to transform state on mouseup from select state', function() {
        editor.select( level.at(0) );
        editor.set( 'state', State.SELECT );
        editorView.input.mouseup();

        expect( editor.get( 'state' ) ).toBe( State.TRANSFORM );
        expect( editor.get( 'selection' ).at(0) ).toEqual( level.at(0) );

        // Only one object in selection noew.
        expect( editor.get( 'selection' ).size() ).toBe(1);
      });

      it( 'transforms along top-left corner while in transform state', function() {
        var firstRect = level.at(0);

        var x = firstRect.get( 'x' ),
            y = firstRect.get( 'y' ),
            width = firstRect.get( 'width' ),
            height = firstRect.get( 'height' );

        editor.select( firstRect );
        editor.set( 'state', State.TRANSFORM );

        // Click on the top left corner.
        editorView.input.mouse.direction = Rect.Corner.TOP_LEFT;
        editorView.input.mousedown({
          pageX: x,
          pageY: y
        });

        var dx = 20,
            dy = 30;

        editorView.input.mousemove({
          pageX: x + dx,
          pageY: y + dy
        });

        editorView.input.mouseup();

        expect( firstRect.get( 'x' ) ).toBe( x + dx );
        expect( firstRect.get( 'y' ) ).toBe( y + dy );
        expect( firstRect.get( 'width' ) ).toBe( width - dx );
        expect( firstRect.get( 'height' ) ).toBe( height - dy );
      });

      it( 'transforms along bottom-right corner while in transform state', function() {
        var firstRect = level.at(0);

        var x = firstRect.get( 'x' ),
            y = firstRect.get( 'y' ),
            width = firstRect.get( 'width' ),
            height = firstRect.get( 'height' );

        editor.select( firstRect );
        editor.set( 'state', State.TRANSFORM );

        editorView.input.mouse.direction = Rect.Corner.BOTTOM_RIGHT;
        editorView.input.mousedown({
          pageX: x + width,
          pageY: y + height
        });

        var dx = 10,
            dy = -20;

        editorView.input.mousemove({
          pageX: x + width + dx,
          pageY: y + height + dy
        });

        editorView.input.mouseup();

        expect( firstRect.get( 'x' ) ).toBe( x );
        expect( firstRect.get( 'y' ) ).toBe( y );
        expect( firstRect.get( 'width' ) ).toBe( width + dx );
        expect( firstRect.get( 'height' ) ).toBe( height + dy );
      });

      it( 'maintains positive dimensions when a negative transformation is applied', function() {
        var firstRect = level.at(0);

        var x = firstRect.get( 'x' ),
            y = firstRect.get( 'y' ),
            width = firstRect.get( 'width' ),
            height = firstRect.get( 'height' );

        editor.select( firstRect );
        editor.set( 'state', State.TRANSFORM );

        editorView.input.mouse.direction = Rect.Corner.BOTTOM_RIGHT;
        editorView.input.mousedown({
          pageX: x + width,
          pageY: y + height
        });

        var dWidth = 20,
            dHeight = 30;

        var dx = -width - dWidth,
            dy = -height - dHeight;

        editorView.input.mousemove({
          pageX: x + width + dx,
          pageY: y + height + dy
        });

        expect( firstRect.get( 'x' ) ).toBe( x );
        expect( firstRect.get( 'y' ) ).toBe( y );
        expect( firstRect.get( 'width' ) ).toBe( -dWidth );
        expect( firstRect.get( 'height' ) ).toBe( -dHeight );

        // This calls .positiveDimensions().
        editorView.input.mouseup();

        expect( firstRect.get( 'x' ) ).toBe( x - dWidth );
        expect( firstRect.get( 'y' ) ).toBe( y - dHeight );
        expect( firstRect.get( 'width' ) ).toBe( dWidth );
        expect( firstRect.get( 'height' ) ).toBe( dHeight );
      });
    });

    describe( 'Key commands', function() {

      it( 'calls undo() on key combination given by Config', function() {
        var history = editor.get( 'history' );
        spyOn( history, 'undo' );
        spyOn( history, 'redo' );

        var undoCommand = Config.commands.undo;

        // Make sure undefineds are given values.
        editorView.input.keydown({
          which:    undoCommand.which || 0,
          ctrlKey:  undoCommand.ctrl  || false,
          shiftKey: undoCommand.shift || false,
          altKey:   undoCommand.alt   || false
        });

        expect( history.undo ).toHaveBeenCalled();
        expect( history.redo ).not.toHaveBeenCalled();
      });

      // Same thing as above, but for redo().
      it( 'calls redo() on key combination given by Config', function() {
        var history = editor.get( 'history' );
        spyOn( history, 'undo' );
        spyOn( history, 'redo' );

        var redoCommand = Config.commands.redo;

        editorView.input.keydown({
          which:    redoCommand.which || 0,
          ctrlKey:  redoCommand.ctrl  || false,
          shiftKey: redoCommand.shift || false,
          altKey:   redoCommand.alt   || false
        });

        expect( history.undo ).not.toHaveBeenCalled();
        expect( history.redo ).toHaveBeenCalled();
      });
    });

  });
});
