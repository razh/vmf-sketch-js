define(
  [ 'underscore',
    'backbone',
    'config',
    'models/editor',
    'views/editor-view-input' ],
  function( _, Backbone, Config, Editor, Input ) {
    'use strict';

    var State = Editor.State;

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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, 0, width, height);

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

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.25)';
        ctx.stroke();

        // Draw objects.
        this.collection.each(function( object ) {
          object.draw( ctx );
        });

        // Draw resize handlers on selected rects.
        this.input.selected().forEach(function( object ) {
          object.drawResizeHandlers( ctx );
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

        ctx.fillStyle = 'black';
        ctx.font = '20px Helvetica';
        ctx.fillText( this.model.get( 'state' ) + ', ' + this.input.mouse.down, 20, 30 );
      }
    });

    return EditorView;
  }
);
