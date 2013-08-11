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

    it( 'transitions to transform state on mouseup from select state', function() {
      editorView.input.mousedown({
        pageX: 40,
        pageY: 40
      });

      expect( editor.get( 'state' ) ).toBe( State.SELECT );

      editorView.input.mouseup();

      expect( editor.get( 'state' ) ).toBe( State.TRANSFORM );
      expect( editor.get( 'selection' ).at(0) ).toEqual( level.at(0) );
    })

  });
});
