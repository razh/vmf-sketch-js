define([
  'underscore',
  'backbone',
  'math/geometry'
], function( _, Backbone, Geometry ) {
  'use strict';

  var Corner = {
    TOP_LEFT:      9, // 1001
    TOP_RIGHT:     3, // 0011
    BOTTOM_LEFT:  12, // 1100
    BOTTOM_RIGHT:  6, // 0110
  };

  var Edge = {
    TOP:    1, // 0001
    RIGHT:  2, // 0010
    BOTTOM: 4, // 0100
    LEFT:   8  // 1000
  };

  var Rect = Backbone.Model.extend({
    defaults: function() {
      return {
        id: _.uniqueId(),
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    },

    initialize: function() {
      // Make sure we handle negative dimensions.
      this.positiveDimensions();
    },

    /**
     * You've got rendering code in my model!
     */
    draw: function( ctx ) {
      ctx.rect(
        this.get( 'x' ),
        this.get( 'y' ),
        this.get( 'width' ),
        this.get( 'height' )
      );
    },

    drawResizeHandlers: function( ctx, size ) {
      var x = this.get( 'x' ),
          y = this.get( 'y' ),
          width  = this.get( 'width' ),
          height = this.get( 'height' );

      // Resize handler dimension.
      size = size || 1;
      var halfSize = 0.5 * size;

      ctx.beginPath();

      // Corners.
      // Top lefts of resize handler rects.
      var x0 = x - halfSize,
          y0 = y - halfSize,
          x1 = x + width  - halfSize,
          y1 = y + height - halfSize;

      // Starting from top-left corner and going clockwise.
      ctx.rect( x0, y0, size, size );
      ctx.rect( x0, y1, size, size );
      ctx.rect( x1, y0, size, size );
      ctx.rect( x1, y1, size, size );

      // Edges.
      var halfWidth  = 0.5 * width,
          halfHeight = 0.5 * height,
          // Middle of edges.
          mx = x0 + halfWidth,
          my = y0 + halfHeight;

      // Starting from left edge and going clockwise.
      ctx.rect( x0, my, size, size );
      ctx.rect( mx, y0, size, size );
      ctx.rect( x1, my, size, size );
      ctx.rect( mx, y1, size, size );

      ctx.fillStyle = 'white';
      ctx.fill();

      ctx.strokeStyle = 'black';
      ctx.stroke();
    },

    contains: function( x, y ) {
      var aabb = this.aabb();
      return Geometry.aabbContains( x, y, aabb.x0, aabb.y0, aabb.x1, aabb.y1 );
    },

    handler: function( x, y, size ) {
      var rx = this.get( 'x' ),
          ry = this.get( 'y' ),
          width  = this.get( 'width' ),
          height = this.get( 'height' );

      // Size of resize handler side.
      size = size || 1;
      var halfSize = 0.5 * size;

      var halfWidth  = 0.5 * width,
          halfHeight = 0.5 * height;

      /**
       * x0  x1   x2  x3   x4  x5
       *  .__.     .__.     .__.
       *  |  |-----|  |-----|  |
       */

      var x0 = rx - halfSize,
          x1 = rx + halfSize,
          x2 = rx + halfWidth - halfSize,
          x3 = rx + halfWidth + halfSize,
          x4 = rx + width - halfSize,
          x5 = rx + width + halfSize;

      // Same order as above, but going from top to bottom.
      var y0 = ry - halfSize,
          y1 = ry + halfSize,
          y2 = ry + halfHeight - halfSize,
          y3 = ry + halfHeight + halfSize,
          y4 = ry + height - halfSize,
          y5 = ry + height + halfSize;

      var directions = [
        { aabb: [ x0, y0, x1, y1 ], direction: Corner.TOP_LEFT     },
        { aabb: [ x2, y0, x3, y1 ], direction: Edge.TOP            },
        { aabb: [ x4, y0, x5, y1 ], direction: Corner.TOP_RIGHT    },
        { aabb: [ x0, y2, x1, y3 ], direction: Edge.LEFT           },
        { aabb: [ x4, y2, x5, y3 ], direction: Edge.RIGHT          },
        { aabb: [ x0, y4, x1, y5 ], direction: Corner.BOTTOM_LEFT  },
        { aabb: [ x2, y4, x3, y5 ], direction: Edge.BOTTOM         },
        { aabb: [ x4, y4, x5, y5 ], direction: Corner.BOTTOM_RIGHT }
      ];

      var d;
      for ( var i = 0, l = directions.length; i < l; i++ ) {
        d = directions[i];
        if ( Geometry.aabbContains.apply( null, [ x, y ].concat( d.aabb ) ) ) {
          return d.direction;
        }
      }

      return null;
    },

    aabb: function() {
      var x      = this.get( 'x' ),
          y      = this.get( 'y' ),
          width  = this.get( 'width' ),
          height = this.get( 'height' );

      return {
        x0: x,
        y0: y,
        x1: x + width,
        y1: y + height
      };
    },

    /**
     * Returns the distance between this to rect in terms
     * of x and y components.
     */
    distanceTo: function( rect ) {
      var aabb0 = this.aabb(),
          aabb1 = rect.aabb();

      // Distance from left edge of this to right edge of rect.
      var leftRight = aabb1.x1 - aabb0.x0,
          // Right of this to left of rect.
          rightLeft = aabb1.x0 - aabb0.x1,
          // Top of this to bottom of rect.
          topBottom = aabb1.y1 - aabb0.y0,
          // Bottom of this to top of rect.
          bottomTop = aabb1.y0 - aabb0.y1;

      // Left edges of this and rect.
      var leftLeft     = aabb1.x0 - aabb0.x0,
          // Right edges.
          rightRight   = aabb1.x1 - aabb0.x1,
          // Top edges.
          topTop       = aabb1.y0 - aabb0.y0,
          // Bottom edges.
          bottomBottom = aabb1.y1 - aabb0.y1;

      var dx = Geometry.minMagnitude( leftRight, leftLeft, rightLeft, rightRight ),
          dy = Geometry.minMagnitude( topBottom, topTop, bottomTop, bottomBottom );

      return {
        x: dx,
        y: dy
      };
    },

    /**
     * Distance from an edge to snap to the nearest grid-line, assuming the
     * grid has lines which are spacing apart.
     */
    distanceToGridLine: function( spacing ) {
      var aabb = this.aabb();

      var left   = Geometry.distanceToGridLine( aabb.x0, spacing ),
          right  = Geometry.distanceToGridLine( aabb.x1, spacing ),
          top    = Geometry.distanceToGridLine( aabb.y0, spacing ),
          bottom = Geometry.distanceToGridLine( aabb.y1, spacing );

      var dx = Geometry.minMagnitude( left, right ),
          dy = Geometry.minMagnitude( top, bottom );

      return {
        x: dx,
        y: dy
      };
    },

    /**
     * Set left edge to x.
     */
    left: function( x ) {
      var x0 = this.get( 'x' );
      this.set({
        x: x,
        width: this.get( 'width' ) + ( x0 - x )
      });
    },

    /**
     * Set right edge to x.
     */
    right: function( x ) {
      var x0 = this.get( 'x' );
      this.set( 'width', x - x0 );
    },

    /**
     * Set top edge to y.
     */
    top: function( y ) {
      var y0 = this.get( 'y' );
      this.set({
        y: y,
        height: this.get( 'height' ) + ( y0 - y )
      });
    },

    /**
     * Set bottom edge to y.
     */
    bottom: function( y ) {
      var y0 = this.get( 'y' );
      this.set( 'height', y - y0 );
    },

    /**
     * Ensures that dimensions are positive.
     */
    positiveDimensions: function() {
      var x = this.get( 'x' ),
          y = this.get( 'y' ),
          width  = this.get( 'width'  ),
          height = this.get( 'height' );

      if ( width < 0 ) {
        this.set({
          x: x + width,
          width: -width
        });
      }

      if ( height < 0 ) {
        this.set({
          y: y + height,
          height: -height
        });
      }
    }
  });

  Rect.Corner = Corner;
  Rect.Edge   = Edge;

  return Rect;
});
