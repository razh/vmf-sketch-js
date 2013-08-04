define(
  [ 'underscore',
    'backbone' ],
  function( _, Backbone ) {
    'use strict';

    var LevelView = Backbone.View.extend({
      initialize: function() {
        _.bindAll( this, 'render' );
        this.listenTo( this.collection, 'change', this.render );
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
