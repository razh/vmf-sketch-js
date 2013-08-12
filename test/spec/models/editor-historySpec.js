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

    it( 'saves the state of a Rect', function() {
      var rect = new Rect({
        x: 10,
        y: 20,
        width: 20,
        height: 30
      });

      history.store( new Mememto( rect, rect.toJSON() ) );
      rect.set( 'x', 200 );
      history.store( new Mememto( rect, rect.toJSON() ) );
      history.undo();

      expect( rect.get( 'x' ) ).toBe( 10 );
    });
  });

});
