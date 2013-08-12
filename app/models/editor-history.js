define(function() {
  'use strict';

  function EditorHistory() {
    this.undoStack = [];
    this.redoStack = [];
  }

  EditorHistory.prototype = {
    /**
     * Saves a history state.
     */
    store: function( memento ) {
      this.undoStack.push( memento );
      this.redoStack = [];
    },

    undo: function() {

    },

    redo: function() {

    }
  };

  return EditorHistory;
});
