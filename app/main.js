requirejs.config({
  shim: {
    'underscore': {
      exports: '_'
    },
    'backbone': {
      deps: [ 'jquery', 'underscore' ],
      exports: 'Backbone'
    }
  },

  paths: {
    'backbone': 'components/backbone/backbone-min',
    'jquery': 'components/jquery/jquery.min',
    'underscore': 'components/underscore/underscore-min',
    'text': 'components/requirejs-text/text'
  }
});

define(
  [ 'models/editor',
    'models/rect',
    'collections/level',
    'views/editor-view',
    'views/selection-view' ],
  function( Editor, Rect, Level, EditorView, SelectionView ) {
    'use strict';

    var rect0 = new Rect({
      x: 16,
      y: 32,
      width: 64,
      height: 64
    });

    console.log( rect0.toJSON() );

    var rect1 = new Rect({
      x: 64,
      y: 128,
      width: 32,
      height: 64
    });

    console.log( rect1.toJSON() );

    var rect2 = new Rect({
      x: 128,
      y: 64,
      width: 32,
      height: 32
    });

    console.log( rect2.toJSON() );

    var level = new Level();

    level.add([
      rect0,
      rect1,
      rect2
    ]);

    var canvas = document.getElementById( 'editor-view' );

    canvas.width = 800;
    canvas.height = 600;

    var editor = new Editor();

    var selectionView = new SelectionView({
      el: '#selection-view',
      collection: editor.get( 'selection' )
    });

    var editorView = new EditorView({
      el: '#editor-view',
      model: editor,
      collection: level
    });

    editorView.render();
    selectionView.render();
  }
);
