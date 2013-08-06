define(
  [ 'backbone', 'math/geometry' ],
  function( Backbone, Geometry ) {
    'use strict';

    var Rect = Backbone.Model.extend({
      defaults: function() {
        return {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
      },

      initialize: function() {
        // Make sure we handle negative dimensions.
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
        var length     = 6,
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

      /**
       * Determine if the point is close to a corner.
       * Starting from bottom-right and going counterclockwise.
       */
      nearCorner: function( x, y, radius ) {
        var aabb = this.aabb();

        var x0 = aabb.x0,
            y0 = aabb.y0,
            x1 = aabb.x1,
            y1 = aabb.y1;

        // Distance (squared) to bottom right, and so on.
        var bottomRight = Geometry.distanceSquared( x, y, x1, y1 ),
            topRight    = Geometry.distanceSquared( x, y, x1, y0 ),
            topLeft     = Geometry.distanceSquared( x, y, x0, y0 ),
            bottomLeft  = Geometry.distanceSquared( x, y, x0, y1 );

        var radiusSquared = radius * radius;
      },

      /**
       * Determine if the point is close to an edge.
       */
      nearEdge: function( x, y, radius ) {
        var aabb = this.aabb();

        var x0 = aabb.x0,
            y0 = aabb.y0,
            x1 = aabb.x1,
            y1 = aabb.y1;

        var top    = Geometry.pointSegmentDistanceSquared( x, y, x0, y0, x1, y0 ),
            right  = Geometry.pointSegmentDistanceSquared( x, y, x1, y0, x1, y1 ),
            bottom = Geometry.pointSegmentDistanceSquared( x, y, x1, y1, x0, y1 ),
            left   = Geometry.pointSegmentDistanceSquared( x, y, x1, y1, x0, y1 );

        var radiusSquared = radius * radius;
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
      }
    });

    return Rect;
  }
);
