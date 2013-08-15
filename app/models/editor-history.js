define([
  'underscore',
  'backbone',
  'models/memento'
], function( _, Backbone, Memento ) {
  'use strict';

  function EditorHistory() {
    this.current = null;

    this.undoStack = [];
    this.redoStack = [];
  }

  EditorHistory.prototype = {
    /**
     * Save the target's attributes.
     * Wipes the redo stack.
     */
    save: function( target ) {
      if ( this.current ) {
        this.undoStack.push( this.current );
      }

      if ( _.isArray( target ) ) {
        this.current = target.map(function( element ) {
          return new Memento( element );
        });
      } else {
        this.current = new Memento( target );
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

        // Restore model references in mementos.
        if ( this.current.target instanceof Backbone.Collection ) {
          this.reference( this.current.target );
        }
      }

      return this;
    },

    undo: function() { return this.timeTravel( this.undoStack, this.redoStack ); },
    redo: function() { return this.timeTravel( this.redoStack, this.undoStack ); },

    clear: function() {
      this.undoStack = [];
      this.redoStack = [];
    },

    /**
     * Goes through the undo and redo stacks and rebuilds references to models.
     */
    reference: function( collection ) {
      this.undoStack.concat( this.redoStack ).forEach(function( state ) {
        var mementos = _.isArray( state ) ? state : [ state ];

        mementos.forEach(function( memento ) {
          memento.reference( collection );
        });
      });
    }
  };

  return EditorHistory;
});
