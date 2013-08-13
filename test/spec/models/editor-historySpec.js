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

      it( 'saves the state of a Level (Backbone.Collection of Rects)', function() {
        expect( level.length ).toBe(4);
        history.save( level );

        level.remove( level.at(0) );
        expect( level.length ).toBe(3);
        history.save( level );

        history.undo();
        expect( level.length ).toBe(4);

        history.redo();
        expect( level.length ).toBe(3);
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
