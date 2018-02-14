/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule InteractionMixin
 * @flow
 */
'use strict';

var InteractionManager = require('InteractionManager');

/**
 * This mixin provides safe versions of InteractionManager start/end methods
 * that ensures `clearInteractionHandle` is always called
 * once per start, even if the component is unmounted.
 */
var InteractionMixin = {
  componentWillUnmount: function() {
    while (this._interactionMixinHandles.length) {
      InteractionManager.clearInteractionHandle(
        this._interactionMixinHandles.pop()
      );
    }
  },

  _interactionMixinHandles: ([]: Array<number>),

  createInteractionHandle: function() {
    var handle = InteractionManager.createInteractionHandle();
    this._interactionMixinHandles.push(handle);
    return handle;
  },

  clearInteractionHandle: function(clearHandle: number) {
    InteractionManager.clearInteractionHandle(clearHandle);
    this._interactionMixinHandles = this._interactionMixinHandles.filter(
      handle => handle !== clearHandle
    );
  },

  /**
   * Schedule work for after all interactions have completed.
   *
   * @param {function} callback
   */
  runAfterInteractions: function(callback: Function) {
    InteractionManager.runAfterInteractions(callback);
  },
};

module.exports = InteractionMixin;
