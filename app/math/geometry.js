define([
  'underscore'
], function( _ ) {
  'use strict';

  /**
   * Determine if the point (x, y) is in the axis-aligned bounding-box defined
   * by [(x0, y0), (x1, y1)].
   */
  function aabbContains( x, y, x0, y0, x1, y1 ) {
    return x0 <= x && x <= x1 &&
           y0 <= y && y <= y1;
  }

  function distanceSquared( x0, y0, x1, y1 ) {
    var dx = x1 - x0,
        dy = y1 - y0;

    return dx * dx + dy * dy;
  }

  function distance( x0, y0, x1, y1 ) {
    return Math.sqrt( distanceSquared( x0, y0, x1, y1 ) );
  }

  /**
   * Linear interpolate from a to b by amount t.
   */
  function lerp( a, b, t ) {
    return a + t * ( b - a );
  }

  function pointSegmentDistanceSquared( x, y, x0, y0, x1, y1 ) {
    // Check if line is degenerate.
    var lengthSquared = distanceSquared( x0, y0, x1, y1 );
    if ( !lengthSquared ) {
      return distanceSquared( x, y, x0, y0 );
    }

    // Determine the nearest parameter on the line segment to the point.
    var t = ( ( x - x0 ) * ( x1 - x0 ) + ( y - y0 ) * ( y1 - y0 ) ) / lengthSquared;
    if ( t < 0 ) {
      return distanceSquared( x, y, x0, y0 );
    }

    if ( t > 1 ) {
      return distanceSquared( x, y, x1, y1 );
    }

    return distanceSquared( x, y, lerp( x0, x1, t ), lerp( y0, y1, t ) );
  }

  function pointSegmentDistance( x, y, x0, y0, x1, y1 ) {
    return Math.sqrt( pointSegmentDistanceSquared( x, y, x0, y0, x1, y1 ) );
  }

  /**
   * Returns the distance value is from the nearest grid-line, assuming the
   * grid-lines are spacing units apart.
   */
  function distanceToGridLine( value, spacing ) {
    return Math.round( value / spacing ) * spacing - value;
  }

  /**
   * Returns the value with the minimum magnitude.
   */
  function minMagnitude() {
    var min    = Number.POSITIVE_INFINITY,
        absMin = Math.abs( min ),
        abs;

    _.each( arguments, function( value ) {
      abs = Math.abs( value );

      if ( abs < absMin ) {
        min    = value;
        absMin = abs;
      }
    });

    return min;
  }

  return {
    aabbContains: aabbContains,

    distanceToGridLine: distanceToGridLine,
    distanceSquared:    distanceSquared,
    distance:           distance,

    pointSegmentDistanceSquared: pointSegmentDistanceSquared,
    pointSegmentDistance:        pointSegmentDistance,

    minMagnitude: minMagnitude
  };
});
