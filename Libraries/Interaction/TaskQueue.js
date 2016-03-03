/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TaskQueue
 * @flow
 */
'use strict';

const ErrorUtils = require('ErrorUtils');

const invariant = require('fbjs/lib/invariant');

type SimpleTask = {
  name: string;
  run: () => void;
};
type PromiseTask = {
  name: string;
  gen: () => Promise;
};
export type Task = Function | SimpleTask | PromiseTask;

/**
 * TaskQueue - A system for queueing and executing a mix of simple callbacks and
 * trees of dependent tasks based on Promises. No tasks are executed unless
 * `processNext` is called.
 *
 * `enqueue` takes a Task object with either a simple `run` callback, or a
 * `gen` function that returns a `Promise` and puts it in the queue.  If a gen
 * function is supplied, then the promise it returns will block execution of
 * tasks already in the queue until it resolves. This can be used to make sure
 * the first task is fully resolved (including asynchronous dependencies that
 * also schedule more tasks via `enqueue`) before starting on the next task.
 * The `onMoreTasks` constructor argument is used to inform the owner that an
 * async task has resolved and that the queue should be processed again.
 *
 * Note: Tasks are only actually executed with explicit calls to `processNext`.
 */
class TaskQueue {
  /**
   * TaskQueue instances are self contained and independent, so multiple tasks
   * of varying semantics and priority can operate together.
   *
   * `onMoreTasks` is invoked when `PromiseTask`s resolve if there are more
   * tasks to process.
   */
  constructor({onMoreTasks}: {onMoreTasks: () => void}) {
    this._onMoreTasks = onMoreTasks;
    this._queueStack = [{tasks: [], popable: false}];
  }

  /**
   * Add a task to the queue.  It is recommended to name your tasks for easier
   * async debugging. Tasks will not be executed until `processNext` is called
   * explicitly.
   */
  enqueue(task: Task): void {
    this._getCurrentQueue().push(task);
  }

  /**
   * Check to see if `processNext` should be called.
   *
   * @returns {boolean} Returns true if there are tasks that are ready to be
   * processed with `processNext`, or returns false if there are no more tasks
   * to be processed right now, although there may be tasks in the queue that
   * are blocked by earlier `PromiseTask`s that haven't resolved yet.
   * `onMoreTasks` will be called after each `PromiseTask` resolves if there are
   * tasks ready to run at that point.
   */
  hasTasksToProcess(): bool {
    return this._getCurrentQueue().length > 0;
  }

  /**
   * Executes the next task in the queue.
   */
  processNext(): void {
    let queue = this._getCurrentQueue();
    if (queue.length) {
      const task = queue.shift();
      try {
        if (task.gen) {
          this._genPromise((task: any)); // Rather than annoying tagged union
        } else if (task.run) {
          task.run();
        } else {
          invariant(
            typeof task === 'function',
            'Expected Function, SimpleTask, or PromiseTask, but got: ' +
              JSON.stringify(task)
          );
          task();
        }
      } catch (e) {
        e.message = 'TaskQueue: Error with task' + (task.name || ' ') + ': ' +
          e.message;
        ErrorUtils.reportError(e);
      }
    }
  }

  _queueStack: Array<{tasks: Array<Task>, popable: bool}>;
  _onMoreTasks: () => void;

  _getCurrentQueue(): Array<Task> {
    const stackIdx = this._queueStack.length - 1;
    const queue = this._queueStack[stackIdx];
    if (queue.popable &&
        queue.tasks.length === 0 &&
        this._queueStack.length > 1) {
      this._queueStack.pop();
      return this._getCurrentQueue();
    } else {
      return queue.tasks;
    }
  }

  _genPromise(task: PromiseTask) {
    // Each async task pushes it's own queue onto the queue stack. This
    // effectively defers execution of previously queued tasks until the promise
    // resolves, at which point we allow the new queue to be popped, which
    // happens once it is fully processed.
    this._queueStack.push({tasks: [], popable: false});
    const stackIdx = this._queueStack.length - 1;
    ErrorUtils.applyWithGuard(task.gen)
      .then(() => {
        this._queueStack[stackIdx].popable = true;
        this.hasTasksToProcess() && this._onMoreTasks();
      })
      .catch((ex) => {
        console.warn(
          'TaskQueue: Error resolving Promise in task ' + task.name,
          ex
        );
        throw ex;
      });
  }
}


module.exports = TaskQueue;
