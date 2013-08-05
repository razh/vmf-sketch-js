define(function() {
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

  return {
    aabbContains: aabbContains,
    distanceSquared: distanceSquared,
    distance: distance
  };
});
