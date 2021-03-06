define([
  'backbone'
], function( Backbone ) {
  'use strict';

  function Memento( target ) {
    this.target = target || null;
    this.state  = target ? target.toJSON() : {};
  }

  Memento.prototype = {
    restore: function() {
      if ( this.target ) {
        this.target.set( this.state );
      }
    },

    /**
     * Makes sure that our target references the same object in collection.
     * Don't do anything if the target is not in the collection.
     */
    reference: function( collection ) {
      if ( !collection || this.target instanceof Backbone.Collection ) {
        return;
      }

      var target = collection.get( this.state.id );
      if ( !target ) {
        return;
      }

      this.target = target;
    }
  };

  return Memento;
});
