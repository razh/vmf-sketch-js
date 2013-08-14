define([
  'backbone'
], function( Backbone ) {
  'use strict';

  function Memento( object ) {
    this.object = object || null;
    this.state  = this.object.toJSON();
  }

  Memento.prototype = {
    restore: function() {
      if ( this.object instanceof Backbone.Model ) {
        this.object.set( this.state );
      } else if ( this.object instanceof Backbone.Collection ) {
        this.object.reset( this.state );
      }
    }
  };

  return Memento;
});
