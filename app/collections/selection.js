define(
  [ 'backbone',
    'models/rect' ],
  function( Backbone, Rect ) {

    var Selection = Backbone.Collection.extend({
      model: Rect
    });

    return Selection;
  }
);
