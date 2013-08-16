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

    // Store a state to determine whether we've changed a model/collection.
    this.previousState = null;
  }

  /**
   * There are three types of history states:
   * - A Backbone.Model.
   * - A Backbone.Collection.
   * - An array of Backbone.Models.
   */
  EditorHistory.prototype = {
    /**
     * Save the target's attributes.
     * Wipes the redo stack.
     */
    save: function( target ) {
      if ( this.current ) {
        this.undoStack.push( this.current );
      }

      this.current = this.snapshot( target );
      this.redoStack = [];
    },

    /**
     * Take a snapshot of the current state of the target.
     * Returns an array of mementos if target is an array.
     * Returns a single memento otherwise.
     */
    snapshot: function( target ) {
      if ( _.isArray( target ) ) {
        return target.map(function( element ) {
          return new Memento( element );
        });
      }

      return new Memento( target );
    },

    /**
     * Begin tracking a target.
     */
    begin: function( target ) {
      this.previousState = this.snapshot( target );
      if ( !this.undoStack.length ) {
        this.save( target );
      }
    },

    /**
     * Stop tracking a target and push changes to history if anything changed.
     */
    end: function() {
      if ( !this.previousState ) {
        return;
      }

      if ( _.isArray( this.previousState ) ) {
        // Save changed targets.
        var targets = this.previousState.filter(function( memento ) {
          return !_.isEqual( memento.state, memento.target.toJSON() );
        }).map(function( memento ) {
          return memento.target;
        });

        this.save( targets );
      } else {
        var target = this.previousState.target;
        if ( !_.isEqual( this.previousState.state, target.toJSON() ) ) {
          this.save( target );
        }
      }
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
