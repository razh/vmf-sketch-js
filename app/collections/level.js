define(
  [ 'backbone', 'models/rect' ],
  function( Backbone, Rect ) {
    'use strict';

    var Level = Backbone.Collection.extend({
      model: Rect
    });

    return Level;
  }
);
