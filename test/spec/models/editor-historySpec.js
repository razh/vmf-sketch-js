define(function( require ) {
  'use strict';

  describe( 'History', function() {

    var EditorHistory = require( 'models/editor-history' );

    var Mememto = require( 'models/memento' ),
        Level   = require( 'collections/level' ),
        Rect    = require( 'models/rect' );

    var history;

    describe( 'Rect (Backbone.Model)', function() {

      var rect;

      beforeEach(function() {
        history = new EditorHistory();

        rect = new Rect({
          x: 10,
          y: 20,
          width: 20,
          height: 30
        });
      });

      it( 'saves the state of a Rect', function() {
        history.save( rect );
        rect.set( 'x', 200 );
        history.save( rect );
        history.undo();

        // x has its old value.
        expect( rect.get( 'x' ) ).toBe( 10 );
        // But not y.
        expect( rect.get( 'y' ) ).toBe( 20 );

        // Nothing happens.
        history.undo();
        expect( rect.get( 'x' ) ).toBe( 10 );
      });

      it( 'redoes an undone state of a Rect', function() {
        history.save( rect );

        rect.set( 'x', 200 );
        history.save( rect );

        history.undo();
        expect( rect.get( 'x' ) ).toBe( 10 );

        history.redo();
        // x has its new value.
        expect( rect.get( 'x' ) ).toBe( 200 );

        // Nothing happens.
        history.redo();
        expect( rect.get( 'x' ) ).toBe( 200 );
      });

      it( 'allows for multiple undos and redos', function() {
        history.save( rect );
        rect.set( 'x', 200 );
        history.save( rect );
        rect.set( 'x', 300 );
        history.save( rect );

        // Undo.
        expect( rect.get( 'x' ) ).toBe( 300 );
        history.undo();
        expect( rect.get( 'x' ) ).toBe( 200 );
        history.undo();
        expect( rect.get( 'x' ) ).toBe( 10 );

        expect( history.redoStack.length ).toBe( 2 );

        // Redo.
        history.redo();
        expect( rect.get( 'x' ) ).toBe( 200 );
        history.redo();
        expect( rect.get( 'x' ) ).toBe( 300 );

        // Undo and redo.
        history.undo();
        expect( rect.get( 'x' ) ).toBe( 200 );
        history.redo();
        expect( rect.get( 'x' ) ).toBe( 300 );

        history.undo();
        expect( rect.get( 'x' ) ).toBe( 200 );
        history.undo();
        expect( rect.get( 'x' ) ).toBe( 10 );
        history.redo();
        expect( rect.get( 'x' ) ).toBe( 200 );
        history.redo();
        expect( rect.get( 'x' ) ).toBe( 300 );
      });

      it( 'save() rewrites history if in the past', function() {
        history.save( rect );
        rect.set( 'x', 200 );
        history.save( rect );
        history.undo();

        rect.set( 'x', 100 );
        history.save( rect );

        // Redo does nothing.
        history.redo();
        expect( rect.get( 'x' ) ).toBe( 100 );
      });
    });


    describe( 'Level (Backbone.Collection)', function() {

      var level;

      beforeEach(function() {
        history = new EditorHistory();

        level = new Level([
          { x: 10, y: 50, width:  90, height: 130 },
          { x: 20, y: 60, width: 100, height: 140 },
          { x: 30, y: 70, width: 110, height: 150 },
          { x: 40, y: 80, width: 120, height: 160 }
        ]);
      });

      it( 'restoring a Backbone.Collection from a memento may change element order', function() {
        var rect0JSON = level.at(0).toJSON();

        var id0 = level.at(0).id,
            id1 = level.at(1).id,
            id2 = level.at(2).id,
            id3 = level.at(3).id;

        expect( level.at(0).id ).toBe( id0 );
        expect( level.get( id0 ) ).toBe( level.at(0) );
        expect( level.pluck( 'id' ) ).toEqual( [ id0, id1, id2, id3 ] );

        var memento = new Mememto( level );
        level.remove( level.at(0) );
        memento.restore();
        expect( level.pluck( 'id' ) ).toEqual( [ id1, id2, id3, id0 ] );
        expect( level.get( id0 ).toJSON() ).toEqual( rect0JSON );
      });

      it( 'restoring a Backbone.Collection from a memento does not change ids', function() {
        var test = new Rect({ id: 'test' });
        expect( test.id ).toBe( 'test' );

        var id0 = level.at(0).id;
        expect( level.get( id0 ) ).toBe(level.at(0));

        level.set( level.toJSON() );
        expect( level.at(0).id ).toBe( id0 );

        var memento = new Mememto( level );
        expect( memento.state[0].id ).toBe( id0 );
        memento.restore();
        expect( level.at(0).id ).toBe( id0 );
      });

      it( 'saves the state of a Level (Backbone.Collection of Rects)', function() {
        var rect0 = level.at(0),
            rect1 = level.at(1),
            rect2 = level.at(2);

        var id0 = rect0.id,
            id1 = rect1.id,
            id2 = rect2.id;

        expect( level.length ).toBe(4);
        history.save( level );

        level.remove( level.at(0) );
        expect( level.length ).toBe(3);
        // It no longer exists in the array.
        expect( typeof level.get( id0 ) ).toBe( 'undefined' );
        history.save( level );

        history.undo();
        // Check if ids are the same.
        expect( level.get( id0 ).id ).toBe( id0 );
        expect( level.get( id1 ).id ).toBe( id1 );
        // Check if values are the same.
        expect( level.get( id0 ).get( 'x' ) ).toBe( 10 );
        expect( level.get( id1 ).get( 'x' ) ).toBe( 20 );
        expect( level.length ).toBe(4);

        history.redo();
        expect( level.at(0).id ).toBe( id1 );
        expect( level.at(1).id ).toBe( id2 );
        expect( level.at(0).get( 'x' ) ).toBe( 20 );
        expect( level.at(1).get( 'x' ) ).toBe( 30 );
        expect( level.length ).toBe(3);
      });

      it( 'mementos maintain references to models after collection addition/removal', function() {
        var id0 = level.at(0).id;
        history.save( level.at(0) );
        level.at(0).set( 'x', 200 );
        history.save( level.at(0) );

        history.save( level );
        level.remove( level.at(0) );
        history.save( level );

        history.undo();
        expect( level.length ).toBe(4);

        history.undo();
        expect( level.get( id0 ).get( 'x' ) ).toBe( 200 );
        history.undo();
        expect( level.get( id0 ).get( 'x' ) ).toBe( 10 );
      });

      it( 'allows the batch-saving of multiple models at once', function() {
        expect( level.at(0).get( 'x' ) ).toBe( 10 );
        // Attempt to save an array.
        history.save( level.models );

        level.at(0).set( 'x', 200 );
        level.at(1).set( 'x', 210 );
        history.save( level.models );

        history.undo();
        expect( level.at(0).get( 'x' ) ).toBe( 10 );
        expect( level.at(1).get( 'x' ) ).toBe( 20 );

        history.redo();
        expect( level.at(0).get( 'x' ) ).toBe( 200 );
        expect( level.at(1).get( 'x' ) ).toBe( 210 );
      });
    });

    describe( 'Canvas/EditorView integration tests', function() {

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

    it( 'clear() empties the history', function() {
      var rect = new Rect({
        x: 10,
        y: 20,
        width: 30,
        height: 40
      });

      history.save( rect );
      rect.set( 'x', 200 );
      history.save( rect );
      history.undo();
      expect( history.redoStack.length ).toBe(1);

      history.clear();
      expect( history.undoStack.length ).toBe(0);
      expect( history.redoStack.length ).toBe(0);

      // Redo does nothing.
      history.redo();
      expect( rect.get( 'x' ) ).toBe( 10 );
    });
  });
});
