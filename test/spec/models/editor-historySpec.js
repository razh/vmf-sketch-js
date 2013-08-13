define(function( require ) {
  'use strict';

  describe( 'History', function() {

    var EditorHistory = require( 'models/editor-history' );

    var Mememto = require( 'models/memento' ),
        Rect    = require( 'models/rect' );

    var history;

    beforeEach(function() {
      history = new EditorHistory();
    });

    describe( 'History of a Rect (Backbone.Model', function() {

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
      });

      it( 'redoes an undone state of a Rect', function() {
        history.save( rect );
        rect.set( 'x', 200 );
        history.save( rect );
        history.redo();

        // x has its new value.
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

        expect( history.redoStack.length ).toBe( 3 );

        // Redo.
        history.redo();
        expect( rect.get( 'x' ) ).toBe( 200 );
        history.redo();
        expect( rect.get( 'x' ) ).toBe( 300 );
      });
    });


    describe( 'History of a Level (Backbone.Collection)', function() {
      it( 'saves the state of a Level (Backbone.Collection of Rects)', function() {

      });
    });

    it( 'clear() empties the history', function() {

    });
  });
});
