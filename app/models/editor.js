define(
  [ 'backbone' ],
  function( Backbone ) {
    'use strict';

    var State = {
      DEFAULT:   0,
      DRAW:      1,
      SELECT:    2,
      TRANSFORM: 3
    };

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

    Editor.State = State;

    return Editor;
  }
);
