define(
  [ 'backbone',
    'models/editor-state' ],
  function( Backbone, State ) {
    'use strict';

    /**
     * Container for drawables that are not part of the level.
     */
    var Editor = Backbone.Model.extend({
      defaults: function() {
        return {
          state: State.DEFAULT,
          guides: {
            horz: [],
            vert: []
          }
        };
      }
    });

    return Editor;
  }
);
