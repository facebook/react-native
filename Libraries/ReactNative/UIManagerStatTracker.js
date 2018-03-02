/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule UIManagerStatTracker
 * @flow
 * @format
 */
'use strict';

var UIManager = require('UIManager');

var installed = false;
var UIManagerStatTracker = {
  install: function() {
    if (installed) {
      return;
    }
    installed = true;
    var statLogHandle;
    var stats = {};
    function printStats() {
      console.log({UIManagerStatTracker: stats});
      statLogHandle = null;
    }
    function incStat(key: string, increment: number) {
      stats[key] = (stats[key] || 0) + increment;
      if (!statLogHandle) {
        statLogHandle = setImmediate(printStats);
      }
    }
    var createViewOrig = UIManager.createView;
    UIManager.createView = function(tag, className, rootTag, props) {
      incStat('createView', 1);
      incStat('setProp', Object.keys(props || []).length);
      createViewOrig(tag, className, rootTag, props);
    };
    var updateViewOrig = UIManager.updateView;
    UIManager.updateView = function(tag, className, props) {
      incStat('updateView', 1);
      incStat('setProp', Object.keys(props || []).length);
      updateViewOrig(tag, className, props);
    };
    var manageChildrenOrig = UIManager.manageChildren;
    UIManager.manageChildren = function(
      tag,
      moveFrom,
      moveTo,
      addTags,
      addIndices,
      remove,
    ) {
      incStat('manageChildren', 1);
      incStat('move', Object.keys(moveFrom || []).length);
      incStat('remove', Object.keys(remove || []).length);
      manageChildrenOrig(tag, moveFrom, moveTo, addTags, addIndices, remove);
    };
  },
};

module.exports = UIManagerStatTracker;
