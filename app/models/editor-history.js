define([
  'models/memento'
], function( Memento ) {
  'use strict';

  function EditorHistory() {
    this.undoStack = [];
    this.redoStack = [];
  }

  EditorHistory.prototype = {
    /**
     * Save an object's attributes.
     * Wipes the redo stack.
     */
    save: function( object ) {
      this.undoStack.push( new Memento( object ) );
      this.redoStack = [];
    },

    undo: function() {
      if ( !this.undoStack.length ) {
        return;
      }

      // If the redo stack is empty, we are at the current state.
      // Push the current state to the redo stack.
      if ( !this.redoStack.length ) {
        this.redoStack.push( this.undoStack.pop() );
      }

      var memento = this.undoStack.pop();
      memento.restore();
      this.redoStack.push( memento );
    },

    redo: function() {
      if ( !this.redoStack.length ) {
        return;
      }

      // Similarily, if the undo stack is empty, we somewhere to start off from.
      // So push the most recent undone state to the undo stack.
      if ( !this.undoStack.length ) {
        this.undoStack.push( this.redoStack.pop() );
      }

      var memento = this.redoStack.pop();
      memento.restore();
      this.undoStack.push( memento );
    },

    clear: function() {
      this.undoStack = [];
      this.redoStack = [];
    }
  };

  return EditorHistory;
});
