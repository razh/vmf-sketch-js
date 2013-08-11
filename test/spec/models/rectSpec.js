define(function( require ) {
  'use strict';

  describe( 'Rect', function() {

    var Rect = require( 'models/rect' );;

    it( 'initializes', function() {
      var rect = new Rect();
      rect.set( 'x', 100 );
      expect( rect.get( 'x' ) ).toBe( 100 );

      rect = new Rect({
        x: 20,
        y: 50,
        width: 30,
        height: 40
      });

      expect( rect.get( 'x' ) ).toBe( 20 );
      expect( rect.get( 'y' ) ).toBe( 50 );
      expect( rect.get( 'width' ) ).toBe( 30 );
      expect( rect.get( 'height' ) ).toBe( 40 );
    });

    it( 'has corner and edge labels', function() {
      var $ = require( 'jquery' ),
          Editor     = require( 'models/editor' ),
          EditorView = require( 'views/editor-view' ),
          Level      = require( 'collections/level' );

      var editorView = new EditorView({
        el: $( '<canvas></canvas>' )[0],
        model: new Editor(),
        collection: new Level()
      });

      var cursors = editorView.input.cursors;

      expect( cursors[ Rect.Corner.TOP_LEFT     ] ).toBe( 'nw-resize' );
      expect( cursors[ Rect.Corner.TOP_RIGHT    ] ).toBe( 'ne-resize' );
      expect( cursors[ Rect.Corner.BOTTOM_LEFT  ] ).toBe( 'sw-resize' );
      expect( cursors[ Rect.Corner.BOTTOM_RIGHT ] ).toBe( 'se-resize' );

      expect( cursors[ Rect.Edge.TOP    ] ).toBe( 'n-resize' );
      expect( cursors[ Rect.Edge.RIGHT  ] ).toBe( 'e-resize' );
      expect( cursors[ Rect.Edge.BOTTOM ] ).toBe( 's-resize' );
      expect( cursors[ Rect.Edge.LEFT   ] ).toBe( 'w-resize' );
    });

    it( 'does hit detection', function() {
      var rect = new Rect({
        x: 20,
        y: 50,
        width: 100,
        height: 200
      });

      expect( rect.contains( 30, 60 ) ).toBe( true );
      // On top-left corner.
      expect( rect.contains( 20, 50 ) ).toBe( true );
      // Bottom right.
      expect( rect.contains( 120, 250 ) ).toBe( true );
      expect( rect.contains( 0, 0 ) ).toBe( false );
    });

    it( 'has an axis-aligned bounding box', function() {
      var rect = new Rect({
        x: 40,
        y: 100,
        width: 45,
        height: 32
      });

      expect( rect.aabb() ).toEqual({
        x0: 40,
        y0: 100,
        x1: 85,
        y1: 132
      });
    });

    it( 'returns the direction if hovering over a resize handler', function() {
      var rect = new Rect({
        x: 50,
        y: 60,
        width: 50,
        height: 70,

        resizeLength: 10
      });

      var aabb = rect.aabb();

      var x0 = aabb.x0,
          y0 = aabb.y0,
          x1 = aabb.x1,
          y1 = aabb.y1;

      var mx = 0.5 * ( x0 + x1 ),
          my = 0.5 * ( y0 + y1 );

      expect( rect.handler( x0, y0 ) ).toBe( Rect.Corner.TOP_LEFT );
      expect( rect.handler( mx, y0 ) ).toBe( Rect.Edge.TOP );
      expect( rect.handler( x1, y0 ) ).toBe( Rect.Corner.TOP_RIGHT );

      expect( rect.handler( x0, my ) ).toBe( Rect.Edge.LEFT );
      expect( rect.handler( x1, my ) ).toBe( Rect.Edge.RIGHT );

      expect( rect.handler( x0, y1 ) ).toBe( Rect.Corner.BOTTOM_LEFT );
      expect( rect.handler( mx, y1 ) ).toBe( Rect.Edge.BOTTOM );
      expect( rect.handler( x1, y1 ) ).toBe( Rect.Corner.BOTTOM_RIGHT );

      expect( rect.handler( mx, my ) ).toBe( null );
    });
  });
});
