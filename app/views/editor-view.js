define([
  'underscore',
  'backbone',
  'config',
  'models/editor',
  'views/editor-view-input'
], function( _, Backbone, Config, Editor, Input ) {
  'use strict';

  var State = Editor.State;

  var EditorView = Backbone.View.extend({
    initialize: function() {
      _.bindAll( this, 'render' );
      this.listenTo( this.model, 'change', this.render );
      this.listenTo( this.collection, 'change add remove', this.render );

      // Setup controls.
      this.input = new Input( this );

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

      // Draw gridlines.
      var gridSpacing = Config.grid,
          gridCountX  = Math.ceil( width  / gridSpacing ),
          gridCountY  = Math.ceil( height / gridSpacing );

      ctx.beginPath();

      var i;
      for ( i = 1; i < gridCountX; i++ ) {
        ctx.moveTo( i * gridSpacing, 0 );
        ctx.lineTo( i * gridSpacing, height );
      }

      for ( i = 1; i < gridCountY; i++ ) {
        ctx.moveTo( 0,     i * gridSpacing );
        ctx.lineTo( width, i * gridSpacing );
      }

      ctx.lineWidth = Config.gridLineWidth;
      ctx.strokeStyle = Config.gridStroke;
      ctx.stroke();

      // Draw objects.
      ctx.beginPath();

      this.collection.each(function( object ) {
        object.draw( ctx );
      });

      ctx.fillStyle = Config.fill;
      ctx.fill();

      ctx.lineWidth = Config.lineWidth;
      ctx.strokeStyle = Config.stroke;
      ctx.stroke();

      // Draw resize handlers on selected rects.
      var size = Config.resizeLength;
      this.model.get( 'selection' ).each(function( object ) {
        object.drawResizeHandlers( ctx, size );
      });

      if ( this.model.get( 'state' ) === State.DRAW ) {
        var mouse = this.input.mouse,
            rx    = mouse.start.x,
            ry    = mouse.start.y,
            rw    = mouse.end.x - rx,
            rh    = mouse.end.y - ry;

        ctx.beginPath();
        ctx.rect( rx, ry, rw, rh );

        ctx.fillStyle = Config.drawFill;
        ctx.fill();

        ctx.lineWidth = Config.drawLineWidth;
        ctx.strokeStyle = Config.drawStroke;
        ctx.stroke();
      }

      ctx.fillStyle = Config.debugFill;
      ctx.font = Config.debugFont;
      ctx.fillText( this.model.get( 'state' ) + ', ' + this.input.mouse.down, 20, 30 );
    }
  });

  return EditorView;
});
