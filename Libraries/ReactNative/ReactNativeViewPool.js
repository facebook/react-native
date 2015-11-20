/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeViewPool
 */
'use strict';

var ReactNativeTagHandles = require('ReactNativeTagHandles');
var ReactNativeAttributePayload = require('ReactNativeAttributePayload');
var RCTUIManager = require('NativeModules').UIManager;
var Platform = require('Platform');

var deepFreezeAndThrowOnMutationInDev = require('deepFreezeAndThrowOnMutationInDev');
var emptyFunction = require('emptyFunction');
var flattenStyle = require('flattenStyle');

var EMPTY_POOL = [[]];

var ENABLED = !!RCTUIManager.dropViews;

/* indicies used for _addToPool arrays */
var TAGS_IDX = 0;
var KEYS_IDX = 1;
var PROPS_IDX = 2;

var _pools = {};
var _poolSize = {};

var layoutOnlyProps = RCTUIManager.layoutOnlyProps;

function isCollapsableForStyle(style) {
  var flatStyle = flattenStyle(style);
  for (var styleKey in flatStyle) {
    if (layoutOnlyProps[styleKey] !== true) {
      return false;
    }
  }
  return true;
}

function isCollapsable(viewRef) {
  var props = viewRef._currentElement.props;
  if (props.collapsable !== undefined && !props.collapsable) {
    return false;
  }
  var validAttributes = viewRef.viewConfig.validAttributes;
  for (var propKey in props) {
    if (!!validAttributes[propKey] && propKey !== 'style' && propKey !== 'collapsable') {
      return false;
    }
  }
  return !props.style || isCollapsableForStyle(viewRef._currentElement.props.style);
}

function enqueueCreate(viewRef, rootTag) {
  var tag = ReactNativeTagHandles.allocateTag();

  if (__DEV__) {
    deepFreezeAndThrowOnMutationInDev(viewRef._currentElement.props);
  }

  var updatePayload = ReactNativeAttributePayload.create(
    viewRef._currentElement.props,
    viewRef.viewConfig.validAttributes
  );

  RCTUIManager.createView(
    tag,
    viewRef.viewConfig.uiViewClassName,
    rootTag,
    updatePayload
  );

  return tag;
}

function getViewTag(viewRef) {
  return ReactNativeTagHandles.mostRecentMountedNodeHandleForRootNodeID(viewRef._rootNodeID);
}

function getViewProps(viewRef) {
  return viewRef._currentElement.props;
}

function getViewValidAttributes(viewRef) {
  return viewRef.viewConfig.validAttributes;
}

function getRootViewTag(viewRef) {
  var nativeTopRootID = ReactNativeTagHandles.getNativeTopRootIDFromNodeID(viewRef._rootNodeID);
  return ReactNativeTagHandles.rootNodeIDToTag[nativeTopRootID];
}

function poolKey(viewRef) {
  var viewClass = viewRef.viewConfig.uiViewClassName;
  if (Platform.OS === 'android' && viewClass === 'RCTView') {
    return isCollapsable(viewRef) ? 'CollapsedRCTView' : 'RCTView';
  }
  return viewClass;
}

class ReactNativeViewPool {
  constructor() {
    this._pool = {};
    this._poolQueue = {};
    this._addToPool = [[],[],[]];
    this._viewsToDelete = [];
    if (__DEV__) {
      this._recycleStats = {};
      this._deleteStats = {};
    }
  }

  onReconcileTransactionClose() {
    // flush all deletes, move object from pool_queue to the actual pool
    if (this._viewsToDelete.length > 0) {
      RCTUIManager.dropViews(this._viewsToDelete);
    }
    var addToPoolTags = this._addToPool[TAGS_IDX];
    var addToPoolKeys = this._addToPool[KEYS_IDX];
    var addToPoolProps = this._addToPool[PROPS_IDX];
    for (var i = addToPoolTags.length - 1; i >= 0; i--) {
      var nativeTag = addToPoolTags[i];
      var key = addToPoolKeys[i];
      var props = addToPoolProps[i];
      var views = this._pool[key] || [[],[]];
      views[0].push(nativeTag);
      views[1].push(props);
      this._pool[key] = views;
    }
    this._viewsToDelete = [];
    this._addToPool = [[],[],[]];
    this._poolQueue = {};
  }

