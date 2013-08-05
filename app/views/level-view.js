define(
  [ 'underscore',
    'backbone',
    'views/level-view-input' ],
  function( _, Backbone, Input ) {
    'use strict';

    var LevelView = Backbone.View.extend({
      initialize: function() {
        _.bindAll( this, 'render' );
        this.listenTo( this.collection, 'change add remove', this.render );

        // Setup controls.
        this.input = new Input( this.el, this.collection );

        this.$el.on({
          mousedown: this.input.mousedown,
          mousemove: this.input.mousemove,
          mouseup: this.input.mouseup
        });
      },

      render: function() {
        var ctx = this.$el.get(0).getContext( '2d' );

        ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height );

        this.collection.each(function( object ) {
          object.draw( ctx );
        });
      }
    });

    return LevelView;
  }
);
