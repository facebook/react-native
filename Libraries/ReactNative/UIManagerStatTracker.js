/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */
'use strict';

const UIManager = require('UIManager');

let installed = false;
const UIManagerStatTracker = {
  install: function() {
    if (installed) {
      return;
    }
    installed = true;
    let statLogHandle;
    const stats = {};
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
    const createViewOrig = UIManager.createView;
    UIManager.createView = function(tag, className, rootTag, props) {
      incStat('createView', 1);
      /* $FlowFixMe(>=0.86.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.86 was deployed. To see the error, delete
       * this comment and run Flow. */
      incStat('setProp', Object.keys(props || []).length);
      createViewOrig(tag, className, rootTag, props);
    };
    const updateViewOrig = UIManager.updateView;
    UIManager.updateView = function(tag, className, props) {
      incStat('updateView', 1);
      /* $FlowFixMe(>=0.86.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.86 was deployed. To see the error, delete
       * this comment and run Flow. */
      incStat('setProp', Object.keys(props || []).length);
      updateViewOrig(tag, className, props);
    };
    const manageChildrenOrig = UIManager.manageChildren;
    UIManager.manageChildren = function(
      tag,
      moveFrom,
      moveTo,
      addTags,
      addIndices,
      remove,
    ) {
      incStat('manageChildren', 1);
      /* $FlowFixMe(>=0.86.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.86 was deployed. To see the error, delete
       * this comment and run Flow. */
      incStat('move', Object.keys(moveFrom || []).length);
      /* $FlowFixMe(>=0.86.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.86 was deployed. To see the error, delete
       * this comment and run Flow. */
      incStat('remove', Object.keys(remove || []).length);
      manageChildrenOrig(tag, moveFrom, moveTo, addTags, addIndices, remove);
    };
  },
};

module.exports = UIManagerStatTracker;
