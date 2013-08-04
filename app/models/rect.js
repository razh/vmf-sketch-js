define(
  [ 'backbone', 'id' ],
  function( Backbone, Id ) {
    'use strict';

    var Rect = Backbone.Model.extend({
      defaults: function() {
        return {
          id: Id.nextUid(),
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
      }
    });

    return Rect;
  }
);
