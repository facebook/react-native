/**
 * @providesModule UniversalWorkerNodeHandle
 */

var ReactIOSTagHandles = require('ReactIOSTagHandles');

var invariant = require('invariant');

var UniversalWorkerNodeHandle = {
  getRootNodeID: function(nodeHandle) {
    invariant(
      nodeHandle !== undefined && nodeHandle !== null && nodeHandle !== 0,
      'No node handle defined'
    );
    return ReactIOSTagHandles.tagToRootNodeID[nodeHandle];
  }
};

module.exports = UniversalWorkerNodeHandle;
