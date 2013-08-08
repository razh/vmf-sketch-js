define(
  [ 'backbone',
    'collections/selection' ],
  function( Backbone, Selection ) {
    'use strict';

    var State = {
      DEFAULT:   0,
      DRAW:      1,
      SELECT:    2,
      TRANSFORM: 3
    };

    /**
     * Container for drawables that are not part of the level.
     * This is all temporary data for a session. We use a model so we can detect
     * changes in EditorView.
     */
    var Editor = Backbone.Model.extend({
      defaults: function() {
        return {
          state: State.DEFAULT,
          guides: {
            horz: [],
            vert: []
          },
          selection: new Selection()
        };
      }
    });

    Editor.State = State;

    return Editor;
  }
);
