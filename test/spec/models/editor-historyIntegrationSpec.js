define(function( require ) {
  'use strict';

  describe( 'History and EditorView integration tests', function() {

    var EditorHistory = require( 'models/editor-history' );

    // Turn off snapping.
    var Config = require( 'config' )
    Config.snapping = false;

    var Mememto = require( 'models/memento' ),
        Level   = require( 'collections/level' ),
        Rect    = require( 'models/rect' );

    var Editor     = require( 'models/editor' ),
        EditorView = require( 'views/editor-view' );

    var State = Editor.State;

    var $canvas, canvas, level, editor, editorView;

    beforeEach(function() {
      history = new EditorHistory();

      $canvas = $( '<canvas></canvas>');
      canvas  = $canvas[0];

      // Three rects, the first two overlap.
      // Use (35, 50) as the intersection point.
      level = new Level([
        { x: 20, y: 20, width: 30, height: 40 },
        { x: 30, y: 45, width: 20, height: 50 },
        { x: 200, y: 300, width: 50, height: 90 }
      ]);

      editor = new Editor({
        history: history
      });

      editorView = new EditorView({
        el: canvas,
        model: editor,
        collection: level
      });

    });

    it( 'moving a Rect causes a save state', function() {
      var dx = -10,
          dy = -5;

      expect( history.current ).toBe( null );

      // Select the first rectangle.
      editorView.input.mousedown({
        pageX: 25,
        pageY: 30
      });

      expect( history.current.length ).toBe(1);
      expect( history.undoStack.length ).toBe(0);

      editorView.input.mousemove({
        pageX: 25 + dx,
        pageY: 30 + dy
      });

      editorView.input.mouseup();

      expect( history.undoStack.length ).toBe(1);
    });

    it( 'no new states are created if a translation is an identity', function() {
      spyOn( history, 'begin' ).andCallThrough();
      spyOn( history, 'save' ).andCallThrough();

      editor.set( 'state', State.SELECT );

      editorView.input.mousedown({
        pageX: 25,
        pageY: 25
      });

      expect( editor.get( 'selection' ).size() ).toBe(1);
      expect( history.undoStack.length ).toBe(0);

      expect( history.begin ).toHaveBeenCalled();
      expect( history.save ).toHaveBeenCalled();

      editorView.input.mousemove({
        pageX: 25,
        pageY: 35
      });

      editorView.input.mouseup();

      expect( history.current ).toBeTruthy();
      expect( history.undoStack.length ).toBe(1);
    });

    it( 'editing an array of objects, then editing each object generates a proper history', function() {
      // Select two rectangles.
      editorView.input.mousedown({
        pageX: 30,
        pageY: 50
      });

      expect( editor.get( 'selection' ).size() ).toBe(2);

      editorView.input.mousemove({
        pageX: 20,
        pageY: 20
      });

      editorView.input.mouseup();

      // Two rectangles have chaned.
      expect( history.current.length ).toBe(2);
      expect( history.undoStack.length ).toBe(1);

      // Now select the first rect and move it.
      var x0 = level.at(0).get( 'x' ),
          y0 = level.at(0).get( 'y' );

      var dx0 = 10,
          dy0 = 15;

      editorView.input.mousedown({
        pageX: x0,
        pageY: y0
      });

      editorView.input.mousemove({
        pageX: x0 + dx0,
        pageY: y0 + dy0
      });

      editorView.input.mouseup();

      expect( history.current[0].target ).toBe( level.at(0) );
      expect( history.undoStack.length ).toBe(2);

      // Select the second rect.
      var x1 = level.at(1).get( 'x' ),
          y1 = level.at(1).get( 'y' );

      var dx1 = -20,
          dy1 = -12;

      // If we were to select the second rect at its (x, y), we would get the
      // first rect instead.
      editorView.input.mousedown({
        pageX: x1 + level.at(1).get( 'width' ),
        pageY: y1 + level.at(1).get( 'height' )
      });

      editorView.input.mousemove({
        pageX: x1 + level.at(1).get( 'width' ) + dx1,
        pageY: y1 + level.at(1).get( 'width' ) + dy1
      });

      editorView.input.mouseup();

      expect( history.undoStack.length ).toBe(3);
      expect( level.at(0).get( 'x' ) ).toBe( x0 + dx0 );
      expect( level.at(1).get( 'x' ) ).toBe( x1 + dx1 );

      history.undo();
      expect( level.at(0).get( 'x' ) ).toBe( x0 + dx0 );
      // This fails right now. The previous state of the second triangle is not
      // saved.
      expect( level.at(1).get( 'x' ) ).toBe( x1 );

      history.undo();
      expect( level.at(0).get( 'x' ) ).toBe( x0 );
      expect( level.at(1).get( 'x' ) ).toBe( x1 );

      history.redo();
      expect( level.at(0).get( 'x' ) ).toBe( x0 + dx0 );
      expect( level.at(1).get( 'x' ) ).toBe( x1 );

      history.redo();
      expect( level.at(0).get( 'x' ) ).toBe( x0 + dx0 );
      expect( level.at(1).get( 'x' ) ).toBe( x1 + dx1 );
    });

    it( 'editing an object, then an array of objects generates a proper history', function() {
      var rect0 = level.at(0),
          rect1 = level.at(1),
          rect2 = level.at(2);

      var x0 = rect0.get( 'x' ),
          x1 = rect1.get( 'x' ),
          y1 = rect1.get( 'y' );

      // Select the third retangle.
      var x2 = rect2.get( 'x' ),
          y2 = rect2.get( 'y' );

      var dx2 = 40,
          dy2 = 20;

      editorView.input.mousedown({
        pageX: x2,
        pageY: y2
      });

      editorView.input.mousemove({
        pageX: x2 + dx2,
        pageY: y2 + dx2
      });

      editorView.input.mouseup();

      expect( history.current.length ).toBe(1);
      expect( rect2.get( 'x' ) ).toBe( x2 + dx2 );
      expect( rect0.get( 'x' ) ).toBe( x0 );
      expect( rect1.get( 'x' ) ).toBe( x1 );

      history.undo();
      expect( rect2.get( 'x' ) ).toBe( x2 );
      expect( rect0.get( 'x' ) ).toBe( x0 );
      expect( rect1.get( 'x' ) ).toBe( x1 );

      history.redo();
      expect( rect2.get( 'x' ) ).toBe( x2 + dx2 );
      expect( rect0.get( 'x' ) ).toBe( x0 );
      expect( rect1.get( 'x' ) ).toBe( x1 );

      // Now select the first and second rectangles.
      var dx = -50,
          dy = -60;

      editorView.input.mousedown({
        pageX: x1,
        pageY: y1
      });

      editorView.input.mousemove({
        pageX: x1 + dx,
        pageY: y1 + dy
      });

      editorView.input.mouseup();

      expect( history.current.length ).toBe(2);
      expect( rect0.get( 'x' ) ).toBe( x0 + dx );
      expect( rect1.get( 'x' ) ).toBe( x1 + dx );
      expect( rect2.get( 'x' ) ).toBe( x2 + dx2 );

      history.undo();
      expect( rect0.get( 'x' ) ).toBe( x0 );
      expect( rect1.get( 'x' ) ).toBe( x1 );
      expect( rect2.get( 'x' ) ).toBe( x2 + dx2 );

      history.redo();
      expect( rect0.get( 'x' ) ).toBe( x0 + dx );
      expect( rect1.get( 'x' ) ).toBe( x1 + dx );
      expect( rect2.get( 'x' ) ).toBe( x2 + dx2 );

      history.undo();
      history.undo();
      expect( rect0.get( 'x' ) ).toBe( x0 );
      expect( rect1.get( 'x' ) ).toBe( x1 );
      expect( rect2.get( 'x' ) ).toBe( x2 );

      history.redo();
      expect( rect0.get( 'x' ) ).toBe( x0 );
      expect( rect1.get( 'x' ) ).toBe( x1 );
      expect( rect2.get( 'x' ) ).toBe( x2 + dx2 );

      history.redo();
      expect( rect0.get( 'x' ) ).toBe( x0 + dx );
      expect( rect1.get( 'x' ) ).toBe( x1 + dx );
      expect( rect2.get( 'x' ) ).toBe( x2 + dx2 );
    });
  });
});
