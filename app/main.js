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
  [ 'models/rect' ],
  function( Rect ) {
    'use strict';

    var rect = new Rect();
    console.log( rect.toJSON() );

    var rect1 = new Rect();
    console.log( rect1.toJSON() );

    var rect2 = new Rect();
    console.log( rect2.toJSON() );


  }
);
