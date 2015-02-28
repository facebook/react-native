'use strict';

// Bug with Jest because we're going to the node_modules that is a sibling
// of what jest thinks our root (the dir with the package.json) should be.

module.exports = require.requireActual('q');
