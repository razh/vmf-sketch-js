define([
  'backbone',
  'collections/selection',
  'math/geometry'
], function( Backbone, Selection, Geometry ) {
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

        // Selection and offset positions for each selected object.
        selection: new Selection(),
        // Offsets of selected objects.
        offsets: []
      };
    },

    /**
     * Set selection equal to array and updates the offsets.
     */
    select: function( array ) {
      this.get( 'selection' ).reset( array );
      // Grab the original (x, y) position of each object.
      this.set( 'offsets', this.get( 'selection' ).map( Geometry.position ) );
    },

    /**
     * Select first object in the selection.
     */
    selectFirst: function() {
      if ( this.get( 'selection' ).size() ) {
        this.select( this.get( 'selection' ).at(0) );
      }
    }
  });

  Editor.State = State;

  return Editor;
});
