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

const BatchedBridge = require('BatchedBridge');
const EventEmitter = require('EventEmitter');
const Set = require('Set');
const TaskQueue = require('TaskQueue');

const invariant = require('fbjs/lib/invariant');
const keyMirror = require('fbjs/lib/keyMirror');
const setImmediate = require('setImmediate');

type Handle = number;
import type {Task} from 'TaskQueue';

const _emitter = new EventEmitter();

const DEBUG_DELAY = 0;

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
 *
 * `runAfterInteractions` takes either a plain callback function, or a
 * `PromiseTask` object with a `gen` method that returns a `Promise`.  If a
 * `PromiseTask` is supplied, then it is fully resolved (including asynchronous
 * dependencies that also schedule more tasks via `runAfterInteractions`) before
 * starting on the next task that might have been queued up synchronously
 * earlier.
 *
 * By default, queued tasks are executed together in a loop in one
 * `setImmediate` batch. If `setDeadline` is called with a positive number, then
 * tasks will only be executed until the deadline (in terms of js event loop run
 * time) approaches, at which point execution will yield via setTimeout,
 * allowing events such as touches to start interactions and block queued tasks
 * from executing, making apps more responsive.
 */
var InteractionManager = {
  Events: keyMirror({
    interactionStart: true,
    interactionComplete: true,
  }),

  /**
   * Schedule a function to run after all interactions have completed.
   */
  runAfterInteractions(task: ?Task): Promise {
    return new Promise(resolve => {
      _scheduleUpdate();
      if (task) {
        _taskQueue.enqueue(task);
      }
      const name = task && task.name || '?';
      _taskQueue.enqueue({run: resolve, name: 'resolve ' + name});
    });
  },

  /**
   * Notify manager that an interaction has started.
   */
  createInteractionHandle(): Handle {
    _scheduleUpdate();
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
    _scheduleUpdate();
    _addInteractionSet.delete(handle);
    _deleteInteractionSet.add(handle);
  },

  addListener: _emitter.addListener.bind(_emitter),

  /**
   * A positive number will use setTimeout to schedule any tasks after the
   * eventLoopRunningTime hits the deadline value, otherwise all tasks will be
   * executed in one setImmediate batch (default).
   */
  setDeadline(deadline: number) {
    _deadline = deadline;
  },
};

const _interactionSet = new Set();
const _addInteractionSet = new Set();
const _deleteInteractionSet = new Set();
const _taskQueue = new TaskQueue({onMoreTasks: _scheduleUpdate});
let _nextUpdateHandle = 0;
let _inc = 0;
let _deadline = -1;

/**
 * Schedule an asynchronous update to the interaction state.
 */
function _scheduleUpdate() {
  if (!_nextUpdateHandle) {
    if (_deadline > 0) {
      _nextUpdateHandle = setTimeout(_processUpdate, 0 + DEBUG_DELAY);
    } else {
      _nextUpdateHandle = setImmediate(_processUpdate);
    }
  }
}

/**
 * Notify listeners, process queue, etc
 */
function _processUpdate() {
  _nextUpdateHandle = 0;

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
    while (_taskQueue.hasTasksToProcess()) {
      _taskQueue.processNext();
      if (_deadline > 0 &&
          BatchedBridge.getEventLoopRunningTime() >= _deadline) {
        // Hit deadline before processing all tasks, so process more later.
        _scheduleUpdate();
        break;
      }
    }
  }
  _addInteractionSet.clear();
  _deleteInteractionSet.clear();
}

module.exports = InteractionManager;
