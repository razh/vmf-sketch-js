define(
  [ 'jquery',
    'underscore',
    'backbone',
    'models/rect',
    'text!templates/rect-view.html' ],
  function( $, _, Backbone, Rect, rectTemplate ) {
    'use strict';

    var RectView = Backbone.View.extend({
      template: _.template( rectTemplate ),

      events: {
        'change input': 'change'
      },

      initialize: function() {
        _.bindAll( this, 'render' );
        this.listenTo( this.model, 'change', this.update );
      },

      render: function() {
        this.$el.html( this.template({ rect: this.model.toJSON() }) );
        return this;
      },

      update: function() {
        var changedAttributes = this.model.changedAttributes();
        for ( var attr in changedAttributes ) {
          this.$( '#' + attr ).val( changedAttributes[ attr ] );
        }
      },

      change: function( event ) {
        var target = event.currentTarget,
            value  = parseInt( $( target ).val(), 10 );

        this.model.set( target.id, value );
        // Make sure we don't have negative dimensions.
        this.model.positiveDimensions();
      }
    });

    return RectView;
  }
);
