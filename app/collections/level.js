define(
  [ 'backbone', 'models/rect' ],
  function( Backbone, Rect ) {
    'use strict';

    var Level = Backbone.Collection.extend({
      model: Rect,

      // Returns all objects which contain the point (x, y).
      hit: function( x, y ) {
        return this.filter(function( object ) {
          return object.contains( x, y );
        });
      }
    });

    return Level;
  }
);
