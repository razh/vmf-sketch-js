define(
  [ 'backbone', 'math/geometry' ],
  function( Backbone, Geometry ) {
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
          x: 0,
          y: 0,
          width: 0,
          height: 0,

          resizeLength: 8
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
        ctx.beginPath();

        ctx.rect(
          this.get( 'x' ),
          this.get( 'y' ),
          this.get( 'width' ),
          this.get( 'height' )
        );

        ctx.fillStyle = 'rgba(0, 0, 255, 0.25)';
        ctx.fill();

        ctx.strokeStyle = 'black';
        ctx.stroke();
      },

      drawResizeHandlers: function( ctx ) {
        var x = this.get( 'x' ),
            y = this.get( 'y' ),
            width  = this.get( 'width' ),
            height = this.get( 'height' );

        // Draw resize handlers.
        var length     = this.get( 'resizeLength' ),
            halfLength = 0.5 * length;

        ctx.beginPath();

        // Corners.
        // Top lefts of resize handler rects.
        var x0 = x - halfLength,
            y0 = y - halfLength,
            x1 = x + width  - halfLength,
            y1 = y + height - halfLength;

        // Starting from top-left corner and going clockwise.
        ctx.rect( x0, y0, length, length );
        ctx.rect( x0, y1, length, length );
        ctx.rect( x1, y0, length, length );
        ctx.rect( x1, y1, length, length );

        // Edges.
        var halfWidth  = 0.5 * width,
            halfHeight = 0.5 * height,
            // Middle of edges.
            mx = x0 + halfWidth,
            my = y0 + halfHeight;

        // Starting from left edge and going clockwise.
        ctx.rect( x0, my, length, length );
        ctx.rect( mx, y0, length, length );
        ctx.rect( x1, my, length, length );
        ctx.rect( mx, y1, length, length );

        ctx.fillStyle = 'white';
        ctx.fill();

        ctx.strokeStyle = 'black';
        ctx.stroke();
      },

      contains: function( x, y ) {
        var aabb = this.aabb();
        return Geometry.aabbContains( x, y, aabb.x0, aabb.y0, aabb.x1, aabb.y1 );
      },

      handler: function( x, y ) {
        var rx = this.get( 'x' ),
            ry = this.get( 'y' ),
            width  = this.get( 'width' ),
            height = this.get( 'height' );

        // Length of resize handler side.
        var halfLength = 0.5 * this.get( 'resizeLength' );

        var halfWidth  = 0.5 * width,
            halfHeight = 0.5 * height;

        /**
         * x0  x1   x2  x3   x4  x5
         *  .__.     .__.     .__.
         *  |  |-----|  |-----|  |
         */

        var x0 = rx - halfLength,
            x1 = rx + halfLength,
            x2 = rx + halfWidth - halfLength,
            x3 = rx + halfWidth + halfLength,
            x4 = rx + width - halfLength,
            x5 = rx + width + halfLength;

        // Same order as above, but going from top to bottom.
        var y0 = ry - halfLength,
            y1 = ry + halfLength,
            y2 = ry + halfHeight - halfLength,
            y3 = ry + halfHeight + halfLength,
            y4 = ry + height - halfLength,
            y5 = ry + height + halfLength;

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

        var left   = Math.abs( leftRight ) < Math.abs( leftLeft     ) ? leftRight : leftLeft,
            right  = Math.abs( rightLeft ) < Math.abs( rightRight   ) ? rightLeft : rightRight,
            top    = Math.abs( topBottom ) < Math.abs( topTop       ) ? topBottom : topTop,
            bottom = Math.abs( bottomTop ) < Math.abs( bottomBottom ) ? bottomTop : bottomBottom;

        var dx = Math.abs( left ) < Math.abs( right  ) ? left : right,
            dy = Math.abs( top  ) < Math.abs( bottom ) ? top  : bottom;

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
        this.set( 'x', x );
        this.set( 'width', this.get( 'width' ) + ( x0 - x ) );
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
        this.set( 'y', y );
        this.set( 'height', this.get( 'height' ) + ( y0 - y ) );
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
        var width  = this.attributes.width,
            height = this.attributes.height;

        if ( width < 0 ) {
          this.attributes.x += width;
          this.attributes.width = -width;
        }

        if ( height < 0 ) {
          this.attributes.y += height;
          this.attributes.height = -height;
        }
      }
    });

    Rect.Corner = Corner;
    Rect.Edge   = Edge;

    return Rect;
  }
);
