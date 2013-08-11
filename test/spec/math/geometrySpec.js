define(function( require ) {
  'use strict';

  describe( 'Geometry', function() {

    var Geometry = require( 'math/geometry' ),
        Backbone = require( 'backbone' );

    it( 'lerp() linear interpolates', function() {
      expect( Geometry.lerp( 10, 25, 0 ) ).toBe( 10 );
      expect( Geometry.lerp( 10, 25, 1 ) ).toBe( 25 );

      expect( Geometry.lerp( 10, 20, 0.5 ) ).toBe( 15 );
      expect( Geometry.lerp( -10, -15, 0.2 ) ).toBe( -11 );
    });

    it( 'position() grabs coords from a Backbone Model', function() {
      var Model = Backbone.Model.extend({
        defaults: function() {
          return {
            x: 0,
            y: 0
          };
        }
      });

      var model = new Model();
      expect( Geometry.position( model ) ).toEqual({
        x: 0,
        y: 0
      });

      model = new Model({
        x: 20,
        y: 30
      });

      expect( Geometry.position( model ) ).toEqual({
        x: 20,
        y: 30
      });
    });

    it( 'aabbContains() checks if a point is in an axis-aligned bounding-box', function() {
      // Top left corner.
      expect( Geometry.aabbContains( 10, 10, 10, 10, 20, 20 ) ).toBe( true );
      // Outside.
      expect( Geometry.aabbContains( 9, 10, 10, 10, 20, 20 ) ).toBe( false );
      // Bottom right corner.
      expect( Geometry.aabbContains( 20, 20, 10, 10, 20, 20 ) ).toBe( true );
      // Middle.
      expect( Geometry.aabbContains( 15, 15, 10, 10, 20, 20 ) ).toBe( true );
      // Outside right.
      expect( Geometry.aabbContains( 25, 15, 10, 10, 20, 20 ) ).toBe( false );
    });

    it( 'distance() returns Euclidean distance', function() {
      expect( Geometry.distance( 10, 10, 20, 10 ) ).toBe( 10 );
      expect( Geometry.distance( 10, 10, 20, 20 ) ).toBeCloseTo( 14.142 );
      expect( Geometry.distance( 10, 20, 0, 20 ) ).toBe( 10 );
    });

    it( 'pointSegmentDistance() returns the distance between a point and a segment', function() {
      // Vertical line segment.
      expect( Geometry.pointSegmentDistance( 0, 0, 10, 0, 10, 20 ) ).toBe( 10 );
      expect( Geometry.pointSegmentDistance( 0, 20, 10, 0, 10, 20 ) ).toBe( 10 );
      expect( Geometry.pointSegmentDistance( 5, 10, 10, 0, 10, 20 ) ).toBe( 5 );

      // Horizontal line segment.
      expect( Geometry.pointSegmentDistance( 5, 10, 20, 10, 40, 10 ) ).toBe( 15 );
      expect( Geometry.pointSegmentDistance( 40, 10, 20, 10, 40, 10 ) ).toBe( 0 );

      // Diagonal line segment.
      expect( Geometry.pointSegmentDistance( 5, 10, 20, 10, 40, 20 ) ).toBe( 15 );
      expect( Geometry.pointSegmentDistance( 40, 30, 20, 10, 40, 20 ) ).toBe( 10 );

    });

    it( 'distanceToGridLine() returns the distance to the nearest grid line', function() {
      expect( Geometry.distanceToGridLine( 10, 32 ) ).toBe( -10 );
      expect( Geometry.distanceToGridLine( 16, 32 ) ).toBe( 16 );
      expect( Geometry.distanceToGridLine( 22, 32 ) ).toBe( 10 );
      expect( Geometry.distanceToGridLine( 22, 8 ) ).toBe( 2 );
      expect( Geometry.distanceToGridLine( 22, 7 ) ).toBe( -1 );
      expect( Geometry.distanceToGridLine( 22, 100 ) ).toBe( -22 );
    });

    it( 'minMagntidue() returns the value with the minimum magnitude in arguments', function() {
      expect( Geometry.minMagnitude() ).toBe( Number.POSITIVE_INFINITY );
      expect( Geometry.minMagnitude( 0, 2, -55 ) ).toBe(0);
      expect( Geometry.minMagnitude( 10, 2, -55 ) ).toBe(2);
      expect( Geometry.minMagnitude( 500, 200, -55 ) ).toBe(-55);
    });

  });
});
