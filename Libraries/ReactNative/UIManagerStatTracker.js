/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule UIManagerStatTracker
 * @flow
 */
'use strict';

var RCTUIManager = require('NativeModules').UIManager;

var performanceNow = require('performanceNow');

var installed = false;
var UIManagerStatTracker = {
  install: function() {
    if (installed) {
      return;
    }
    installed = true;
    var statLogHandle;
    var startTime = 0;
    var allTimeStats = {};
    var perFrameStats = {};
    function printStats() {
      console.log({UIManagerStatTracker: {
        allTime: allTimeStats,
        lastFrame: perFrameStats,
        elapsedMilliseconds: performanceNow() - startTime,
      }});
      statLogHandle = null;
      perFrameStats = {};
    }
    function incStat(key: string, increment: number) {
      allTimeStats[key] = (allTimeStats[key] || 0) + increment;
      perFrameStats[key] = (perFrameStats[key] || 0) + increment;
      if (!statLogHandle) {
        startTime = performanceNow();
        statLogHandle = window.requestAnimationFrame(printStats);
      }
    }
    var createViewOrig = RCTUIManager.createView;
    RCTUIManager.createView = function(tag, className, rootTag, props) {
      incStat('createView', 1);
      incStat('setProp', Object.keys(props || []).length);
      createViewOrig(tag, className, rootTag, props);
    };
    var updateViewOrig = RCTUIManager.updateView;
    RCTUIManager.updateView = function(tag, className, props) {
      incStat('updateView', 1);
      incStat('setProp', Object.keys(props || []).length);
      updateViewOrig(tag, className, props);
    };
    var manageChildrenOrig = RCTUIManager.manageChildren;
    RCTUIManager.manageChildren = function(tag, moveFrom, moveTo, addTags, addIndices, remove) {
      incStat('manageChildren', 1);
      incStat('move', Object.keys(moveFrom || []).length);
      incStat('remove', Object.keys(remove || []).length);
      manageChildrenOrig(tag, moveFrom, moveTo, addTags, addIndices, remove);
    };
  },
};

module.exports = UIManagerStatTracker;
