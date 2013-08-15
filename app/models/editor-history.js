define([
  'underscore',
  'models/memento'
], function( _, Memento ) {
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

      if ( _.isArray( object ) ) {
        this.current = object.map(function( element ) {
          return new Memento( element );
        });
      } else {
        this.current = new Memento( object );
      }

      this.redoStack = [];
    },

    /**
     * Time travel towards the forwardStack and away from the backwardStack.
     */
    timeTravel: function( forwardStack, backwardStack ) {
      // Don't do anything if we can't time travel further.
      if ( !forwardStack.length ) {
        return;
      }

      if ( this.current ) {
        backwardStack.push( this.current );
      }

      this.current = forwardStack.pop();

      // The current state is an array of mementos.
      if ( _.isArray( this.current ) ) {
        this.current.forEach(function( memento ) {
          memento.restore();
        });
      } else {
        this.current.restore();
      }

      return this;
    },

    undo: function() { return this.timeTravel( this.undoStack, this.redoStack ); },
    redo: function() { return this.timeTravel( this.redoStack, this.undoStack ); },

    clear: function() {
      this.undoStack = [];
      this.redoStack = [];
    }
  };

  return EditorHistory;
});
