define(function() {
  'use strict';

  function Memento( object, attrs ) {
    this.object = object || null;
    this.attrs = attrs || null;
  }

  return Memento;
});
