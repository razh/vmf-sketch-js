define(function( require ) {
  'use strict';

  describe( 'History', function() {

    var EditorHistory = require( 'models/editor-history' );

    var Mememto = require( 'models/memento' ),
        Level   = require( 'collections/level' ),
        Rect    = require( 'models/rect' );

    var history;

    beforeEach(function() {
      history = new EditorHistory();
    });

    describe( 'Rect (Backbone.Model)', function() {

      var rect;

      beforeEach(function() {
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
        level = new Level([
          { x: 10, y: 50, width:  90, height: 130 },
          { x: 20, y: 60, width: 100, height: 140 },
          { x: 30, y: 70, width: 110, height: 150 },
          { x: 40, y: 80, width: 120, height: 160 }
        ]);
      });

      it( 'restoring a Backbone.Collection from a memento does not change cids', function() {
        var test = new Rect({ cid: 'test' });
        expect( test.cid ).toBe( 'test' );

        var cid0 = level.at(0).cid;
        expect( level.get( cid0 ) ).toBe(level.at(0));

        level.set( level.toJSON() );
        expect( level.at(0).cid ).toBe( cid0 );

        var memento = new Mememto( level );
        expect( memento.state[0].cid ).toBe( cid0 );
        memento.restore();
        expect( level.at(0).cid ).toBe( cid0 );
      });

      it( 'saves the state of a Level (Backbone.Collection of Rects)', function() {
        var cid0 = level.at(0).cid,
            cid1 = level.at(1).cid,
            cid2 = level.at(2).cid;

        expect( level.length ).toBe(4);
        history.save( level );

        level.remove( level.at(0) );
        expect( level.length ).toBe(3);
        history.save( level );

        history.undo();
        // Check if cids are the same.
        expect( level.at(0).cid ).toBe( cid0 );
        expect( level.at(1).cid ).toBe( cid1 );
        // Check if values are the same.
        expect( level.at(0).get('x') ).toBe( 10 );
        expect( level.at(1).get('x') ).toBe( 20 );
        expect( level.length ).toBe(4);

        history.redo();
        expect( level.at(0).cid ).toBe( cid1 );
        expect( level.at(1).cid ).toBe( cid2 );
        expect( level.at(0).get('x') ).toBe( 20 );
        expect( level.at(1).get('x') ).toBe( 30 );
        expect( level.length ).toBe(3);
      });

      it( 'mementos maintain references to models after collection addition/removal', function() {
        history.save( level.at(0) );
        level.at(0).set( 'x', 200 );
        history.save( level.at(0) );

        history.save( level );
        level.remove( level.at(0) );
        history.save( level );

        history.undo();
        expect( level.length ).toBe(4);

        history.undo();
        expect( level.at(0).get( 'x' ) ).toBe( 200 );
        history.undo();
        expect( level.at(0).get( 'x' ) ).toBe( 10 );
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

    describe( 'Canvas interaction', function() {

      var Editor     = require( 'models/editor' ),
          EditorView = require( 'views/editor-view' );

      var $canvas, canvas, level, editor, editorView;

      beforeEach(function() {
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

        // Select the first rectangle.
        editorView.input.mousedown({
          pageX: 25,
          pageY: 30
        });

        expect( editor.get( 'selection' ).at(0) ).toBe( level.at(0) );

        editorView.input.mousemove({
          pageX: 25 + dx,
          pageY: 30 + dy
        });

        editorView.input.mouseup();

        // expect( history.undoStack.length ).toBe(1);
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
