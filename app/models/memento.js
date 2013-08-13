define([
  'backbone'
], function( Backbone ) {
  'use strict';

  function Memento( object ) {
    this.object = object || null;
    this.attrs = this.object.toJSON();
  }

  Memento.prototype = {
    restore: function() {
      if ( this.object instanceof Backbone.Model ) {
        this.object.set( this.attrs );
      } else if ( this.object instanceof Backbone.Collection ) {
        this.object.reset( this.attrs );
      }
    }
  };

  return Memento;
});
