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
    }
  };

  return Memento;
});
