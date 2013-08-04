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
      }
    });

    return Rect;
  }
);
