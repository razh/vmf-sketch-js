define([
  'models/memento'
], function( Memento ) {
  'use strict';

  function EditorHistory() {
    this.current = null;

    this.undoStack = [];
    this.redoStack = [];
  }

  EditorHistory.prototype = {
    /**
     * Save an object's attributes.
     * Wipes the redo stack.
     */
    save: function( object ) {
      if ( this.current ) {
        this.undoStack.push( this.current );
      }

      this.current = new Memento( object );
      this.redoStack = [];
    },

    undo: function() {
      if ( !this.undoStack.length ) {
        return;
      }

      if ( this.current ) {
        this.redoStack.push( this.current );
      }

      this.current = this.undoStack.pop();
      this.current.restore();
    },

    redo: function() {
      if ( !this.redoStack.length ) {
        return;
      }

      if ( this.current ) {
        this.undoStack.push( this.current );
      }

      this.current = this.redoStack.pop();
      this.current.restore();
    },

    clear: function() {
      this.undoStack = [];
      this.redoStack = [];
    }
  };

  return EditorHistory;
});
