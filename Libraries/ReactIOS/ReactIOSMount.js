/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ReactIOSMount
 */
'use strict';

var RCTUIManager = require('NativeModules').UIManager;

var ReactIOSTagHandles = require('ReactIOSTagHandles');
var ReactPerf = require('ReactPerf');
var ReactReconciler = require('ReactReconciler');
var ReactUpdates = require('ReactUpdates');

var emptyObject = require('emptyObject');
var instantiateReactComponent = require('instantiateReactComponent');
var invariant = require('invariant');

var TOP_ROOT_NODE_IDS = {};

function instanceNumberToChildRootID(rootNodeID, instanceNumber) {
  return rootNodeID + '[' + instanceNumber + ']';
}

/**
 * Mounts this component and inserts it into the DOM.
 *
 * @param {ReactComponent} componentInstance The instance to mount.
 * @param {number} rootID ID of the root node.
 * @param {number} container container element to mount into.
 * @param {ReactReconcileTransaction} transaction
 */
function mountComponentIntoNode(
    componentInstance,
    rootID,
    container,
    transaction) {
  var markup = ReactReconciler.mountComponent(
    componentInstance, rootID, transaction, emptyObject
  );
  componentInstance._isTopLevel = true;
  ReactIOSMount._mountImageIntoNode(markup, container);
}

/**
 * Batched mount.
 *
 * @param {ReactComponent} componentInstance The instance to mount.
 * @param {number} rootID ID of the root node.
 * @param {number} container container element to mount into.
 */
function batchedMountComponentIntoNode(
    componentInstance,
    rootID,
    container) {
  var transaction = ReactUpdates.ReactReconcileTransaction.getPooled();
  transaction.perform(
    mountComponentIntoNode,
    null,
    componentInstance,
    rootID,
    container,
    transaction
  );
  ReactUpdates.ReactReconcileTransaction.release(transaction);
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

    // The initial render is synchronous but any updates that happen during
    // rendering, in componentWillMount or componentDidMount, will be batched
    // according to the current batching strategy.

    ReactUpdates.batchedUpdates(
      batchedMountComponentIntoNode,
      instance,
      childRootNodeID,
      topRootNodeID
    );
  },

  /**
   * @param {View} view View tree image.
   * @param {number} containerViewID View to insert sub-view into.
   */
  _mountImageIntoNode: ReactPerf.measure(
    // FIXME(frantic): #4441289 Hack to avoid modifying react-tools
    'ReactComponentBrowserEnvironment',
    'mountImageIntoNode',
    function(mountImage, containerID) {
      // Since we now know that the `mountImage` has been mounted, we can
      // mark it as such.
      ReactIOSTagHandles.associateRootNodeIDWithMountedNodeHandle(
        mountImage.rootNodeID,
        mountImage.tag
      );
      var addChildTags = [mountImage.tag];
      var addAtIndices = [0];
      RCTUIManager.manageChildren(
        ReactIOSTagHandles.mostRecentMountedNodeHandleForRootNodeID(containerID),
        null,         // moveFromIndices
        null,         // moveToIndices
        addChildTags,
        addAtIndices,
        null          // removeAtIndices
      );
    }
  ),

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
    RCTUIManager.removeRootView(containerTag);
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
    RCTUIManager.removeSubviewsFromContainerWithID(containerTag);
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
