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
      this.object.set( this.state );
    }
  };

  return Memento;
});
