/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ReactIOSMount
 */
'use strict';

var RKUIManager = require('NativeModulesDeprecated').RKUIManager;

var ReactIOSTagHandles = require('ReactIOSTagHandles');
var ReactPerf = require('ReactPerf');

var instantiateReactComponent = require('instantiateReactComponent');
var invariant = require('invariant');

var TOP_ROOT_NODE_IDS = {};

function instanceNumberToChildRootID(rootNodeID, instanceNumber) {
  return rootNodeID + '[' + instanceNumber + ']';
}

/**
 * As soon as `ReactMount` is refactored to not rely on the DOM, we can share
 * code between the two. For now, we'll hard code the ID logic.
 */
var ReactIOSMount = {
  instanceCount: 0,

  _instancesByContainerID: {},

  /**
   * @param {ReactComponent} instance Instance to render.
   * @param {containerTag} containerView Handle to native view tag
   */
  renderComponent: function(descriptor, containerTag) {
    var instance = instantiateReactComponent(descriptor);

    if (!ReactIOSTagHandles.reactTagIsNativeTopRootID(containerTag)) {
      console.error('You cannot render into anything but a top root');
      return;
    }

    var topRootNodeID = ReactIOSTagHandles.allocateRootNodeIDForTag(containerTag);
    ReactIOSTagHandles.associateRootNodeIDWithMountedNodeHandle(
      topRootNodeID,
      containerTag
    );
    TOP_ROOT_NODE_IDS[topRootNodeID] = true;

    var childRootNodeID = instanceNumberToChildRootID(
      topRootNodeID,
      ReactIOSMount.instanceCount++
    );
    ReactIOSMount._instancesByContainerID[topRootNodeID] = instance;
    instance.mountComponentIntoNode(childRootNodeID, topRootNodeID);
  },

  /**
   * Standard unmounting of the component that is rendered into `containerID`,
   * but will also execute a command to remove the actual container view
   * itself. This is useful when a client is cleaning up a React tree, and also
   * knows that the container will no longer be needed. When executing
   * asynchronously, it's easier to just have this method be the one that calls
   * for removal of the view.
   */
  unmountComponentAtNodeAndRemoveContainer: function(containerTag) {
    ReactIOSMount.unmountComponentAtNode(containerTag);
    // call back into native to remove all of the subviews from this container
    RKUIManager.removeRootView(containerTag);
  },

  /**
   * Unmount component at container ID by iterating through each child component
   * that has been rendered and unmounting it. There should just be one child
   * component at this time.
   */
  unmountComponentAtNode: function(containerTag) {
    var containerID = ReactIOSTagHandles.tagToRootNodeID[containerTag];

    invariant(
      TOP_ROOT_NODE_IDS[containerID],
      'We only currently support removing components from the root node'
    );
    var instance = ReactIOSMount._instancesByContainerID[containerID];
    if (!instance) {
      console.error('Tried to unmount a component that does not exist');
      return false;
    }
    ReactIOSMount.unmountComponentFromNode(instance, containerID);
    delete ReactIOSMount._instancesByContainerID[containerID];
    delete TOP_ROOT_NODE_IDS[containerID];
    return true;
  },

  /**
   * Unmounts a component and sends messages back to iOS to remove its subviews.
   *
   * @param {ReactComponent} instance React component instance.
   * @param {int} containerID ID of container we're removing from.
   * @final
   * @internal
   * @see {ReactIOSMount.unmountComponentAtNode}
   */
  unmountComponentFromNode: function(instance, containerID) {
    // call back into native to remove all of the subviews from this container
    instance.unmountComponent();
    var containerTag =
      ReactIOSTagHandles.mostRecentMountedNodeHandleForRootNodeID(containerID);
    RKUIManager.removeSubviewsFromContainerWithID(containerTag);
  },

  getNode: function(id) {
    return id;
  }
};

ReactIOSMount.renderComponent = ReactPerf.measure(
  'ReactMount',
  '_renderNewRootComponent',
  ReactIOSMount.renderComponent
);

module.exports = ReactIOSMount;
