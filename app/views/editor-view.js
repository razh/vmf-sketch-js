define(
  [ 'underscore',
    'backbone',
    'config',
    'models/editor-state',
    'views/editor-view-input' ],
  function( _, Backbone, Config, State, Input ) {
    'use strict';

    var EditorView = Backbone.View.extend({
      initialize: function() {
        _.bindAll( this, 'render' );
        this.listenTo( this.model, 'change', this.render );
        this.listenTo( this.collection, 'change add remove', this.render );

        // Setup controls.
        this.input = new Input( this.el, this.model, this.collection );

        this.$el.on({
          mousedown: this.input.mousedown,
          mousemove: this.input.mousemove,
          mouseup: this.input.mouseup
        });

        this.ctx = this.el.getContext( '2d' );
      },

      render: function() {
        var ctx    = this.ctx,
            width  = ctx.canvas.width,
            height = ctx.canvas.height;

        ctx.clearRect( 0, 0, width, height );

        this.collection.each(function( object ) {
          object.draw( ctx );
        });

        if ( this.model.get( 'state' ) === State.DRAW ) {
          var mouse  = this.input.mouse,
              rx     = mouse.start.x,
              ry     = mouse.start.y,
              rw     = mouse.end.x - rx,
              rh     = mouse.end.y - ry;

          ctx.beginPath();
          ctx.rect( rx, ry, rw, rh );

          ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
          ctx.fill();

          ctx.strokeStyle = 'black';
          ctx.stroke();
        }
      }
    });

    return EditorView;
  }
);
