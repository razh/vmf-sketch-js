define([
  'backbone'
], function( Backbone ) {
  'use strict';

  function Memento( target ) {
    this.target = target || null;
    this.state  = this.target.toJSON();
  }

  Memento.prototype = {
    restore: function() {
      this.target.set( this.state );
    },

    /**
     * Makes sure that our target references the one in collection.
     */
    reference: function( collection ) {
      if ( this.target instanceof Backbone.Collection ) {
        return;
      }

      var target = collection.get( this.state.cid );
      if ( !target ) {
        return;
      }

      this.target = target;
    }
  };

  return Memento;
});
