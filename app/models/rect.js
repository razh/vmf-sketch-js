define(
  [ 'backbone', 'id' ],
  function( Backbone, Id ) {
    'use strict';

    var Rect = Backbone.Model.extend({
      defaults: function() {
        return {
          id: Id.nextUid(),
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
      },

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

      contains: function( x, y ) {
        var aabb = this.aabb();

        return aabb.x0 <= x && x <= aabb.x1 &&
               aabb.y0 <= y && y <= aabb.y1;
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
            // Right edge of this to left edge of rect.
            rightLeft = aabb1.x0 - aabb0.x1,
            // Top edge of this to bottom edge of rect.
            topBottom = aabb1.y1 - aabb0.y0,
            // Bottom edge of this to top edge of rect.
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
