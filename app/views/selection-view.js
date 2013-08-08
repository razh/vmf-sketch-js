define(
  [ 'underscore',
    'backbone',
    'views/rect-view' ],
  function( _, Backbone, RectView ) {
    'use strict';

    var SelectionView = Backbone.View.extend({
      initialize: function() {
        _.bindAll( this, 'render' );
        this.listenTo( this.collection, 'reset', this.render );

        this.rectView = null;
      },

      render: function() {
        // Remove any preexisting RectView.
        if ( this.rectView ) {
          // Don't redraw if same model.
          if ( this.rectView.model === this.collection.at(0) ) {
            return;
          }

          this.rectView.undelegateEvents();
          this.rectView.remove();
        }

        if ( this.collection.size() ) {
          this.$el.append( '<div id="rect-view"></div>' );

          this.rectView = new RectView({
            el: this.$el.find( '#rect-view' )[0],
            model: this.collection.at(0)
          });

          this.rectView.render();
        }

        return this;
      }
    });

    return SelectionView;
  }
);