  acquire(viewRef, rootTag) {
    var key = poolKey(viewRef);
    if ((this._pool[key] || EMPTY_POOL)[0].length) {
      var views = this._pool[key];
      var nativeTag = views[0].pop();
      var oldProps = views[1].pop();
      var updatePayload = ReactNativeAttributePayload.diff(
        oldProps,
        getViewProps(viewRef),
        getViewValidAttributes(viewRef)
      );
      if (__DEV__) {
        this._recycleStats[key] = (this._recycleStats[key] || 0) + 1;
      }

      if (updatePayload) {
        RCTUIManager.updateView(
          nativeTag,
          viewRef.viewConfig.uiViewClassName,
          updatePayload
        );
      }
      return nativeTag;
    } else {
      // If there is no view available for the given pool key, we just enqueue call to create one
      return enqueueCreate(viewRef, rootTag);
    }
  }

  release(viewRef) {
    var key = poolKey(viewRef);
    var nativeTag = getViewTag(viewRef);
    var pooledCount = (this._pool[key] || EMPTY_POOL)[0].length + (this._poolQueue[key] || 0);
    if (pooledCount < (_poolSize[key] || 0)) {
      // we have room in the pool for this view
      // we can add it to the queue so that it will be added to the actual pull in
      // onReconcileTransactionClose
      this._addToPool[TAGS_IDX].push(nativeTag);
      this._addToPool[KEYS_IDX].push(key);
      this._addToPool[PROPS_IDX].push(getViewProps(viewRef));
      this._poolQueue[key] = (this._poolQueue[key] || 0) + 1;
    } else {
      if (__DEV__) {
        if (_poolSize[key]) {
          this._deleteStats[key] = (this._deleteStats[key] || 0) + 1;
        }
      }
      this._viewsToDelete.push(nativeTag);
    }
  }

  clear() {
    for (var key in this._pool) {
      var poolTags = this._pool[key][0];
      for (var i = poolTags.length - 1; i >= 0; i--) {
        this._viewsToDelete.push(poolTags[i]);
      }
    }
    var addToPoolTags = this._addToPool[0];
    for (var i = addToPoolTags.length - 1; i >= 0; i--) {
      this._viewsToDelete.push(addToPoolTags[i]);
    }
    this._addToPool = [[],[],[]];
    this.onReconcileTransactionClose();
  }

  printStats() {
    if (__DEV__) {
      console.log('Stats', this._recycleStats, this._deleteStats);
    }
  }
}

module.exports = {

  onReconcileTransactionClose: function() {
    if (ENABLED) {
      for (var pool in _pools) {
        _pools[pool].onReconcileTransactionClose();
      }
    }
  },

  acquire: function(viewRef) {
    var rootTag = getRootViewTag(viewRef);
    if (ENABLED) {
      var pool = _pools[rootTag];
      if (!pool) {
        pool = _pools[rootTag] = new ReactNativeViewPool();
      }
      return pool.acquire(viewRef, rootTag);
    } else {
      return enqueueCreate(viewRef, rootTag);
    }
  },

  release: ENABLED ? function(viewRef) {
    var pool = _pools[getRootViewTag(viewRef)];
    if (pool) {
      pool.release(viewRef);
    }
  } : emptyFunction,

  clearPoolForRootView: ENABLED ? function(rootID) {
    var pool = _pools[rootID];
    if (pool) {
      pool.clear();
      delete _pools[rootID];
    }
  } : emptyFunction,

  configure: function(pool_size) {
    _poolSize = pool_size;
  },

  printStats: function() {
    if (__DEV__) {
      console.log('Pool size', _poolSize);
      for (var pool in _pools) {
        _pools[pool].onReconcileTransactionClose();
      }
    }
  },
};
