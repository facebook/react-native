/**
 * @providesModule Dimensions
 * @flow
 */
'use strict';

var invariant = require('invariant');

var dimensions = {

    window: {
        scale: window.devicePixelRatio,
        fontScale: window.devicePixelRatio,
        width: 0,
        height: 0,
    },

};

var updateWindowSize = function() {
    dimensions.window.width = window.innerWidth;
    dimensions.window.height = window.innerHeight;
};
updateWindowSize();
window.addEventListener('resize', updateWindowSize);

class Dimensions {
  
    static set(dims: {[key:string]: any}): bool {
        Object.assign(dimensions, dims);
        return true;
    }

    static get(dim: string): Object {
        invariant(dimensions[dim], 'No dimension set for key ' + dim);
        return dimensions[dim];
    }

}

module.exports = Dimensions;
