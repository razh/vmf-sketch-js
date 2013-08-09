define([
  'backbone',
  'models/rect'
], function( Backbone, Rect ) {
  'use strict';

  var Selection = Backbone.Collection.extend({
    model: Rect
  });

  return Selection;
});
