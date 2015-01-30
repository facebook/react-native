var HasteDependencyResolver = require('./haste');
var NodeDependencyResolver = require('./node');

module.exports = function createDependencyResolver(options) {
  if (options.moduleFormat === 'haste') {
    return new HasteDependencyResolver(options);
  } else if (options.moduleFormat === 'node') {
    return new NodeDependencyResolver(options);
  } else {
    throw new Error('unsupported');
  }
};
