define(function() {
  'use strict';

  return {
    grid: 32,

    snap: 12,
    snapping: true,

    // Length of a resize handler side.
    resizeLength: 8,

    fill: 'rgba(0, 0, 255, 0.25)',
    stroke: 'black',
    lineWidth: 1,

    // Temporary rectangle in draw state.
    drawFill: 'rgba(255, 0, 0, 0.25)',
    drawStroke: 'black',
    drawLineWidth: 1,

    gridStroke: 'rgba(255, 0, 0, 0.25)',
    gridLineWidth: 1,

    debugFont: '20px Helvetica',
    debugFill: 'black'
  };
});
