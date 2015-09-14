/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule InteractionManager
 * @flow
 */
'use strict';

var ErrorUtils = require('ErrorUtils');
var EventEmitter = require('EventEmitter');
var Set = require('Set');

var invariant = require('invariant');
var keyMirror = require('keyMirror');
var setImmediate = require('setImmediate');

type Handle = number;

var _emitter = new EventEmitter();
var _interactionSet = new Set();
var _addInteractionSet = new Set();
var _deleteInteractionSet = new Set();
var _nextUpdateHandle = null;
var _queue = [];
var _inc = 0;

/**
 * InteractionManager allows long-running work to be scheduled after any
 * interactions/animations have completed. In particular, this allows JavaScript
 * animations to run smoothly.
 *
 * Applications can schedule tasks to run after interactions with the following:
 *
 * ```
 * InteractionManager.runAfterInteractions(() => {
 *   // ...long-running synchronous task...
 * });
 * ```
 *
 * Compare this to other scheduling alternatives:
 *
 * - requestAnimationFrame(): for code that animates a view over time.
 * - setImmediate/setTimeout(): run code later, note this may delay animations.
 * - runAfterInteractions(): run code later, without delaying active animations.
 *
 * The touch handling system considers one or more active touches to be an
 * 'interaction' and will delay `runAfterInteractions()` callbacks until all
 * touches have ended or been cancelled.
 *
 * InteractionManager also allows applications to register animations by
 * creating an interaction 'handle' on animation start, and clearing it upon
 * completion:
 *
 * ```
 * var handle = InteractionManager.createInteractionHandle();
 * // run animation... (`runAfterInteractions` tasks are queued)
 * // later, on animation completion:
 * InteractionManager.clearInteractionHandle(handle);
 * // queued tasks run if all handles were cleared
 * ```
 */
var InteractionManager = {
  Events: keyMirror({
    interactionStart: true,
    interactionComplete: true,
  }),

  /**
   * Schedule a function to run after all interactions have completed.
   */
  runAfterInteractions(callback: Function) {
    invariant(
      typeof callback === 'function',
      'Must specify a function to schedule.'
    );
    scheduleUpdate();
    _queue.push(callback);
  },

  /**
   * Notify manager that an interaction has started.
   */
  createInteractionHandle(): Handle {
    scheduleUpdate();
    var handle = ++_inc;
    _addInteractionSet.add(handle);
    return handle;
  },

  /**
   * Notify manager that an interaction has completed.
   */
  clearInteractionHandle(handle: Handle) {
    invariant(
      !!handle,
      'Must provide a handle to clear.'
    );
    scheduleUpdate();
    _addInteractionSet.delete(handle);
    _deleteInteractionSet.add(handle);
  },

  addListener: _emitter.addListener.bind(_emitter),
};

/**
 * Schedule an asynchronous update to the interaction state.
 */
function scheduleUpdate() {
  if (!_nextUpdateHandle) {
    _nextUpdateHandle = setImmediate(processUpdate);
  }
}

/**
 * Notify listeners, process queue, etc
 */
function processUpdate() {
  _nextUpdateHandle = null;

  var interactionCount = _interactionSet.size;
  _addInteractionSet.forEach(handle =>
    _interactionSet.add(handle)
  );
  _deleteInteractionSet.forEach(handle =>
    _interactionSet.delete(handle)
  );
  var nextInteractionCount = _interactionSet.size;

  if (interactionCount !== 0 && nextInteractionCount === 0) {
    // transition from 1+ --> 0 interactions
    _emitter.emit(InteractionManager.Events.interactionComplete);
  } else if (interactionCount === 0 && nextInteractionCount !== 0) {
    // transition from 0 --> 1+ interactions
    _emitter.emit(InteractionManager.Events.interactionStart);
  }

  // process the queue regardless of a transition
  if (nextInteractionCount === 0) {
    var queue = _queue;
    _queue = [];
    queue.forEach(callback => {
      ErrorUtils.applyWithGuard(callback);
    });
  }

  _addInteractionSet.clear();
  _deleteInteractionSet.clear();
}

module.exports = InteractionManager;
