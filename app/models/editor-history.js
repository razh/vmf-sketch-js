define([
  'underscore',
  'backbone',
  'models/memento'
], function( _, Backbone, Memento ) {
  'use strict';

  /**
   * A state is an array of Mementos.
   */
  function EditorHistory() {
    this.current = null;

    this.undoStack = [];
    this.redoStack = [];

    // Store a state to determine whether we've changed a model/collection.
    this.previousState = null;
  }

  /**
   * There are four types of history states:
   * - A Backbone.Model.
   * - A Backbone.Collection.
   * - An array of Backbone.Models.
   * - An array of Backbone.Collections.
   *
   * These states are all stored as an array of Mementos.
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
     * Returns an array of mementos.
     */
    snapshot: function( target ) {
      if ( _.isArray( target ) ) {
        return target.map(function( element ) {
          return new Memento( element );
        });
      }

      return [ new Memento( target ) ];
    },

    /**
     * Begin tracking a target.
     */
    begin: function( target ) {
      // Can't track nothing.
      if ( _.isEmpty( target ) ) {
        return;
      }

      this.previousState = this.snapshot( target );
      // Save if we don't have a baseline history.
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

      // What do we know has already changed?
      var currentTargets = this.current ? this.current.map(function( memento ) {
        return memento.target;
      }) : [];

      // Get all mementos that have changed since begin() was called.
      var mementos = this.previousState.filter(function( memento ) {
        return !_.isEqual( memento.state, memento.target.toJSON() );
      });

      var targets = mementos.map(function( memento ) {
        return memento.target;
      });

      // Save the previous state if current does not already know about it.
      // TODO: Doesn't handle transforming one element, then an array of elements.
      if ( _.difference( currentTargets, targets ).length ) {
        this.current = this.current.concat( mementos );
      }

      // Save only if we have anything to save.
      if ( targets.length ) {
        // Don't save it as an array if there's only one object.
        this.save( targets );
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

      var that = this;
      this.current.forEach(function( memento ) {
        memento.restore();

        // Restore model references in mementos.
        if ( memento.target instanceof Backbone.Collection ) {
          that.reference( memento.target );
        }
      });

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
        state.forEach(function( memento ) {
          memento.reference( collection );
        });
      });
    }
  };

  return EditorHistory;
});
